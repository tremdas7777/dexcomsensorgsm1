-- Garante uma única leva de notificações "pedido pago" (Utmify + webhooks + CAPI) por pedido,
-- somente quando orders.status = 'paid'.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS paid_notified_at TIMESTAMPTZ;

COMMENT ON COLUMN public.orders.paid_notified_at IS 'Preenchido na primeira execução bem-sucedida de dispatch-paid-notifications para este pedido pago.';

CREATE OR REPLACE FUNCTION public.try_claim_paid_notification(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n int;
BEGIN
  UPDATE public.orders
  SET paid_notified_at = now()
  WHERE id = p_order_id
    AND status = 'paid'
    AND paid_notified_at IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.try_claim_paid_notification(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.try_claim_paid_notification(uuid) TO service_role;
