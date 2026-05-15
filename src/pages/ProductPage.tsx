import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Activity, Bell, CreditCard, Minus, Plus, ShieldCheck, Smartphone, Timer, Truck, BadgeCheck, Watch } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import StoreHeader from '@/components/store/StoreHeader';
import StoreFooter from '@/components/store/StoreFooter';
import PixLogo from '@/components/PixLogo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { STORE_PRODUCT, formatBRL } from '@/lib/storeProduct';
import { trackEvent } from '@/lib/funnelTracking';

const PRODUCT_HIGHLIGHTS: {
  icon: LucideIcon;
  title: string;
  body: string;
}[] = [
  {
    icon: Activity,
    title: 'Leituras em tempo real',
    body: 'Acompanhe a glicose no app, com curva e valores frequentes — no mesmo espírito do que a Dexcom apresenta para o G7: visão contínua para decisões no dia a dia.',
  },
  {
    icon: Timer,
    title: 'Aquecimento e rotina',
    body: 'O G7 é conhecido por tempo de aquecimento curto antes de usar o sensor e por opções de tolerância para troca; confira sempre o manual da sua região e lote.',
  },
  {
    icon: Watch,
    title: 'Apple, Android, smartwatch e Apple Watch',
    body: 'O ecossistema Dexcom G7 acompanha iPhone (Apple) e celulares Android compatíveis. Você pode ver a glicose no app, em smartwatches suportados e no Apple Watch quando a combinação de dispositivos e software permitir. Aparelhos são vendidos à parte; confira no manual quais modelos funcionam na sua região.',
  },
  {
    icon: Smartphone,
    title: 'Sensor compacto',
    body: 'Sistema pequeno e integrado, pensado para discrição e fixação em locais indicados pelo fabricante (braço, abdômen etc., conforme manual e idade).',
  },
];

const ALERT_TOPICS: { id: string; title: string; body: string }[] = [
  {
    id: 'predictive-low',
    title: 'Aviso antes da hipo grave (estilo “Urgent Low Soon”)',
    body: 'Na linha G7, a Dexcom promove um alerta preditivo que pode avisar com antecedência quando a glicose se aproxima de níveis muito baixos — o tempo e o comportamento exato dependem do app, região e configurações. Ajuste limites e som com calma, junto do seu médico.',
  },
  {
    id: 'high-custom',
    title: 'Hiperglicemia e personalização',
    body: 'É comum poder definir limiares e avisos de glicose alta e repetir alertas até confirmar — útil para acordar à noite ou em situações de esquecimento. Confira no app quais alertas estão disponíveis na sua versão.',
  },
  {
    id: 'rate-loss',
    title: 'Queda rápida, estabilidade e perda de sinal',
    body: 'Sistemas MCG costumam incluir alertas de taxa de queda (glicose caindo muito rápido), estabilidade e falha de comunicação entre sensor e celular. São apoios à decisão, não substituem sintomas ou medidor de referência quando o fabricante o recomenda.',
  },
];

const DAYS_PER_SENSOR = 10;

function getKitDuration(variantId: string) {
  const kits = { v1: 1, v2: 2, v3: 3 } as const;
  const count = kits[variantId as keyof typeof kits] ?? 1;
  const sensors = count * 3;
  const totalDays = sensors * DAYS_PER_SENSOR;
  return { sensors, totalDays, kits: count };
}

