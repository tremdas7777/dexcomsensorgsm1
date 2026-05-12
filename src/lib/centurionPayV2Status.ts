import { supabase } from '@/integrations/supabase/client';

interface SyncOptions {
  orderId?: string;
  limit?: number;
}

/** Atualiza pedidos Centurion Pay BR consultando GET /api/v1/transactions/pix-in */
export async function syncCenturionPayV2Payments(options: SyncOptions = {}) {
  try {
    const { data, error } = await supabase.functions.invoke(
      'reconcile-centurionpay-v2-payments',
      {
        body: {
          orderId: options.orderId,
          limit: options.limit,
        },
      },
    );

    if (error) {
      console.error('Centurion BR reconcile error:', error);
      return null;
    }

    return data ?? null;
  } catch (error) {
    console.error('Centurion BR reconcile exception:', error);
    return null;
  }
}
