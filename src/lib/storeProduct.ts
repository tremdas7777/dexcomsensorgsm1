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
    '/images/dexcom-g6-banner-lifestyle.jpg',
  ],
  variants: [
    {
      id: 'v1',
      title: '1 Unidade',
      subtitle: '3 Sensores · 30 Dias de Monitoramento',
      priceCents: 26990,
      checkoutUrl: 'https://seguro.sensordexcomgsm1.shop/api/public/shopify?product=123016595934&store=1230',
    },
    {
      id: 'v2',
      title: '2 Unidades',
      subtitle: '6 Sensores · 60 Dias de Monitoramento',
      priceCents: 49700,
      checkoutUrl: 'https://seguro.sensordexcomgsm1.shop/api/public/shopify?product=123023951818&store=1230',
    },
    {
      id: 'v3',
      title: '3 Unidades',
      subtitle: '9 Sensores · 90 Dias de Monitoramento',
      priceCents: 69700,
      checkoutUrl: 'https://seguro.sensordexcomgsm1.shop/api/public/shopify?product=123058721193&store=1230',
    },
  ],
  shortDescription:
    'Glicemia em tempo real no celular, alertas inteligentes e sensor discreto no braço — menos surpresa, mais clareza no diabetes. Compatível com iPhone, Android e Apple Watch quando o app permitir.',
  bullets: [
    'Curva + valor a cada 5 minutos — sem escanear o sensor',
    'Mais segurança em refeição, exercício e sono com alertas personalizáveis',
    'Aplicador e sensor integrados: rotina de troca mais simples (seguir o manual)',
    'Perfil fino no braço — uso no dia a dia com discrição',
    'Indicado para diabetes tipo 1 e 2, com orientação médica',
    'iPhone, Android, smartwatch e Apple Watch conforme compatibilidade do app',
    'Frete grátis Brasil + PIX na finalização',
    'Produto original Dexcom',
  ],
  fullDescriptionHtml: `
    <h2>O que vem neste kit</h2>
    <p><strong>3 sensores Dexcom G7</strong> para até <strong>30 dias</strong> de monitoramento contínuo (até 10 dias por sensor, conforme manual, idade e indicação clínica). O app mostra leituras e tendências; regras de alerta e compatibilidade variam por região e versão do software.</p>
    <h3>Conteúdo</h3>
    <ul>
      <li>3 sensores Dexcom G7 (embalagem do fabricante)</li>
      <li>Períodos de aquecimento e tolerância descritos no manual</li>
      <li>Uso somente com prescrição / orientação profissional quando exigido</li>
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