const STORY_BLOCKS: {
  src: string;
  alt: string;
  kicker: string;
  title: string;
  body: string;
}[] = [
  {
    src: '/images/desc-g7-tips-lifestyle.png',
    alt: 'Celular com app Dexcom mostrando glicose e gráfico, sensor e aplicador ao lado',
    kicker: 'Menos “chute”, mais padrão',
    title: 'A glicemia oscila o dia inteiro — o G7 ajuda você a enxergar a curva',
    body:
      'Com leituras frequentes no aplicativo, você deixa de depender só de um número isolado e passa a ver subida, descida e estabilidade. Isso apoia decisões sobre refeição, atividade e medicação, sempre com orientação médica e seguindo o manual Dexcom.',
  },
  {
    src: '/images/desc-g7-sensor-no-braco.png',
    alt: 'Sensor Dexcom G7 discreto no braço',
    kicker: 'No corpo, no hábito',
    title: 'Sensor compacto no braço — monitoramento que tenta sumir na roupa',
    body:
      'O perfil fino e o adesivo firme sugerem uso no dia a dia: trabalho, treino, manga curta. A ideia é continuidade sem chamar atenção; locais de aplicação e cuidados com a pele estão no guia do fabricante.',
  },
  {
    src: '/images/desc-g7-app-restaurante.png',
    alt: 'Pessoa consultando app Dexcom em mesa de restaurante',
    kicker: 'Vida social e rotina',
    title: 'Jantar fora, estresse, carboidrato inesperado: tendência no bolso',
    body:
      'Olhar a tendência no celular pode reduzir a ansiedade quando o contexto muda. Não substitui sintomas nem o cuidado do seu time de saúde, mas dá mais contexto na hora H — como um painel rápido antes de agir.',
  },
  {
    src: '/images/desc-g7-aplicacao-braco.png',
    alt: 'Aplicação do sensor Dexcom no braço com aplicador',
    kicker: 'Menos atrito na troca',
    title: 'Aplicador pensado para encaixar na correria da troca de sensor',
    body:
      'Quem vive de calendário de troca sabe: quanto mais simples o passo a passo, mais fácil manter o hábito. O G7 integra sensor e transmissão num formato que a Dexcom desenhou para aplicação objetiva — siga sempre o manual do lote e a indicação clínica.',
  },
];

