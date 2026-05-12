// Global listener: envia Utmify pendente em todo pedido novo.
// Ao mudar para paid, chama dispatch-paid-notifications (idempotente via paid_notified_at no DB).
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sendUtmifyPending } from '@/lib/utmifyManager';

type OrderRow = {
  id: string;
  status: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  buyer_document: string | null;
  items_description: string | null;
  amount_cents: number | null;
  shipping_cost_cents: number | null;
};

export function useUtmifyAutoNotify() {
  const notifiedPending = useRef<Set<string>>(new Set());
  const notifiedPaidDispatch = useRef<Set<string>>(new Set());

  useEffect(() => {
    const channel = supabase
      .channel('orders-utmify-auto')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          const o = payload.new as OrderRow;
          if (!o?.id) return;
          if (notifiedPending.current.has(o.id)) return;
          notifiedPending.current.add(o.id);
          try {
            await sendUtmifyPending({
              orderId: o.id,
              customerName: o.buyer_name || 'Cliente',
              customerEmail: o.buyer_email || 'sem-email@cliente.com',
              customerPhone: o.buyer_phone,
              customerDocument: o.buyer_document || undefined,
              productName: o.items_description || 'bola de futebol',
              priceInCents: o.amount_cents,
            });
          } catch (e) {
            console.error('[utmify-auto] pending error:', e);
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        async (payload) => {
          const newRow = payload.new as OrderRow;
          const oldRow = payload.old as Partial<OrderRow>;
          if (!newRow?.id) return;
          if (newRow.status !== 'paid') return;
          if (oldRow?.status === 'paid') return;
          if (notifiedPaidDispatch.current.has(newRow.id)) return;
          notifiedPaidDispatch.current.add(newRow.id);
          try {
            await supabase.functions.invoke('dispatch-paid-notifications', {
              body: { orderId: newRow.id },
            });
          } catch (e) {
            console.error('[utmify-auto] paid error:', e);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
