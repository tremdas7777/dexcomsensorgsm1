import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PaymentFooterBadges from '@/components/store/PaymentFooterBadges';
import { fetchPaymentGatewayConfig } from '@/lib/paymentGateway';

const SUPPORT_WHATSAPP_E164 = '5511963569864';
const WHATSAPP_SUPPORT_URL = `https://wa.me/${SUPPORT_WHATSAPP_E164}?text=${encodeURIComponent('Olá, preciso de suporte.')}`;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export default function StoreFooter() {
  const [footerWhatsappVisible, setFooterWhatsappVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPaymentGatewayConfig().then((cfg) => {
      if (!cancelled) setFooterWhatsappVisible(cfg.footerWhatsappVisible);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="bg-foreground text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <span className="text-primary font-extrabold text-2xl lowercase">dexcom</span>
            <p className="text-white/70 text-sm mt-3 leading-relaxed">
              Conhecimento que impulsiona o progresso, percepção que impulsiona a saúde.
            </p>
          </div>
          <div className="text-sm">
            <h4 className="font-semibold mb-3">Loja</h4>
            <ul className="space-y-2 text-white/70">
              <li>
                <Link to="/produto/sensor-g7-30-dias" className="hover:text-white">
                  Sensor G7 - 30 dias
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-sm">
            <h4 className="font-semibold mb-3">Atendimento</h4>
            <ul className="space-y-2 text-white/70">
              <li>
                <a
                  href="mailto:contato@sensordexcomgsm1.shop"
                  className="hover:text-white underline underline-offset-2"
                >
                  contato@sensordexcomgsm1.shop
                </a>
              </li>
              <li>
                <a href="tel:+5511963569864" className="hover:text-white underline underline-offset-2">
                  Suporte: (11) 96356-9864
                </a>
              </li>
              <li>Frete grátis para todo Brasil</li>
              <li>PIX (instantâneo) e cartão em até 12x</li>
              <li>Entrega rastreada</li>
            </ul>
            {footerWhatsappVisible && (
              <a
                href={WHATSAPP_SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#20BD5A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <WhatsAppIcon className="h-5 w-5 shrink-0" />
                Suporte no WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-white/10">
          <PaymentFooterBadges />
        </div>
      </div>
      <div className="border-t border-white/10 text-center text-xs text-white/50 py-4 px-4 space-y-1.5">
        <p>© {new Date().getFullYear()} Dexcom — Todos os direitos reservados.</p>
        <p className="text-white/60">CNPJ: 47.130.874/0001-05</p>
      </div>
    </footer>
  );
}
