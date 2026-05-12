import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Pagou Webhook Payload:", JSON.stringify(payload, null, 2));

    const eventData = payload.data;
    if (!eventData || !eventData.id) {
      return new Response(JSON.stringify({ error: "missing_event_id" }), { status: 400 });
    }

    const txId = eventData.id;
    const rawStatus = String(eventData.status || payload.data?.object?.status || "").toLowerCase();
    // Só trata como pago com status explícito da Pagou.ai (evita eventos ambíguos).
    const isPaid = rawStatus === "paid" || rawStatus === "captured";

    if (!isPaid) {
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order, error } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("external_id", txId)
      .select("*")
      .single();

    if (error || !order) {
      console.error("Order not found or update error:", error);
      return new Response(JSON.stringify({ received: true, note: "order_not_found" }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    console.log(`Order ${order.id} marked paid — dispatch notifications`);

    const { error: dispErr } = await supabase.functions.invoke("dispatch-paid-notifications", {
      body: { orderId: order.id },
    });
    if (dispErr) console.error("dispatch-paid-notifications:", dispErr);

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
