// Dispara Utmify (paid) + webhooks venda_aprovada + Facebook CAPI Purchase — no máximo 1x por pedido.
// Só prossegue se RPC try_claim_paid_notification retornar true (pedido status=paid e ainda sem paid_notified_at).
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.3";

async function hashStr(text: string) {
  if (!text) return undefined;
  const msgUint8 = new TextEncoder().encode(text.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { orderId?: string };
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
    if (!orderId) {
      return json({ ok: false, error: "orderId obrigatório" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: claimed, error: claimErr } = await supabase.rpc(
      "try_claim_paid_notification",
      { p_order_id: orderId },
    );

    if (claimErr) {
      console.error("try_claim_paid_notification:", claimErr);
      return json({ ok: false, error: claimErr.message }, 500);
    }

    if (!claimed) {
      return json({ ok: true, skipped: true, reason: "already_notified_or_not_paid" });
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      console.error("dispatch-paid-notifications: order not found", orderErr);
      return json({ ok: false, error: "order_not_found" }, 404);
    }

    const totalCents = (order.amount_cents || 0) + (order.shipping_cost_cents || 0);
    const amountBrl = totalCents > 0 ? totalCents / 100 : (order.amount_cents || 0) / 100;

    const { data: config } = await supabase
      .from("gateway_config")
      .select("utmify_api_token, utmify_api_token_2, facebook_pixel_id, facebook_access_token")
      .limit(1)
      .maybeSingle();

    const tokens = [config?.utmify_api_token, config?.utmify_api_token_2].filter(
      (t): t is string => typeof t === "string" && t.trim().length > 0,
    );

    const nowSql = () => new Date().toISOString().replace("T", " ").substring(0, 19);

    if (tokens.length > 0) {
      const tracking = (order.tracking || {}) as Record<string, unknown>;
      const utmifyPayload = {
        orderId: order.id,
        platform: "quiz-copa-2026",
        paymentMethod: order.pix_code ? "pix" : "credit_card",
        status: "paid",
        createdAt: new Date(order.created_at).toISOString().replace("T", " ").substring(0, 19),
        approvedDate: nowSql(),
        refundedAt: null,
        customer: {
          name: order.buyer_name || "Cliente",
          email: order.buyer_email || "cliente@example.com",
          phone: order.buyer_phone || null,
          document: order.buyer_document || null,
        },
        products: [
          {
            id: "copa-2026-order",
            name: order.items_description || "Pedido",
            planId: null,
            planName: null,
            quantity: 1,
            priceInCents: totalCents || order.amount_cents || 0,
          },
        ],
        trackingParameters: {
          src: tracking.src ?? null,
          sck: tracking.sck ?? null,
          utm_source: order.utm_source ?? null,
          utm_campaign: order.utm_campaign ?? null,
          utm_medium: order.utm_medium ?? null,
          utm_content: order.utm_content ?? null,
          utm_term: order.utm_term ?? null,
        },
        commission: {
          totalPriceInCents: totalCents || order.amount_cents || 0,
          gatewayFeeInCents: 0,
          userCommissionInCents: totalCents || order.amount_cents || 0,
          currency: "BRL",
        },
      };

      const { error: utErr } = await supabase.functions.invoke("utmify-notify", {
        body: { tokens, payload: utmifyPayload },
      });
      if (utErr) console.error("utmify-notify invoke error:", utErr);
    }

    const { data: hooks } = await supabase
      .from("webhook_endpoints")
      .select("url, events")
      .eq("active", true);

    const targets = (hooks || []).filter((w: { url?: string; events?: string[] }) =>
      w.url?.trim() && Array.isArray(w.events) && w.events.includes("venda_aprovada")
    );

    const webhookPayload = {
      event: "venda_aprovada",
      timestamp: new Date().toISOString(),
      orderId: order.id,
      buyerName: order.buyer_name,
      buyerEmail: order.buyer_email,
      buyerPhone: order.buyer_phone,
      amount: amountBrl,
      gateway: order.gateway,
    };

    for (const h of targets) {
      try {
        await fetch(h.url!, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        });
      } catch (e) {
        console.error("webhook venda_aprovada error:", e);
      }
    }

    const fbPixelId = config?.facebook_pixel_id || "";
    const fbToken = config?.facebook_access_token || "";

    if (fbPixelId && fbToken) {
      const userData: Record<string, unknown> = {
        em: order.buyer_email ? [await hashStr(order.buyer_email)] : undefined,
        ph: order.buyer_phone ? [await hashStr(String(order.buyer_phone).replace(/\D/g, ""))] : undefined,
        client_ip_address: order.client_ip || "0.0.0.0",
        client_user_agent: order.client_user_agent || undefined,
      };
      if (order.fbp) userData.fbp = order.fbp;
      if (order.fbc) userData.fbc = order.fbc;

      const fbEvent = {
        data: [{
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          event_id: order.id,
          action_source: "website",
          event_source_url: order.source_url || undefined,
          user_data: userData,
          custom_data: {
            value: amountBrl,
            currency: "BRL",
            content_name: order.items_description || "Pedido",
            content_ids: [order.id],
            utm_source: order.utm_source || undefined,
            utm_campaign: order.utm_campaign || undefined,
            utm_medium: order.utm_medium || undefined,
            utm_content: order.utm_content || undefined,
            utm_term: order.utm_term || undefined,
          },
        }],
      };

      try {
        const fbRes = await fetch(
          `https://graph.facebook.com/v19.0/${fbPixelId}/events?access_token=${fbToken}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fbEvent) },
        );
        const txt = await fbRes.text().catch(() => "");
        console.log("Facebook CAPI:", fbRes.status, txt.slice(0, 300));
      } catch (fbErr) {
        console.error("Facebook CAPI error:", fbErr);
      }
    }

    return json({ ok: true });
  } catch (e) {
    console.error("dispatch-paid-notifications:", e);
    return json({ ok: false, error: String(e) }, 500);
  }
});
