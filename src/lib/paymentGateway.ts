import { supabase } from '@/integrations/supabase/client';

export interface PagouAiConfig {
  publicKey: string;
  secretKey: string;
  enabled: boolean;
}

export interface VennoxConfig {
  secretKey: string;
  companyId: string;
  enabled: boolean;
}

export interface CenturionPayConfig {
  secretKey: string;
  companyId: string;
  enabled: boolean;
}

export interface IronPayConfig {
  apiToken: string;
  hashId: string;
  enabled: boolean;
}

/** Centurion Pay BR — https://api.centurionpaybr.com.br (Basic apiKey:publicKey + User-Agent). */
export interface CenturionPayV2Config {
  apiKey: string;
  publicKey: string;
  /** Se vazio, a edge function usa um User-Agent padrão compatível com a doc. */
  userAgent: string;
  enabled: boolean;
}

export interface SimPayoutConfig {
  clientId: string;
  clientSecret: string;
  enabled: boolean;
}

export interface PaymentGatewayConfig {
  activeGateway: 'pagouai' | 'vennox' | 'centurionpay' | 'centurionpayv2' | 'ironpay' | 'simpayout';
  /** Valor cobrado no checkout como taxa de envio (frete), em centavos — editável em Admin → Pagamentos. */
  productTicketCents: number;
  creditCardEnabled: boolean;
  supportWhatsapp: string;
  pagouai: PagouAiConfig;
  vennox: VennoxConfig;
  centurionpay: CenturionPayConfig;
  ironpay: IronPayConfig;
  centurionpayv2: CenturionPayV2Config;
  simpayout: SimPayoutConfig;
}

const defaultConfig: PaymentGatewayConfig = {
  activeGateway: 'centurionpay',
  productTicketCents: 1990,
  creditCardEnabled: false,
  supportWhatsapp: '11991537247',
  pagouai: { publicKey: '', secretKey: '', enabled: false },
  vennox: { secretKey: '', companyId: '', enabled: false },
  centurionpay: { secretKey: '', companyId: '', enabled: false },
  ironpay: { apiToken: '', hashId: '', enabled: false },
  centurionpayv2: { apiKey: '', publicKey: '', userAgent: '', enabled: false },
  simpayout: { clientId: '', clientSecret: '', enabled: false },
};

// In-memory cache to avoid repeated DB calls within the same page
let cachedConfig: PaymentGatewayConfig | null = null;

/** Evita `.single()` (falha com 0 ou 2+ linhas). */
async function getLatestGatewayConfigRowId(): Promise<string | null> {
  const { data, error } = await supabase
    .from('gateway_config')
    .select('id')
    .order('updated_at', { ascending: false })
    .limit(1);
  if (error) {
    console.error('gateway_config row lookup:', error);
    return null;
  }
  const id = data?.[0]?.id;
  return typeof id === 'string' ? id : null;
}

export function getCachedGatewayConfig(): PaymentGatewayConfig {
  return cachedConfig || defaultConfig;
}

export async function fetchPaymentGatewayConfig(): Promise<PaymentGatewayConfig> {
  try {
    const { data: rows, error } = await supabase
      .from('gateway_config')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1);

    const data = rows?.[0];
    if (error || !data) {
      console.error('Error fetching gateway config:', error);
      return defaultConfig;
    }

    const config: PaymentGatewayConfig = {
      activeGateway: (['pagouai', 'vennox', 'centurionpay', 'centurionpayv2', 'ironpay', 'simpayout'].includes(data.active_gateway)
        ? data.active_gateway
        : 'centurionpay') as PaymentGatewayConfig['activeGateway'],
      productTicketCents: typeof (data as any).product_ticket_cents === 'number'
        ? (data as any).product_ticket_cents
        : 1990,
      creditCardEnabled: !!(data as any).credit_card_enabled,
      supportWhatsapp: (data as any).support_whatsapp || '11991537247',
      pagouai: {
        publicKey: data.pagouai_public_key || '',
        secretKey: data.pagouai_secret_key || '',
        enabled: !!(data.pagouai_secret_key),
      },
      vennox: {
        secretKey: data.vennox_secret_key || '',
        companyId: data.vennox_company_id || '',
        enabled: !!(data.vennox_secret_key && data.vennox_company_id),
      },
      centurionpay: {
        secretKey: data.centurionpay_secret_key || '',
        companyId: data.centurionpay_company_id || '',
        enabled: !!(data.centurionpay_secret_key && data.centurionpay_company_id),
      },
      ironpay: {
        apiToken: (data as any).ironpay_api_token || '',
        hashId: (data as any).ironpay_hash_id || '',
        enabled: !!((data as any).ironpay_api_token),
      },
      centurionpayv2: {
        apiKey: (data as any).centurionpay_v2_api_key || '',
        publicKey: (data as any).centurionpay_v2_public_key || '',
        userAgent: (data as any).centurionpay_v2_user_agent || '',
        enabled: !!((data as any).centurionpay_v2_api_key && (data as any).centurionpay_v2_public_key),
      },
      simpayout: {
        clientId: (data as any).simpayout_client_id || '',
        clientSecret: (data as any).simpayout_client_secret || '',
        enabled: !!((data as any).simpayout_client_id && (data as any).simpayout_client_secret),
      },
    };

    cachedConfig = config;
    return config;
  } catch (err) {
    console.error('Error fetching gateway config:', err);
    return defaultConfig;
  }
}

