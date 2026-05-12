import { useEffect, useRef, useState } from 'react';
import { Loader2, Copy, CheckCircle, QrCode, Sparkles, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { fetchPaymentGatewayConfig } from '@/lib/paymentGateway';
import { fireConversionEvent } from '@/lib/pixelManager';
import legoTrofeu from '@/assets/lego-copa-trofeu.webp';
import albumCopaImg from '@/assets/album-copa-hero.webp';

interface UpsellBuyer {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

interface UpsellPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaid: () => void;
  buyer: UpsellBuyer;
}

type UpsellChoice = 'lego' | 'album' | 'both';

const PRICE_SINGLE = 34.9;
const PRICE_COMBO = 49.9;

const LEGO_TITLE = 'Taça LEGO Copa 2026';
const ALBUM_TITLE = 'Álbum Copa do Mundo 2026';
const LEGO_DESCRIPTION = 'Réplica Taça LEGO Copa do Mundo 2026';
const ALBUM_DESCRIPTION = 'Álbum oficial de figurinhas Copa do Mundo 2026';

function choiceDetails(choice: UpsellChoice): { amount: number; description: string; summaryLabel: string } {
  if (choice === 'lego') {
    return { amount: PRICE_SINGLE, description: LEGO_DESCRIPTION, summaryLabel: LEGO_TITLE };
  }
  if (choice === 'album') {
    return { amount: PRICE_SINGLE, description: ALBUM_DESCRIPTION, summaryLabel: ALBUM_TITLE };
  }
  return {
    amount: PRICE_COMBO,
    description: `${LEGO_DESCRIPTION} + ${ALBUM_DESCRIPTION}`,
    summaryLabel: `${LEGO_TITLE} + ${ALBUM_TITLE}`,
  };
}

export default function UpsellPopup({ open, onOpenChange, onPaid, buyer }: UpsellPopupProps) {
  const [stage, setStage] = useState<'offer' | 'pix'>('offer');
  const [choice, setChoice] = useState<UpsellChoice>('both');
  const [checkoutAmount, setCheckoutAmount] = useState(PRICE_COMBO);
  const [checkoutSummary, setCheckoutSummary] = useState('');
  const [checkoutDescription, setCheckoutDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pixCode, setPixCode] = useState('');
  const [pixQr, setPixQr] = useState('');
  const [orderId, setOrderId] = useState('');
  const [copied, setCopied] = useState(false);
  const hasFiredPaid = useRef(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStage('offer');
      setChoice('both');
      setCheckoutAmount(PRICE_COMBO);
      setCheckoutSummary('');
      setCheckoutDescription('');
      setError('');
      setPixCode('');
      setPixQr('');
      setOrderId('');
      setCopied(false);
      hasFiredPaid.current = false;
    }
  }, [open]);

  // Poll for payment confirmation
  useEffect(() => {
    if (stage !== 'pix' || !orderId) return;
    const interval = setInterval(async () => {
      const { data } = await supabase.from('orders').select('status').eq('id', orderId).single();
      if (data?.status === 'paid' && !hasFiredPaid.current) {
        hasFiredPaid.current = true;
        fireConversionEvent(
          'Purchase',
          { value: checkoutAmount, currency: 'BRL', content_name: checkoutDescription || checkoutSummary },
          orderId,
        );
        clearInterval(interval);
        onPaid();
        onOpenChange(false);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [stage, orderId, checkoutAmount, checkoutDescription, checkoutSummary, onPaid, onOpenChange]);

  const generatePix = async () => {
    const details = choiceDetails(choice);
    setLoading(true);
    setError('');
    try {
      const cfg = await fetchPaymentGatewayConfig();
      const active = cfg.activeGateway;
      const metadata = {
        product: details.description,
        upsell: true,
        upsellChoice: choice,
        cep: buyer.cep,
        address: buyer.endereco,
        addressNumber: buyer.numero,
        complement: buyer.complemento,
        neighborhood: buyer.bairro,
        city: buyer.cidade,
        state: buyer.estado,
        shippingMethod: 'sedex',
        shippingCostCents: 0,
        itemsDescription: details.description,
      };

      let data: any = null;
      let invokeError: any = null;

      if (active === 'pagouai') {
        ({ data, error: invokeError } = await supabase.functions.invoke('criar-pagamento-pagouai', {
          body: {
            method: 'pix',
            secretKey: cfg.pagouai.secretKey,
            amount: details.amount,
            buyerName: buyer.nome,
            buyerEmail: buyer.email,
            buyerDocument: buyer.cpf,
            buyerPhone: buyer.telefone,
            metadata,
          },
        }));
      } else if (active === 'vennox') {
        ({ data, error: invokeError } = await supabase.functions.invoke('criar-pix-vennox', {
          body: {
            secretKey: cfg.vennox.secretKey,
            companyId: cfg.vennox.companyId,
            amount: details.amount,
            buyerName: buyer.nome,
            buyerEmail: buyer.email,
            buyerDocument: buyer.cpf,
            buyerPhone: buyer.telefone,
            metadata,
          },
        }));
      } else if (active === 'centurionpay') {
        ({ data, error: invokeError } = await supabase.functions.invoke('criar-pix-centurionpay', {
          body: {
            secretKey: cfg.centurionpay.secretKey,
            companyId: cfg.centurionpay.companyId,
            amount: details.amount,
            buyerName: buyer.nome,
            buyerEmail: buyer.email,
            buyerDocument: buyer.cpf,
            buyerPhone: buyer.telefone,
            metadata,
          },
        }));
      } else if (active === 'centurionpayv2') {
        ({ data, error: invokeError } = await supabase.functions.invoke('criar-pix-centurionpay-v2', {
          body: {
            apiKey: cfg.centurionpayv2.apiKey,
            publicKey: cfg.centurionpayv2.publicKey,
            userAgent: cfg.centurionpayv2.userAgent?.trim() || undefined,
            amount: details.amount,
            buyerName: buyer.nome,
            buyerEmail: buyer.email,
            buyerDocument: buyer.cpf,
            buyerPhone: buyer.telefone,
            itemsDescription: details.description,
            externalRef: `upsell-${choice}-${Date.now()}`,
            metadata,
          },
        }));
        if (!invokeError && data?.success) {
          data = {
            pix_code: data.pixCode,
            pix_qr_code_base64: data.qrCodeBase64,
            order_id: data.order_id || '',
          };
        }
      } else if (active === 'ironpay') {
        ({ data, error: invokeError } = await supabase.functions.invoke('criar-pix-ironpay', {
          body: {
            apiToken: cfg.ironpay.apiToken,
            hashId: cfg.ironpay.hashId,
            amount: details.amount,
            buyerName: buyer.nome,
            buyerEmail: buyer.email,
            buyerDocument: buyer.cpf,
            buyerPhone: buyer.telefone,
            itemsDescription: details.description,
            externalRef: `upsell-${choice}-${Date.now()}`,
          },
        }));
        if (!invokeError && data?.success) {
          data = {
            pix_code: data.pixCode,
            pix_qr_code_base64: data.qrCodeBase64,
            order_id: data.order_id || '',
          };
        }
      } else if (active === 'simpayout') {
        ({ data, error: invokeError } = await supabase.functions.invoke('criar-pix-simpayout', {
          body: {
            clientId: cfg.simpayout.clientId,
            clientSecret: cfg.simpayout.clientSecret,
            amount: details.amount,
            buyerName: buyer.nome,
            buyerEmail: buyer.email,
            buyerDocument: buyer.cpf,
            buyerPhone: buyer.telefone,
            metadata,
          },
        }));
      }

      if (invokeError) throw invokeError;
      if (
        data &&
        typeof (data as { success?: boolean }).success === 'boolean' &&
        (data as { success?: boolean }).success === false
      ) {
        const msg = typeof (data as { error?: string }).error === 'string'
          ? (data as { error: string }).error
          : 'Gateway recusou o PIX';
        throw new Error(msg);
      }
      if (!data?.pix_code) throw new Error('PIX não gerado');

      setCheckoutAmount(details.amount);
      setCheckoutSummary(details.summaryLabel);
      setCheckoutDescription(details.description);
      setPixCode(data.pix_code);
      setPixQr(data.pix_qr_code_base64 || '');
      setOrderId(data.order_id || '');
      setStage('pix');
    } catch (err: any) {
      console.error('Upsell PIX error:', err);
      setError(err?.message ? String(err.message) : 'Erro ao gerar PIX. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      if (orderId) await supabase.from('orders').update({ qr_code_copied: true }).eq('id', orderId);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = pixCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleDecline = () => {
    onPaid();
    onOpenChange(false);
  };

  const fmtMoney = (n: number) =>
    n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const pixFootnote =
    choice === 'both'
      ? 'Após o pagamento, a taça LEGO e o álbum serão adicionados automaticamente ao seu envio.'
      : choice === 'album'
        ? 'Após o pagamento, o álbum Copa 2026 será adicionado automaticamente ao seu envio.'
        : 'Após o pagamento, a taça LEGO será adicionada automaticamente ao seu envio.';

  const OptionRow = ({
    id,
    title,
    subtitle,
    priceLabel,
    badge,
  }: {
    id: UpsellChoice;
    title: string;
    subtitle: string;
    priceLabel: string;
    badge?: string;
  }) => (
    <button
      type="button"
      onClick={() => setChoice(id)}
      className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
        choice === id
          ? 'border-centauro-green bg-centauro-green/10 shadow-md ring-1 ring-centauro-green/30'
          : 'border-border bg-card hover:border-centauro-green/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-black text-foreground leading-tight">{title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{subtitle}</p>
        </div>
        <div className="text-right shrink-0">
          {badge && (
            <span className="inline-block mb-1 text-[9px] font-black uppercase tracking-wide bg-centauro-gold text-primary px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
          <p className="text-sm font-black text-centauro-green whitespace-nowrap">{priceLabel}</p>
        </div>
      </div>
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDecline(); }}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md mx-auto rounded-2xl p-0 overflow-hidden max-h-[90dvh] overflow-y-auto">
        {stage === 'offer' && (
          <div className="bg-background">
            <div className="bg-gradient-to-r from-centauro-gold to-yellow-500 px-4 py-2 flex items-center justify-center gap-2">
              <Sparkles size={14} className="text-primary" />
              <span className="text-[11px] font-black uppercase tracking-wider text-primary">
                Oferta exclusiva — só nesta tela
              </span>
            </div>

            <DialogHeader className="px-5 pt-5 pb-2">
              <DialogTitle className="text-lg font-black uppercase leading-tight">
                Monte seu kit da Copa
              </DialogTitle>
              <DialogDescription className="text-xs leading-relaxed">
                Escolha a taça LEGO, o álbum oficial de figurinhas (cada um por R$ {fmtMoney(PRICE_SINGLE)}) ou leve os dois no combo por R$ {fmtMoney(PRICE_COMBO)}.
              </DialogDescription>
            </DialogHeader>

            <div className="px-5 pb-5 space-y-4">
              <div className="bg-secondary rounded-xl p-3 flex items-center justify-center gap-2 min-h-[140px]">
                {choice === 'album' ? (
                  <img src={albumCopaImg} alt={ALBUM_TITLE} className="h-36 object-contain drop-shadow-lg" />
                ) : choice === 'lego' ? (
                  <img src={legoTrofeu} alt={LEGO_TITLE} className="h-36 object-contain drop-shadow-lg" />
                ) : (
                  <div className="flex items-center justify-center gap-3 w-full">
                    <img src={legoTrofeu} alt="" className="h-28 object-contain drop-shadow-md flex-1 max-w-[45%]" />
                    <span className="text-lg font-black text-muted-foreground">+</span>
                    <img src={albumCopaImg} alt="" className="h-28 object-contain drop-shadow-md flex-1 max-w-[45%]" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <OptionRow
                  id="lego"
                  title={LEGO_TITLE}
                  subtitle="Réplica em peças LEGO licenciada — edição Copa."
                  priceLabel={`R$ ${fmtMoney(PRICE_SINGLE)}`}
                />
                <OptionRow
                  id="album"
                  title={ALBUM_TITLE}
                  subtitle="Coleção oficial de figurinhas — complete o álbum da Copa."
                  priceLabel={`R$ ${fmtMoney(PRICE_SINGLE)}`}
                />
                <OptionRow
                  id="both"
                  title="Combo — os dois"
                  subtitle="Taça LEGO + álbum oficial no mesmo pedido."
                  priceLabel={`R$ ${fmtMoney(PRICE_COMBO)}`}
                  badge="Melhor valor"
                />
              </div>

              <div className="text-center rounded-lg bg-muted/50 py-2 px-3 border border-border">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total selecionado</p>
                <p className="text-2xl font-black text-centauro-green">
                  R$ {fmtMoney(choiceDetails(choice).amount)}
                </p>
              </div>

              <ul className="space-y-1.5 text-xs text-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-centauro-green mt-0.5 flex-shrink-0" />
                  <span>Produtos oficiais / licenciados — envio junto do seu pedido principal</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-centauro-green mt-0.5 flex-shrink-0" />
                  <span>Sem frete extra neste adicional</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-centauro-green mt-0.5 flex-shrink-0" />
                  <span>Pagamento via PIX em segundos</span>
                </li>
              </ul>

              {error && (
                <p className="text-xs text-destructive text-center font-medium">{error}</p>
              )}

              <div className="space-y-2 pt-1">
                <Button
                  onClick={generatePix}
                  disabled={loading}
                  className="w-full h-12 text-sm font-black uppercase tracking-wider bg-centauro-green hover:bg-centauro-green/90 text-primary-foreground rounded-xl shadow-lg"
                >
                  {loading ? (
                    <><Loader2 size={16} className="mr-2 animate-spin" /> Gerando PIX...</>
                  ) : (
                    <>Pagar com PIX — R$ {fmtMoney(choiceDetails(choice).amount)}</>
                  )}
                </Button>
                <button
                  onClick={handleDecline}
                  className="w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1.5 underline-offset-2 hover:underline"
                >
                  Não, obrigado. Continuar para meu pedido
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-muted-foreground pt-1">
                <ShieldCheck size={11} />
                <span className="text-[10px] uppercase tracking-wider">Compra 100% segura</span>
              </div>
            </div>
          </div>
        )}

        {stage === 'pix' && (
          <div className="p-5 bg-background">
            <DialogHeader className="mb-3">
              <DialogTitle className="flex items-center gap-2 text-base font-black">
                <QrCode size={20} className="text-centauro-green" />
                Pague o adicional via PIX
              </DialogTitle>
              <DialogDescription className="text-xs">
                {checkoutSummary ? `${checkoutSummary}. ${pixFootnote}` : pixFootnote}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="text-center bg-secondary rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Valor a pagar</p>
                <p className="text-2xl font-black text-foreground">
                  R$ {fmtMoney(checkoutAmount)}
                </p>
              </div>

              {pixCode ? (
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-lg">
                    <img
                      src={pixQr
                        ? (pixQr.startsWith('data:') ? pixQr : `data:image/png;base64,${pixQr}`)
                        : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}`}
                      alt="QR Code PIX"
                      className="w-44 h-44 object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              )}

              {pixCode && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Código PIX (Copia e Cola)
                  </label>
                  <div className="bg-secondary rounded-lg p-3 break-all">
                    <p className="text-[11px] font-mono text-foreground leading-relaxed max-h-20 overflow-y-auto">
                      {pixCode}
                    </p>
                  </div>
                  <Button
                    onClick={handleCopy}
                    className="w-full font-bold text-sm py-5 bg-centauro-green hover:bg-centauro-green/90 text-primary-foreground"
                  >
                    {copied ? (
                      <><CheckCircle size={16} className="mr-2" /> Código Copiado!</>
                    ) : (
                      <><Copy size={16} className="mr-2" /> Copiar Código PIX</>
                    )}
                  </Button>
                </div>
              )}

              <p className="text-[10px] text-center text-muted-foreground">
                Confirmação automática em até 5 minutos. Você pode fechar esta janela e seguirá para a confirmação.
              </p>

              <button
                onClick={handleDecline}
                className="w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1.5"
              >
                <X size={11} className="inline mr-1" />
                Pular oferta e continuar
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
