// Consulta status PIX na Centurion Pay BR (GET /api/v1/transactions/pix-in?id=...)
// e atualiza orders centurionpayv2 pending/paid — igual ideia do reconcile Pagou.ai.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const API_BASE = "https://api.centurionpaybr.com.br";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DEFAULT_UA = "CentauroCheckout/1.0 (+sac@centauro.com.br)";

function basicAuthHeader(apiKey: string, publicKey: string): string {
  const combined = `${apiKey.trim()}:${publicKey.trim()}`;
  const bytes = new TextEncoder().encode(combined);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return "Basic " + btoa(bin);
}

function normalizeCenturionStatus(raw?: string | null): string {
  const v = String(raw || "").toLowerCase();
  if (v === "paid") return "paid";
  if (v === "pending") return "pending";
  if (v === "expired") return "expired";
  if (
    ["cancelled", "failed", "refunded", "partially_refunded"].includes(v)
  ) return "cancelled";
  return "pending";
}

type OrderRow = {
  id: string;
  external_id: string | null;
  status: string;
};

type Body = { orderId?: string; limit?: number };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = (await req.json().catch(() => ({}))) as Body;
    const limit = Math.min(Math.max(body.limit || 20, 1), 100);

    const { data: config, error: configErr } = await supabase
      .from("gateway_config")
      .select(
        "centurionpay_v2_api_key, centurionpay_v2_public_key, centurionpay_v2_user_agent",
      )
      .limit(1)
      .maybeSingle();

    const apiKey = String(config?.centurionpay_v2_api_key || "").trim();
    const publicKey = String(config?.centurionpay_v2_public_key || "").trim();
    const userAgent =
      String(config?.centurionpay_v2_user_agent || "").trim() || DEFAULT_UA;

    if (configErr || !apiKey || !publicKey) {
      return new Response(
        JSON.stringify({
          ok: true,
          skipped: true,
          reason: "centurion_v2_not_configured",
          results: [],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let query = supabase
      .from("orders")
      .select("id, external_id, status")
      .eq("gateway", "centurionpayv2")
      .not("external_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (body.orderId) {
      query = query.eq("id", body.orderId);
    } else {
      query = query.in("status", ["pending", "paid"]);
    }

    const { data: orders, error: ordersErr } = await query;
    if (ordersErr) throw ordersErr;

    const auth = basicAuthHeader(apiKey, publicKey);
    const results: Array<Record<string, unknown>> = [];

    for (const order of (orders || []) as OrderRow[]) {
      const ext = order.external_id?.trim() || "";
      if (!UUID_RE.test(ext)) {
        results.push({
          orderId: order.id,
          externalId: ext,
          ok: false,
          error: "external_id_not_uuid",
        });
        continue;
      }

      try {
        const url = `${API_BASE}/api/v1/transactions/pix-in?id=${encodeURIComponent(ext)}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: auth,
            "User-Agent": userAgent,
            Accept: "application/json",
          },
        });

        const payload = await response.json().catch(() => null) as Record<
          string,
          unknown
        > | null;

        if (!response.ok || !payload) {
          results.push({
            orderId: order.id,
            externalId: ext,
            ok: false,
            error: payload?.message || payload?.error ||
              `http_${response.status}`,
          });
          continue;
        }

        const providerStatus = typeof payload.status === "string"
          ? payload.status
          : null;
        const normalizedStatus = normalizeCenturionStatus(providerStatus);
        const currentStatus = order.status || "pending";
        let changed = false;

        if (normalizedStatus !== currentStatus) {
          const { error: updateError } = await supabase
            .from("orders")
            .update({
              status: normalizedStatus,
              gateway_response: payload,
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id);

          if (updateError) {
            results.push({
              orderId: order.id,
              externalId: ext,
              ok: false,
              error: updateError.message,
              providerStatus,
            });
            continue;
          }

          changed = true;
          if (normalizedStatus === "paid") {
            const { error: dispErr } = await supabase.functions.invoke(
              "dispatch-paid-notifications",
              { body: { orderId: order.id } },
            );
            if (dispErr) {
              console.error(
                "dispatch-paid-notifications (centurion v2):",
                dispErr,
              );
            }
          }
        } else if (normalizedStatus === "paid" && currentStatus === "paid") {
          await supabase
            .from("orders")
            .update({
              gateway_response: payload,
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id);
        }

        results.push({
          orderId: order.id,
          externalId: ext,
          ok: true,
          providerStatus,
          normalizedStatus,
          changed,
        });
      } catch (e) {
        results.push({
          orderId: order.id,
          externalId: ext,
          ok: false,
          error: String(e),
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("reconcile-centurionpay-v2-payments:", error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
