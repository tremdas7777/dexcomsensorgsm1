// Funnel event tracking via Supabase `funnel_events`.
// Funil da loja: visitante → produto → carrinho → checkout (interno ou externo) → compra (PIX no site).

import { supabase } from '@/integrations/supabase/client';

export type FunnelEvent =
  | 'visitor'
  | 'store_product_view'
  | 'store_cart'
  | 'checkout'
  | 'checkout_step_1'
  | 'checkout_step_2'
  | 'checkout_step_3'
  | 'external_checkout'
  | 'purchase'
  /** Legado (quiz / campanhas antigas) — ainda gravado se essas telas forem usadas. */
  | 'quiz_started'
  | 'quiz_completed'
  | 'scratch_card';

const SESSION_KEY = 'funnel_session_id';
const STORE_CART_ONCE_KEY = 'funnel_store_cart_once';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function trackEvent(event: FunnelEvent) {
  try {
    await supabase.from('funnel_events').insert({
      event,
      session_id: getSessionId(),
    });
  } catch (err) {
    console.warn('Failed to track funnel event:', err);
  }
}

/** Uma vez por aba: carrinho com itens (add ou página /carrinho). */
export function trackStoreCartEngagement() {
  try {
    if (sessionStorage.getItem(STORE_CART_ONCE_KEY)) return;
    sessionStorage.setItem(STORE_CART_ONCE_KEY, '1');
  } catch {
    /* modo privado */
  }
  void trackEvent('store_cart');
}

export type FunnelStats = {
  visitors: number;
  storeProductView: number;
  storeCart: number;
  checkout: number;
  externalCheckout: number;
  purchase: number;
  activeNow: number;
  checkoutStep1: number;
  checkoutStep2: number;
  checkoutStep3: number;
};

const emptyStats = (): FunnelStats => ({
  visitors: 0,
  storeProductView: 0,
  storeCart: 0,
  checkout: 0,
  externalCheckout: 0,
  purchase: 0,
  activeNow: 0,
  checkoutStep1: 0,
  checkoutStep2: 0,
  checkoutStep3: 0,
});

export async function getFunnelStats(periodMinutes: number): Promise<FunnelStats> {
  const cutoff = new Date(Date.now() - periodMinutes * 60 * 1000).toISOString();
  const activeNowCutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('funnel_events')
    .select('event, created_at')
    .gte('created_at', cutoff);

  if (error) {
    console.warn('Failed to fetch funnel stats:', error);
    return emptyStats();
  }

  const events = data || [];
  const visitors = events.filter((e) => e.event === 'visitor').length;
  const storeProductView = events.filter((e) => e.event === 'store_product_view').length;
  const storeCart = events.filter((e) => e.event === 'store_cart').length;
  const checkout = events.filter((e) => e.event === 'checkout').length;
  const externalCheckout = events.filter((e) => e.event === 'external_checkout').length;
  const purchase = events.filter((e) => e.event === 'purchase').length;
  const activeNow = events.filter((e) => e.created_at >= activeNowCutoff).length;
  const checkoutStep1 = events.filter((e) => e.event === 'checkout_step_1').length;
  const checkoutStep2 = events.filter((e) => e.event === 'checkout_step_2').length;
  const checkoutStep3 = events.filter((e) => e.event === 'checkout_step_3').length;

  return {
    visitors,
    storeProductView,
    storeCart,
    checkout,
    externalCheckout,
    purchase,
    activeNow,
    checkoutStep1,
    checkoutStep2,
    checkoutStep3,
  };
}

export async function clearFunnelEvents() {
  console.log('Clear funnel events - data persists in database');
}
