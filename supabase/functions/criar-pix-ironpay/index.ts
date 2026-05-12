// Edge function: criar PIX via IronPay
// Recebe dados do checkout, chama a API da IronPay e retorna pix_code + qr_code_base64
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.100.0/cors";

interface RequestBody {
  apiToken: string;
  hashId?: string;
  amount: number; // BRL (ex: 44.90)
  buyerName: string;
  buyerEmail: string;
  buyerDocument: string; // CPF (somente dígitos)
  buyerPhone?: string;
  itemsDescription?: string;
  externalRef?: string;
}

const IRONPAY_BASE = "https://api.ironpayapp.com.br/api/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const {
      apiToken,
      hashId: hashIdRaw,
      amount,
      buyerName,
      buyerEmail,
      buyerDocument,
      buyerPhone,
      itemsDescription,
      externalRef,
    } = body;

    const hashId = typeof hashIdRaw === "string" ? hashIdRaw.trim() : "";

    if (!apiToken) {
      return json({ error: "apiToken obrigatório" }, 400);
    }
    if (!amount || amount <= 0) {
      return json({ error: "amount inválido" }, 400);
    }
    if (!buyerName || !buyerEmail || !buyerDocument) {
      return json({ error: "Dados do comprador incompletos" }, 400);
    }

    const document = String(buyerDocument).replace(/\D/g, "");
    const phone = (buyerPhone || "").replace(/\D/g, "") || "11999999999";
    const amountCents = Math.round(amount * 100);

    const payload = {
      paymentMethod: "pix",
      amount: amountCents,
      installments: 1,
      customer: {
        name: buyerName,
        email: buyerEmail,
        document: { type: document.length > 11 ? "cnpj" : "cpf", number: document },
        phone,
      },
      items: [
        {
          title: itemsDescription || "Produto",
          unitPrice: amountCents,
          quantity: 1,
          tangible: false,
        },
      ],
      externalRef: externalRef || `order-${Date.now()}`,
      pix: { expiresInDays: 1 },
    };

    const auth = "Basic " + btoa(`${apiToken}:x`);

    // Contas white-label usam subdomínio https://{hash}.ironpayapp.com.br
    const baseUrl = hashId.length > 0
      ? `https://${hashId}.ironpayapp.com.br/api/v1`
      : IRONPAY_BASE;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: auth,
    };
    if (hashId.length > 0) {
      headers["x-hash-id"] = hashId;
    }

    const resp = await fetch(`${baseUrl}/transactions`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!resp.ok) {
      console.error("IronPay error:", resp.status, text);
      return json(
        { error: data?.message || data?.error || "Erro IronPay", status: resp.status, details: data },
        500,
      );
    }

    const pixCode = data?.pix?.qrcode || data?.pix?.payload || data?.qrcode || "";
    const qrCodeBase64 = data?.pix?.qrcodeBase64 || data?.pix?.qr_code_base64 || data?.qrcodeBase64 || "";
    const externalId = data?.id || data?.transactionId || data?.transaction?.id || "";

    // Persist order in DB
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.103.3");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: orderRow, error: dbError } = await supabase
      .from("orders")
      .insert({
        external_id: externalId,
        gateway: "ironpay",
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
        pix_qr_code_base64: qrCodeBase64,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("DB insert error:", dbError);
      return json(
        {
          success: false,
          error: `PIX gerado na IronPay, mas falhou ao salvar o pedido: ${dbError.message}`,
          pixCode,
          qrCodeBase64,
          externalId,
          raw: data,
        },
        500,
      );
    }

    return json({
      success: true,
      order_id: orderRow?.id || null,
      externalId,
      pixCode,
      qrCodeBase64,
      raw: data,
    });
  } catch (err) {
    console.error("criar-pix-ironpay error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}
