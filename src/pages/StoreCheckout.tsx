import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Lock, ShieldCheck, Truck } from 'lucide-react';
import StoreHeader from '@/components/store/StoreHeader';
import StoreFooter from '@/components/store/StoreFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart, buildItemsDescription, type CartItem } from '@/lib/cartStore';
import { formatBRL } from '@/lib/storeProduct';
import { fetchPaymentGatewayConfig } from '@/lib/paymentGateway';
import { trackEvent } from '@/lib/funnelTracking';
import { fireConversionEvent } from '@/lib/pixelManager';
import { getAttribution, getTrackingParameters } from '@/lib/attribution';
import { supabase } from '@/integrations/supabase/client';
import PixPopup from '@/components/PixPopup';

/* ------------------------------- helpers ------------------------------- */
const onlyDigits = (s: string) => s.replace(/\D/g, '');
const formatCpf = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};
const formatCep = (v: string) => {
  const d = onlyDigits(v).slice(0, 8);
  return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`;
};
const formatPhone = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
const validCpf = (v: string) => {
  const d = onlyDigits(v);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(d[i]) * (10 - i);
  let r = (s * 10) % 11;
  if (r === 10) r = 0;
  if (r !== parseInt(d[9])) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(d[i]) * (11 - i);
  r = (s * 10) % 11;
  if (r === 10) r = 0;
  return r === parseInt(d[10]);
};

/* ------------------------------- component ----------------------------- */
export default function StoreCheckout() {
  const navigate = useNavigate();
  const { items, subtotalCents } = useCart();

  // Redireciona se carrinho vazio
  useEffect(() => {
    if (items.length === 0) navigate('/carrinho', { replace: true });
  }, [items.length, navigate]);

  // form state
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cepLoading, setCepLoading] = useState(false);

  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState('');
  const [showPixPopup, setShowPixPopup] = useState(false);
  const [pixCode, setPixCode] = useState('');
  const [pixQrCodeBase64, setPixQrCodeBase64] = useState('');
  const [pixOrderId, setPixOrderId] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    trackEvent('checkout');
    trackEvent('checkout_step_1');
    fireConversionEvent('InitiateCheckout', {
      value: subtotalCents / 100,
      currency: 'BRL',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalCents = subtotalCents; // frete grátis
  const amountBrl = totalCents / 100;

  const itemsDescription = useMemo(() => buildItemsDescription(items), [items]);

  /* ------------------------------- CEP --------------------------------- */
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setCep(formatted);
    const digits = onlyDigits(formatted);
    if (digits.length === 8) {
      setCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setEndereco(data.logradouro || '');
          setBairro(data.bairro || '');
          setCidade(data.localidade || '');
          setEstado(data.uf || '');
        }
      } catch {
        /* ignore */
      } finally {
        setCepLoading(false);
      }
    }
  };

  const formValid =
    nome.trim().length > 2 &&
    /\S+@\S+\.\S+/.test(email) &&
    onlyDigits(telefone).length >= 10 &&
    validCpf(cpf) &&
    onlyDigits(cep).length === 8 &&
    endereco.trim() &&
    numero.trim() &&
    cidade.trim() &&
    estado.trim();

  /* --------------------------- gerar PIX ------------------------------- */
  const handleSubmit = async () => {
    if (!formValid) {
      setPixError('Preencha todos os campos obrigatórios.');
      setTimeout(() => setPixError(''), 4000);
      return;
    }
    trackEvent('purchase');

    const cfg = await fetchPaymentGatewayConfig();
    const has = {
      pagouai: !!cfg.pagouai.secretKey?.trim(),
      vennox: !!cfg.vennox.secretKey?.trim() && !!cfg.vennox.companyId?.trim(),
      centurionpay:
        !!cfg.centurionpay.secretKey?.trim() && !!cfg.centurionpay.companyId?.trim(),
      centurionpayv2:
        !!cfg.centurionpayv2.apiKey?.trim() && !!cfg.centurionpayv2.publicKey?.trim(),
      ironpay: !!cfg.ironpay.apiToken?.trim(),
      simpayout:
        !!cfg.simpayout.clientId?.trim() && !!cfg.simpayout.clientSecret?.trim(),
    } as const;

    let active = cfg.activeGateway;
    if (!has[active as keyof typeof has]) {
      const fb = (Object.keys(has) as Array<keyof typeof has>).find((k) => has[k]);
      if (fb) active = fb;
    }
    if (!has[active as keyof typeof has]) {
      setPixError('Nenhum gateway de pagamento configurado. Verifique o painel admin.');
      setTimeout(() => setPixError(''), 6000);
      return;
    }

    const purchaseMetadata = {
      address: endereco,
      addressNumber: numero,
      complement: complemento,
      neighborhood: bairro,
      city: cidade,
      state: estado,
      cep: onlyDigits(cep),
      shippingMethod: 'sedex',
      shippingCostCents: 0,
      itemsDescription,
      attribution: getAttribution(),
      trackingParameters: getTrackingParameters(),
      cartItems: items.map((i: CartItem) => ({
        product: i.productTitle,
        variant: i.variantTitle,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
      })),
    };

    const baseBody = {
      amount: amountBrl,
      buyerName: nome,
      buyerEmail: email,
      buyerDocument: cpf,
      buyerPhone: telefone,
      itemsDescription,
      metadata: purchaseMetadata,
    };

    setPixLoading(true);
    setPixError('');
    try {
      let fnName = '';
      let extra: Record<string, unknown> = {};

      if (active === 'pagouai') {
        fnName = 'criar-pagamento-pagouai';
        extra = { secretKey: cfg.pagouai.secretKey, method: 'pix' };
      } else if (active === 'vennox') {
        fnName = 'criar-pix-vennox';
        extra = {
          secretKey: cfg.vennox.secretKey,
          companyId: cfg.vennox.companyId,
        };
      } else if (active === 'centurionpay') {
        fnName = 'criar-pix-centurionpay';
        extra = {
          secretKey: cfg.centurionpay.secretKey,
          companyId: cfg.centurionpay.companyId,
        };
      } else if (active === 'centurionpayv2') {
        fnName = 'criar-pix-centurionpay-v2';
        extra = {
          apiKey: cfg.centurionpayv2.apiKey,
          publicKey: cfg.centurionpayv2.publicKey,
          userAgent: cfg.centurionpayv2.userAgent?.trim() || undefined,
          externalRef: `pedido-${Date.now()}`,
        };
      } else if (active === 'ironpay') {
        fnName = 'criar-pix-ironpay';
        extra = {
          apiToken: cfg.ironpay.apiToken,
          hashId: cfg.ironpay.hashId,
          externalRef: `pedido-${Date.now()}`,
        };
      } else if (active === 'simpayout') {
        fnName = 'criar-pix-simpayout';
        extra = {
          clientId: cfg.simpayout.clientId,
          clientSecret: cfg.simpayout.clientSecret,
        };
      }

      const { data, error } = await supabase.functions.invoke(fnName, {
        body: { ...extra, ...baseBody },
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data?.error || 'Erro ao gerar PIX');

      const code = data?.pixCode || data?.pix_code || '';
      const qr = data?.qrCodeBase64 || data?.pix_qr_code_base64 || '';
      const orderId = data?.order_id || data?.orderId || '';
      if (!code) throw new Error('Código PIX não retornado pelo gateway.');

      setPixCode(code);
      setPixQrCodeBase64(qr);
      setPixOrderId(orderId);
      setShowPixPopup(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar PIX. Tente novamente.';
      console.error('PIX error:', err);
      setPixError(msg);
      setTimeout(() => setPixError(''), 6000);
    } finally {
      setPixLoading(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StoreHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8">
        {/* Mobile: mini-resumo no topo (colapsável) */}
        <details className="lg:hidden bg-white border border-border rounded-xl overflow-hidden -mt-1 group">
          <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer list-none">
            <span className="flex items-center gap-2 text-sm font-bold">
              <Truck className="h-4 w-4 text-primary" />
              Ver resumo do pedido
              <span className="ml-1 text-xs text-muted-foreground transition-transform group-open:rotate-180">▾</span>
            </span>
            <span className="text-lg font-extrabold">{formatBRL(subtotalCents)}</span>
          </summary>
          <ul className="border-t border-border divide-y divide-border">
            {items.map((it) => (
              <li key={it.key} className="flex gap-3 items-center px-4 py-3">
                <div className="relative shrink-0">
                  <img src={it.productImage} alt={it.productTitle} className="w-12 h-12 object-contain bg-secondary/40 rounded-md" />
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {it.quantity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{it.productTitle}</div>
                  <div className="text-xs text-muted-foreground truncate">{it.variantTitle}</div>
                </div>
                <div className="text-sm font-bold">{formatBRL(it.unitPriceCents * it.quantity)}</div>
              </li>
            ))}
          </ul>
        </details>

        {/* ======================= FORMULÁRIO ======================= */}
        <section>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-5 sm:mb-6">Finalizar compra</h1>

          <div className="bg-white border border-border rounded-xl p-5 sm:p-6 space-y-4">
            <h2 className="font-bold flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                1
              </span>
              Dados pessoais
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoComplete="name"
              />
              <Input
                placeholder="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <Input
                placeholder="Telefone (WhatsApp)"
                value={telefone}
                onChange={(e) => setTelefone(formatPhone(e.target.value))}
                inputMode="tel"
                autoComplete="tel"
              />
              <Input
                placeholder="CPF"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-5 sm:p-6 space-y-4 mt-4">
            <h2 className="font-bold flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                2
              </span>
              Endereço de entrega
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Input
                  placeholder="CEP"
                  value={cep}
                  onChange={handleCepChange}
                  inputMode="numeric"
                  autoComplete="postal-code"
                />
                {cepLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <Input
                placeholder="Rua / Logradouro"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                autoComplete="address-line1"
              />
              <Input
                placeholder="Número"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                inputMode="numeric"
              />
              <Input
                placeholder="Complemento (opcional)"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
              />
              <Input
                placeholder="Bairro"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
              />
              <Input
                placeholder="Cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                autoComplete="address-level2"
              />
              <Input
                placeholder="Estado (UF)"
                value={estado}
                maxLength={2}
                onChange={(e) => setEstado(e.target.value.toUpperCase())}
                autoComplete="address-level1"
              />
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-5 sm:p-6 mt-4">
            <h2 className="font-bold flex items-center gap-2 mb-3">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                3
              </span>
              Pagamento
            </h2>
            <div className="bg-secondary/40 border border-border rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div className="text-sm">
                <div className="font-bold">PIX — Aprovação instantânea</div>
                <div className="text-muted-foreground">
                  Gere o QR Code e pague com qualquer banco em segundos.
                </div>
              </div>
            </div>
          </div>

          {pixError && (
            <div className="mt-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
              {pixError}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={pixLoading || !formValid}
            size="lg"
            className="w-full mt-5 rounded-full h-14 text-base font-bold uppercase tracking-wide"
          >
            {pixLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando PIX...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-5 w-5" /> Pagar {formatBRL(totalCents)} via PIX
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-3">
            Ao finalizar você concorda com os termos e a política de privacidade.
          </p>
        </section>

        {/* ======================= RESUMO =========================== */}
        <aside className="lg:sticky lg:top-24 h-fit">
          <div className="bg-white border border-border rounded-xl p-5">
            <h2 className="font-bold mb-4">Resumo do pedido</h2>
            <ul className="space-y-3">
              {items.map((it) => (
                <li key={it.key} className="flex gap-3 items-center">
                  <div className="relative shrink-0">
                    <img
                      src={it.productImage}
                      alt={it.productTitle}
                      className="w-14 h-14 object-contain bg-secondary/40 rounded-md"
                    />
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {it.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{it.productTitle}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {it.variantTitle}
                    </div>
                  </div>
                  <div className="text-sm font-bold">
                    {formatBRL(it.unitPriceCents * it.quantity)}
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-border mt-4 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold">{formatBRL(subtotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span className="font-bold text-primary flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" /> GRÁTIS
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-border">
                <span className="font-bold">Total</span>
                <span className="text-2xl font-extrabold">{formatBRL(totalCents)}</span>
              </div>
            </div>
            <Link
              to="/carrinho"
              className="block text-center text-sm text-muted-foreground hover:text-foreground mt-4"
            >
              Editar carrinho
            </Link>
          </div>

          <ul className="mt-4 space-y-2 text-xs text-muted-foreground px-2">
            <li className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" /> Pagamento 100% seguro
            </li>
            <li className="flex items-center gap-2">
              <Truck className="h-3.5 w-3.5" /> Frete grátis para todo o Brasil
            </li>
          </ul>
        </aside>
      </main>

      <StoreFooter />

      <PixPopup
        open={showPixPopup}
        onOpenChange={setShowPixPopup}
        pixCode={pixCode}
        pixQrCodeBase64={pixQrCodeBase64}
        orderId={pixOrderId}
        amount={amountBrl}
      />
    </div>
  );
}
