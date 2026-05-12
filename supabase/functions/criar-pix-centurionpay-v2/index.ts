// Edge function: criar PIX via Centurion Pay BR (api.centurionpaybr.com.br)
// POST /api/v1/transactions — Basic base64(apiKey:publicKey), User-Agent obrigatório (doc oficial).
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.100.0/cors";

interface RequestBody {
  apiKey: string;
  publicKey: string;
  userAgent?: string;
  amount: number; // BRL (ex: 44.90)
  buyerName: string;
  buyerEmail: string;
  buyerDocument: string;
  buyerPhone?: string;
  itemsDescription?: string;
  externalRef?: string;
  metadata?: Record<string, unknown>;
}

const API_BASE = "https://api.centurionpaybr.com.br";

function normalizeBrPhone(raw: string | undefined): string {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  if (d.length > 11) d = d.slice(-11);
  if (d.length < 10 || d.length > 11) d = "11999999999";
  return d;
}

const DEFAULT_UA = "CentauroCheckout/1.0 (+sac@centauro.com.br)";

/** Basic Auth seguro em UTF-8 (btoa nativo quebra com caracteres fora de Latin-1). */
function basicAuthHeader(apiKey: string, publicKey: string): string {
  const combined = `${apiKey.trim()}:${publicKey.trim()}`;
  const bytes = new TextEncoder().encode(combined);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return "Basic " + btoa(bin);
}

/** HTTP 200 + JSON para o invoke do app sempre receber `data` (sem FunctionsHttpError por status 4xx/5xx). */
function reply(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const {
      apiKey,
      publicKey,
      userAgent: uaRaw,
      amount,
      buyerName,
      buyerEmail,
      buyerDocument,
      buyerPhone,
      itemsDescription,
      externalRef,
      metadata,
    } = body;

    const userAgent = (typeof uaRaw === "string" && uaRaw.trim().length > 0)
      ? uaRaw.trim()
      : DEFAULT_UA;

    if (!apiKey?.trim() || !publicKey?.trim()) {
      return reply({ success: false, error: "apiKey e publicKey obrigatórios" });
    }
    if (!amount || amount <= 0) {
      return reply({ success: false, error: "amount inválido" });
    }
    if (!buyerName || !buyerEmail || !buyerDocument) {
      return reply({ success: false, error: "Dados do comprador incompletos" });
    }

    const document = String(buyerDocument).replace(/\D/g, "");
    const phone = normalizeBrPhone(buyerPhone);
    const amountCents = Math.round(amount * 100);
    const ref = externalRef || `order-${Date.now()}`;

    const payload: Record<string, unknown> = {
      amount: amountCents,
      paymentMethod: "pix",
      customer: {
        name: buyerName,
        email: buyerEmail,
        phone,
        document: {
          number: document,
          type: document.length > 11 ? "cnpj" : "cpf",
        },
      },
      items: [
        {
          title: itemsDescription || "Produto",
          unitPrice: amountCents,
          quantity: 1,
          tangible: false,
        },
      ],
      externalRef: ref,
      pix: { expiresInDays: 2 },
    };

    if (metadata && typeof metadata === "object") {
      payload.metadata = metadata;
    }

    const auth = basicAuthHeader(apiKey, publicKey);

    const resp = await fetch(`${API_BASE}/api/v1/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
        "User-Agent": userAgent,
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = { raw: text };
    }

    if (!resp.ok) {
      console.error("Centurion Pay BR error:", resp.status, text);
      let msg =
        typeof data?.message === "string"
          ? data.message
          : typeof data?.error === "string"
          ? data.error
          : "Erro Centurion Pay BR";
      const details = data?.details;
      if (Array.isArray(details) && details.length > 0) {
        const first = details[0] as Record<string, unknown>;
        if (typeof first?.message === "string") {
          msg = msg === "Erro Centurion Pay BR" ? first.message : `${msg}: ${first.message}`;
        }
      }
      return reply({
        success: false,
        error: msg,
        upstreamStatus: resp.status,
        details: data,
      });
    }

    const pix = data?.pix as Record<string, unknown> | undefined;
    const pixCode =
      (typeof pix?.qrcode === "string" && pix.qrcode) ||
      (typeof pix?.qrCode === "string" && pix.qrCode) ||
      (typeof pix?.payload === "string" && pix.payload) ||
      (typeof data?.qrcode === "string" && (data.qrcode as string)) ||
      "";
    const rawId = data?.id;
    const externalId = rawId != null ? String(rawId) : "";

    if (!pixCode.trim()) {
      console.warn("Centurion BR resposta sem qrcode:", JSON.stringify(data).slice(0, 500));
      return reply({
        success: false,
        error:
          "Centurion Pay BR não retornou código PIX (campo pix.qrcode). Confira a resposta em details.",
        externalId,
        details: data,
      });
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.103.3");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: orderRow, error: dbError } = await supabase
      .from("orders")
      .insert({
        external_id: externalId,
        gateway: "centurionpayv2",
        gateway_response: data,
        status: "pending",
        amount_cents: amountCents,
        shipping_method: "pac",
        shipping_cost_cents: amountCents,
        items_description: itemsDescription || "Produto",
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_document: document,
        buyer_phone: phone,
        pix_code: pixCode,
        pix_qr_code_base64: "",
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("DB insert error:", dbError);
      return reply({
        success: false,
        error: `PIX gerado no Centurion Pay BR, mas falhou ao salvar o pedido: ${dbError.message}`,
        pixCode,
        qrCodeBase64: "",
        externalId,
        raw: data,
      });
    }

    return reply({
      success: true,
      order_id: orderRow?.id || null,
      externalId,
      pixCode,
      qrCodeBase64: "",
      raw: data,
    });
  } catch (err) {
    console.error("criar-pix-centurionpay-v2 error:", err);
    return reply({ success: false, error: (err as Error).message });
  }
});
