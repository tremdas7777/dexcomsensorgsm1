/**
 * Catálogo da loja Dexcom (1 produto, 3 variantes).
 * Imagens vêm direto do CDN da Shopify (origem do tema importado).
 */

export type ProductVariant = {
  id: string;
  /** Rótulo curto exibido no card de seleção. */
  title: string;
  /** Subtítulo (duração / unidades). */
  subtitle: string;
  /** Preço em centavos. */
  priceCents: number;
  /** URL de checkout externo (Shopify) para esta variante. */
  checkoutUrl: string;
};

export type StoreProduct = {
  handle: string;
  title: string;
  vendor: string;
  /** Frete sempre grátis (vide banner do site original). */
  freeShipping: true;
  images: string[];
  variants: ProductVariant[];
  shortDescription: string;
  bullets: string[];
  fullDescriptionHtml: string;
};

export const STORE_PRODUCT: StoreProduct = {
  handle: 'sensor-g7-30-dias',
  title: 'Sensor G7 - 30 dias',
  vendor: 'Dexcom',
  freeShipping: true,
  images: [
    'https://cdn.shopify.com/s/files/1/0813/2778/4162/files/252143054-748356795-dexcom-g7-packaging-applictaor-sensor-800px-s-trans.webp?v=1778448658',
    'https://cdn.shopify.com/s/files/1/0813/2778/4162/files/114390156-674777024-en-US-g7-sensor-STP-GT-001-004.webp?v=1778448699',
    '/images/dexcom-g7-easy-application.webp',
  ],
  variants: [
    {
      id: 'v1',
      title: '1 Unidade',
      subtitle: '3 Sensores · 30 Dias de Monitoramento',
      priceCents: 26900,
      checkoutUrl: 'https://seguro.sensordexcomgsm1.shop/api/public/shopify?product=123016595934&store=1230',
    },
    {
      id: 'v2',
      title: '2 Unidades',
      subtitle: '6 Sensores · 60 Dias de Monitoramento',
      priceCents: 49900,
      checkoutUrl: 'https://seguro.sensordexcomgsm1.shop/api/public/shopify?product=123023951818&store=1230',
    },
    {
      id: 'v3',
      title: '3 Unidades',
      subtitle: '9 Sensores · 90 Dias de Monitoramento',
      priceCents: 69900,
      checkoutUrl: 'https://seguro.sensordexcomgsm1.shop/api/public/shopify?product=123016595934&store=1230',
    },
  ],
  shortDescription:
    'Sistema de monitoramento contínuo de glicose (MCG): compatível com iPhone (Apple) e smartphones Android, além de smartwatches e Apple Watch quando suportados pelo app — com leituras em tempo real e alertas.',
  bullets: [
    'Leituras automáticas a cada 5 minutos, sem escanear',
    'Alertas personalizáveis, incluindo aviso preditivo de hipoglicemia',
    'Sensor compacto e integrado, fácil de aplicar',
    'Aquecimento rápido antes do uso (siga o manual do fabricante)',
    'Indicado para diabetes tipo 1 e tipo 2 (conforme indicação médica)',
    'Compatível com sistemas Apple (iOS) e Android: smartphone, smartwatch e Apple Watch (conforme app e modelos suportados)',
    'Mais controle no dia a dia com o app Dexcom',
    'Produto original Dexcom',
  ],
  fullDescriptionHtml: `
    <h2>Sensor Dexcom G7 – 30 dias de monitoramento contínuo</h2>
    <p>O <strong>Dexcom G7</strong> é um sistema de <strong>monitoramento contínuo de glicose (MCG)</strong> usado por pessoas com diabetes para ver a tendência da glicemia ao longo do dia, com leituras frequentes no <strong>smartphone</strong> (sistemas <strong>Apple iOS</strong> e <strong>Android</strong>), em <strong>smartwatches</strong> compatíveis e no <strong>Apple Watch</strong> quando essa função estiver disponível para a sua combinação de aparelhos e região.</p>
    <p>Este kit inclui <strong>3 sensores Dexcom G7</strong>, com uso de até <strong>10 dias por sensor</strong>, totalizando até <strong>30 dias</strong> de utilização contínua, conforme orientação clínica e manual do produto.</p>
    <p>O sensor envia dados para o app Dexcom; funcionalidades exatas (alertas, relógio, tolerâncias) dependem da versão do software, região e dispositivos pareados.</p>
    <h3>Conteúdo da embalagem</h3>
    <ul>
      <li>3 sensores Dexcom G7</li>
      <li>Até 30 dias de monitoramento no total (3 × até 10 dias)</li>
      <li>Períodos de tolerância e substituição conforme manual</li>
    </ul>
  `,
};

export const HOME_HERO_IMAGES = {
  banner:
    'https://cdn.shopify.com/s/files/1/0813/2778/4162/files/the-world_s-most-powerful-cgm-systems_1.jpg?v=1778446730',
  logo:
    'https://cdn.shopify.com/s/files/1/0813/2778/4162/files/global-dexcom-g7-mg-smarphone-sensor-logo_1.webp?v=1778447262',
  monitoring:
    'https://cdn.shopify.com/s/files/1/0813/2778/4162/files/Scan-Free_Continuous_Monitoring_58092cb8-c13a-4811-af47-21465a9add14_1.webp?v=1778447910',
};

export const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const findVariant = (id: string) =>
  STORE_PRODUCT.variants.find((v) => v.id === id) ?? STORE_PRODUCT.variants[0];
