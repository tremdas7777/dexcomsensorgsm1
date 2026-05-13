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
  ],
  variants: [
    {
      id: 'v1',
      title: '1 Unidade',
      subtitle: '3 Sensores · 30 Dias de Monitoramento',
      priceCents: 26900,
    },
    {
      id: 'v2',
      title: '2 Unidades',
      subtitle: '6 Sensores · 60 Dias de Monitoramento',
      priceCents: 49900,
    },
    {
      id: 'v3',
      title: '3 Unidades',
      subtitle: '9 Sensores · 90 Dias de Monitoramento',
      priceCents: 69900,
    },
  ],
  shortDescription:
    'Monitoramento Contínuo de Glicose 24h por dia, com leituras automáticas a cada 5 minutos direto no smartphone.',
  bullets: [
    'Indicado para Diabetes Tipo 1 e Tipo 2',
    'Monitoramento contínuo da glicose 24 horas por dia',
    'Leituras automáticas a cada 5 minutos',
    'Sem necessidade de picadas no dedo*',
    'Alertas personalizáveis para glicose alta ou baixa',
    'Sensor compacto, discreto e confortável',
    'Conexão com smartphone compatível†',
    'Mais praticidade e controle no tratamento do diabetes',
  ],
  fullDescriptionHtml: `
    <h2>Sensor Dexcom G7 – 30 Dias de Monitoramento Contínuo de Glicose</h2>
    <p>O <strong>Dexcom G7</strong> é um sistema avançado de Monitoramento Contínuo de Glicose (MCG), indicado para pessoas com <strong>Diabetes Tipo 1 e Tipo 2</strong>, oferecendo mais praticidade, controle e segurança no acompanhamento da glicemia no dia a dia.</p>
    <p>Este kit contém <strong>3 sensores Dexcom G7</strong>, com duração de até <strong>10 dias cada</strong>, totalizando <strong>30 dias de monitoramento contínuo</strong>.</p>
    <p>O sensor é pequeno, discreto e confortável, realizando leituras automáticas da glicose a cada 5 minutos e enviando as informações diretamente para smartphone ou receptor compatível†. Assim, você acompanha seus níveis de glicose em tempo real, sem necessidade de escaneamento.</p>
    <h3>Conteúdo da embalagem</h3>
    <ul>
      <li>3 Sensores Dexcom G7</li>
      <li>Duração total: até 30 dias de uso</li>
      <li>Cada sensor possui duração de até 10 dias + período adicional de tolerância</li>
    </ul>
    <p>Ideal para quem busca mais liberdade, praticidade e acompanhamento contínuo da glicose com tecnologia moderna e confiável.</p>
  `,
};

export const HOME_HERO_IMAGES = {
  banner: 'https://sensordexcomgsm1.shop/cdn/shop/files/the-world_s-most-powerful-cgm-systems_1.jpg?v=1778446730',
  logo: 'https://sensordexcomgsm1.shop/cdn/shop/files/global-dexcom-g7-mg-smarphone-sensor-logo_1.webp?v=1778447262',
  monitoring:
    'https://sensordexcomgsm1.shop/cdn/shop/files/Scan-Free_Continuous_Monitoring_58092cb8-c13a-4811-af47-21465a9add14_1.webp?v=1778447910',
};

export const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const findVariant = (id: string) =>
  STORE_PRODUCT.variants.find((v) => v.id === id) ?? STORE_PRODUCT.variants[0];
