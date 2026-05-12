-- Centurion Pay BR (api.centurionpaybr.com.br): Basic Auth apiKey:publicKey + User-Agent
ALTER TABLE public.gateway_config
  ADD COLUMN IF NOT EXISTS centurionpay_v2_api_key TEXT,
  ADD COLUMN IF NOT EXISTS centurionpay_v2_public_key TEXT,
  ADD COLUMN IF NOT EXISTS centurionpay_v2_user_agent TEXT;
