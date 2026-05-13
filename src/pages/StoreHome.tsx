import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import StoreHeader from '@/components/store/StoreHeader';
import StoreFooter from '@/components/store/StoreFooter';
import { Button } from '@/components/ui/button';
import { STORE_PRODUCT, HOME_HERO_IMAGES, formatBRL } from '@/lib/storeProduct';
import { trackEvent } from '@/lib/funnelTracking';

export default function StoreHome() {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackEvent('visitor');
  }, []);
  const productHref = `/produto/${STORE_PRODUCT.handle}`;
  const fromPrice = Math.min(...STORE_PRODUCT.variants.map((v) => v.priceCents));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StoreHeader />

      <main className="flex-1">
        {/* HERO 1 — banner principal */}
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-14 flex flex-col items-center text-center">
            <img
              src={HOME_HERO_IMAGES.banner}
              alt="The world's most powerful CGM systems"
              className="w-full max-w-4xl rounded-lg shadow-sm mb-5 sm:mb-6"
              loading="eager"
            />
            <img
              src={HOME_HERO_IMAGES.logo}
              alt="Dexcom G7 logo"
              className="h-8 sm:h-12 w-auto mb-4 sm:mb-6 object-contain"
              loading="eager"
            />
            <h1 className="text-2xl sm:text-5xl font-extrabold text-foreground max-w-3xl leading-tight">
              Conhecimento que impulsiona o progresso,
              <span className="text-primary"> percepção que impulsiona a saúde</span>
            </h1>
            <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-muted-foreground max-w-2xl">
              Esteja no controle da sua glicose 24 horas por dia, com dados atualizados em tempo real.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-5 sm:mt-6 rounded-full px-8 h-12 text-base font-bold uppercase tracking-wide w-full sm:w-auto max-w-xs"
            >
              <Link to={productHref}>Comprar agora</Link>
            </Button>
          </div>
        </section>

        {/* PRODUTO em destaque */}
        <section className="bg-secondary/40 border-y border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <Link to={productHref} className="block group">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <img
                  src={STORE_PRODUCT.images[0]}
                  alt={STORE_PRODUCT.title}
                  className="w-full h-auto object-contain max-h-[420px] mx-auto group-hover:scale-[1.02] transition-transform"
                  loading="lazy"
                />
              </div>
            </Link>
            <div>
              <span className="text-primary font-bold text-sm uppercase tracking-wider">
                {STORE_PRODUCT.vendor}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mt-2">
                {STORE_PRODUCT.title}
              </h2>
              <p className="text-muted-foreground mt-3">{STORE_PRODUCT.shortDescription}</p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground">A partir de</span>
                <span className="text-3xl font-extrabold text-foreground">{formatBRL(fromPrice)}</span>
              </div>
              <ul className="mt-5 space-y-1.5 text-sm text-foreground/90">
                {STORE_PRODUCT.bullets.slice(0, 4).map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">→</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                size="lg"
                className="mt-6 rounded-full px-8 h-12 text-base font-bold uppercase tracking-wide"
              >
                <Link to={productHref}>Ver produto</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* GS1 CGM — features */}
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <img
              src={HOME_HERO_IMAGES.monitoring}
              alt="Monitoramento contínuo sem escaneamento"
              className="w-full rounded-lg"
              loading="lazy"
            />
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">GS1 CGM</h2>
              <p className="mt-3 text-lg text-foreground/90">
                Testado e aprovado por milhões de pessoas, o GS1 é{' '}
                <strong>preciso, confiável e fácil de usar</strong>.
              </p>
              <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-foreground">
                {[
                  'Envio de dados instantâneo',
                  'Alarmes customizáveis',
                  'Dispensa escaneamento',
                  'Resistente à água',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">→</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                size="lg"
                className="mt-6 rounded-full px-8 h-12 text-base font-bold uppercase tracking-wide"
              >
                <Link to={productHref}>Compre agora</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Trust badges */}
        <section className="bg-secondary/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { t: 'Frete Grátis', s: 'Para todo o Brasil' },
              { t: 'Pagamento via PIX', s: 'Aprovação instantânea' },
              { t: 'Entrega Rastreada', s: 'Acompanhe seu pedido' },
              { t: 'Suporte ao Cliente', s: 'Atendimento dedicado' },
            ].map((b) => (
              <div key={b.t} className="bg-white rounded-xl p-5 shadow-sm">
                <div className="text-primary font-bold">{b.t}</div>
                <div className="text-sm text-muted-foreground mt-1">{b.s}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}
