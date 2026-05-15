ALTER TABLE public.gateway_config
  ADD COLUMN IF NOT EXISTS footer_whatsapp_visible BOOLEAN NOT NULL DEFAULT true;