/**
 * Atualiza só `product_ticket_cents` (taxa de envio). Não envia outras colunas —
 * evita erro quando o banco está atrás das migrações (ex.: sem ironpay_hash_id).
 */
export async function updateProductTicketCents(cents: number): Promise<{ ok: boolean; error?: string }> {
  if (!Number.isFinite(cents) || cents < 1 || cents > 99_999_999) {
    return { ok: false, error: 'Valor inválido' };
  }
  try {
    const rowId = await getLatestGatewayConfigRowId();
    const ts = new Date().toISOString();

    if (!rowId) {
      const { error } = await supabase.from('gateway_config').insert({
        active_gateway: 'centurionpay',
        product_ticket_cents: Math.round(cents),
        credit_card_enabled: false,
        updated_at: ts,
      } as any);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await supabase
        .from('gateway_config')
        .update({ product_ticket_cents: Math.round(cents), updated_at: ts } as any)
        .eq('id', rowId);
      if (error) return { ok: false, error: error.message };
    }

    if (cachedConfig) {
      cachedConfig = { ...cachedConfig, productTicketCents: Math.round(cents) };
    }
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro ao salvar';
    return { ok: false, error: msg };
  }
}

export async function savePaymentGatewayConfig(config: PaymentGatewayConfig): Promise<boolean> {
  try {
    const existingId = await getLatestGatewayConfigRowId();

    const updateData: Record<string, any> = {
      active_gateway: config.activeGateway,
      product_ticket_cents: config.productTicketCents,
      credit_card_enabled: config.creditCardEnabled,
      support_whatsapp: config.supportWhatsapp,
      pagouai_public_key: config.pagouai.publicKey,
      pagouai_secret_key: config.pagouai.secretKey,
      vennox_secret_key: config.vennox.secretKey,
      vennox_company_id: config.vennox.companyId,
      centurionpay_secret_key: config.centurionpay.secretKey,
      centurionpay_company_id: config.centurionpay.companyId,
      ironpay_api_token: config.ironpay.apiToken,
      ironpay_hash_id: config.ironpay.hashId,
      centurionpay_v2_api_key: config.centurionpayv2.apiKey,
      centurionpay_v2_public_key: config.centurionpayv2.publicKey,
      centurionpay_v2_user_agent: config.centurionpayv2.userAgent || null,
      simpayout_client_id: config.simpayout.clientId,
      simpayout_client_secret: config.simpayout.clientSecret,
      updated_at: new Date().toISOString(),
    };

    const tryUpdate = async (payload: Record<string, any>) =>
      existingId
        ? supabase.from('gateway_config').update(payload as any).eq('id', existingId)
        : supabase.from('gateway_config').insert(payload as any);

    let payload: Record<string, any> = { ...updateData };
    for (let attempt = 0; attempt < 6; attempt++) {
      const { error } = await tryUpdate(payload);
      if (!error) {
        cachedConfig = config;
        return true;
      }
      const errMsg = String(error.message || '');
      let stripped = false;
      if (errMsg.includes('ironpay_hash_id') && 'ironpay_hash_id' in payload) {
        delete payload.ironpay_hash_id;
        stripped = true;
      }
      if (
        (errMsg.includes('centurionpay_v2_api_key') ||
          errMsg.includes('centurionpay_v2_public_key') ||
          errMsg.includes('centurionpay_v2_user_agent')) &&
        'centurionpay_v2_api_key' in payload
      ) {
        delete payload.centurionpay_v2_api_key;
        delete payload.centurionpay_v2_public_key;
        delete payload.centurionpay_v2_user_agent;
        stripped = true;
      }
      if (!stripped) throw error;
    }
    throw new Error('Falha ao salvar gateway_config após retries');
  } catch (err) {
    console.error('Error saving gateway config:', err);
    return false;
  }
}

// Legacy support - keep getPaymentGatewayConfig for sync access (uses cache)
export function getPaymentGatewayConfig(): PaymentGatewayConfig {
  return cachedConfig || defaultConfig;
}