export default function ProductPage() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const product = STORE_PRODUCT;

  // Se o handle não bate, ainda assim mostramos o produto único; só protege links errados.
  if (handle && handle !== product.handle) {
    navigate('/', { replace: true });
  }

  const [variantId, setVariantId] = useState(product.variants[0].id);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const variant = product.variants.find((v) => v.id === variantId)!;
  const kit = getKitDuration(variant.id);

  const trackedView = useRef(false);
  useEffect(() => {
    if (trackedView.current) return;
    trackedView.current = true;
    trackEvent('store_product_view');
  }, []);

  const handleBuyNow = () => {
    trackEvent('checkout');
    trackEvent('external_checkout');
    window.location.href = variant.checkoutUrl;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StoreHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:pb-16 flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
        {/* Galeria */}
        <div>
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-border">
            <img
              src={product.images[activeImage]}
              alt={product.title}
              className="w-full h-auto object-contain max-h-[480px] mx-auto"
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 justify-center">
              {product.images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-md overflow-hidden border-2 ${
                    activeImage === i ? 'border-primary' : 'border-transparent'
                  } bg-white`}
                  aria-label={`Imagem ${i + 1}`}
                >
                  <img src={src} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Compra */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">{product.title}</h1>
          <p className="mt-2 text-sm sm:text-base leading-relaxed text-foreground rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
            <strong className="text-primary">{kit.sensors} sensores Dexcom G7</strong>
            {' — '}
            até <strong>{DAYS_PER_SENSOR} dias</strong> de uso em cada sensor
            {' · '}
            <strong>{kit.totalDays} dias no total</strong> de monitoramento contínuo
            {kit.kits > 1 ? ` (${kit.kits} kits de 3 sensores)` : ''}
          </p>
          <div className="mt-3 text-3xl font-extrabold text-foreground">
            {formatBRL(variant.priceCents)}
          </div>
          <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <PixLogo className="h-6 max-w-[min(100%,12rem)]" />
              <span>PIX — aprovação instantânea</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary shrink-0" aria-hidden />
              <span>Cartão de crédito em até 12x</span>
            </div>
          </div>

          {/* Variantes */}
          <fieldset className="mt-6">
            <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Quantidade
            </legend>
            <div className="space-y-2">
              {product.variants.map((v) => {
                const selected = v.id === variantId;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVariantId(v.id)}
                    aria-pressed={selected}
                    className={`w-full text-left rounded-full px-5 py-3 border transition-all ${
                      selected
                        ? 'bg-primary text-primary-foreground border-primary shadow-md'
                        : 'bg-white text-foreground border-border hover:border-primary/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-sm">
                          {v.title} = {v.subtitle.split('·')[0].trim()}{' '}
                          <span className={selected ? 'opacity-90' : 'text-muted-foreground'}>
                            ({v.subtitle.split('·')[1]?.trim()})
                          </span>
                        </div>
                      </div>
                      <div className="font-extrabold text-sm whitespace-nowrap">
                        {formatBRL(v.priceCents)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Quantidade + CTA */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center border border-border rounded-full overflow-hidden">
              <button
                type="button"
                aria-label="Diminuir quantidade"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-3 hover:bg-secondary"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-4 font-bold w-10 text-center">{quantity}</span>
              <button
                type="button"
                aria-label="Aumentar quantidade"
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                className="p-3 hover:bg-secondary"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              onClick={handleBuyNow}
              size="lg"
              className="flex-1 rounded-full h-12 font-bold text-base"
            >
              Comprar agora
            </Button>
          </div>

          {/* Trust */}
          <ul className="mt-6 space-y-2 text-sm text-foreground">
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" /> Frete grátis para todo o Brasil
            </li>
            <li className="flex flex-wrap items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span className="flex flex-wrap items-center gap-1.5">
                Pagamento 100% seguro: <PixLogo className="h-5 max-w-[10rem]" /> ou cartão em até 12x
              </span>
            </li>
            <li className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-primary" /> Produto original Dexcom
            </li>
          </ul>
        </div>
        </div>

        <section className="mt-10 md:mt-14" aria-labelledby="destaques-g7">
          <h2 id="destaques-g7" className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
            Destaques do sistema
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Resumo alinhado ao que a Dexcom destaca para usuários: leituras contínuas, sensor compacto, rotina de
            aquecimento e integração com iPhone, Android, smartwatch e Apple Watch quando suportado.
          </p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRODUCT_HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <CardTitle className="text-base font-bold leading-snug">{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">{body}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12 md:mt-16" aria-labelledby="alertas-g7">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bell className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 id="alertas-g7" className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                Alertas — o que costuma importar mais
              </h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Na linha G7, a Dexcom chama atenção para alertas avançados (incluindo aviso preditivo de hipos e
                personalização de hipers). Abaixo fica um resumo; a listagem completa e as regras exatas ficam no
                aplicativo Dexcom da sua região.
              </p>
            </div>
          </div>
          <Accordion type="single" collapsible className="mt-4 w-full max-w-3xl">
            {ALERT_TOPICS.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger className="text-left text-sm font-bold sm:text-base">{item.title}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{item.body}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="mt-12 md:mt-16" aria-labelledby="historia-g7" id="historia-produto">
          <h2 id="historia-g7" className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
            Por que o G7 converte confiança em ação no diabetes
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Imagens reais de uso: tecnologia que fala a mesma língua de quem precisa de clareza, discrição e rotina
            sustentável — sem prometer resultado clínico; combine sempre com seu médico ou educador em diabetes.
          </p>
          <div className="mt-8 space-y-12 md:space-y-16">
            {STORY_BLOCKS.map((block, i) => (
              <div
                key={block.src}
                className={`flex flex-col gap-6 md:flex-row md:items-center md:gap-10 ${
                  i % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                <div className="md:w-1/2 shrink-0">
                  <img
                    src={block.src}
                    alt={block.alt}
                    width={800}
                    height={600}
                    loading="lazy"
                    className="w-full rounded-xl border border-border bg-white object-cover shadow-sm"
                  />
                </div>
                <div className="md:w-1/2">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">{block.kicker}</p>
                  <h3 className="mt-2 text-lg sm:text-xl font-extrabold text-foreground leading-snug">{block.title}</h3>
                  <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">{block.body}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center text-sm font-semibold text-foreground max-w-xl mx-auto">
            Pronto para mais clareza no bolso? Escolha a quantidade no topo e finalize com PIX ou cartão em até 12x —
            frete grátis Brasil.
          </p>
        </section>

        <section className="mt-12 md:mt-16 max-w-3xl w-full mx-auto pb-4">
          <h2 className="text-lg font-extrabold text-foreground mb-3">Descrição do kit</h2>
          <article
            className="prose prose-sm sm:prose-base max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary prose-ul:list-disc prose-ul:pl-6"
            dangerouslySetInnerHTML={{ __html: product.fullDescriptionHtml }}
          />
          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {product.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <span className="text-primary font-bold mt-0.5">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}
