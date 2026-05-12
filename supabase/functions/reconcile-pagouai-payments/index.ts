import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, serviceKey);

type OrderRow = {
  id: string;
  external_id: string | null;
  status: string;
  gateway: string;
  amount_cents: number;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  buyer_document: string | null;
  items_description: string | null;
  created_at: string;
  pix_code?: string | null;
  tracking?: Record<string, unknown> | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
  utm_medium?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  client_user_agent?: string | null;
  client_ip?: string | null;
  source_url?: string | null;
};

type ReconcileBody = {
  orderId?: string;
  limit?: number;
};

function normalizeStatus(status?: string | null) {
  const value = (status || '').toLowerCase();
  if (['paid', 'captured'].includes(value)) return 'paid';
  if (['refused'].includes(value)) return 'cancelled';
  if (['canceled', 'cancelled', 'expired'].includes(value)) return value === 'expired' ? 'expired' : 'cancelled';
  return 'pending';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as ReconcileBody;
    const limit = Math.min(Math.max(body.limit || 20, 1), 100);

    const { data: config, error: configError } = await supabase
      .from('gateway_config')
      .select('pagouai_secret_key')
      .limit(1)
      .single();

    if (configError || !config?.pagouai_secret_key) {
      return new Response(JSON.stringify({ ok: false, error: 'pagouai_not_configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let query = supabase
      .from('orders')
      .select('id, external_id, status, gateway, amount_cents, buyer_name, buyer_email, buyer_phone, buyer_document, items_description, created_at, pix_code, tracking, utm_source, utm_campaign, utm_medium, utm_content, utm_term, fbp, fbc, client_user_agent, client_ip, source_url')
      .eq('gateway', 'pagouai')
      .not('external_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (body.orderId) {
      query = query.eq('id', body.orderId);
    } else {
      query = query.in('status', ['pending', 'paid']);
    }

    const { data: orders, error: ordersError } = await query;
    if (ordersError) throw ordersError;

    const results: Array<Record<string, unknown>> = [];

    for (const order of (orders || []) as OrderRow[]) {
      try {
        const response = await fetch(`https://api.pagou.ai/v2/transactions/${order.external_id}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${config.pagouai_secret_key}`,
            'Content-Type': 'application/json',
          },
        });

        const payload = await response.json().catch(() => null);
        const tx = payload?.data || payload;
        const providerStatus = tx?.status || payload?.status || null;

        if (!response.ok || !providerStatus) {
          results.push({ orderId: order.id, externalId: order.external_id, ok: false, error: payload?.detail || payload?.message || `http_${response.status}` });
          continue;
        }

        const normalizedStatus = normalizeStatus(providerStatus);
        const currentStatus = order.status || 'pending';
        let changed = false;

        if (normalizedStatus !== currentStatus) {
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: normalizedStatus,
              gateway_response: payload,
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);

          if (updateError) {
            results.push({ orderId: order.id, externalId: order.external_id, ok: false, error: updateError.message, providerStatus });
            continue;
          }

          changed = true;
          if (normalizedStatus === 'paid') {
            const { error: dispErr } = await supabase.functions.invoke('dispatch-paid-notifications', {
              body: { orderId: order.id },
            });
            if (dispErr) console.error('dispatch-paid-notifications:', dispErr);
          }
        } else if (normalizedStatus === 'paid' && currentStatus === 'paid') {
          await supabase
            .from('orders')
            .update({ gateway_response: payload, updated_at: new Date().toISOString() })
            .eq('id', order.id);
        }

        results.push({
          orderId: order.id,
          externalId: order.external_id,
          ok: true,
          providerStatus,
          normalizedStatus,
          changed,
        });
      } catch (error) {
        results.push({ orderId: order.id, externalId: order.external_id, ok: false, error: String(error) });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('reconcile-pagouai-payments error:', error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});