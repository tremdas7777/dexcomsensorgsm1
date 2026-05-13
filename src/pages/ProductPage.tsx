import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, ShieldCheck, Truck, BadgeCheck } from 'lucide-react';
import StoreHeader from '@/components/store/StoreHeader';
import StoreFooter from '@/components/store/StoreFooter';
import { Button } from '@/components/ui/button';
import { STORE_PRODUCT, formatBRL } from '@/lib/storeProduct';
import { addToCart, buyNow } from '@/lib/cartStore';
import { toast } from 'sonner';

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

  const handleAdd = () => {
    addToCart(variant, quantity);
    toast.success('Adicionado ao carrinho');
  };

  const handleBuyNow = () => {
    window.location.href = variant.checkoutUrl;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0">
      <StoreHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
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
          <div className="mt-3 text-3xl font-extrabold text-foreground">
            {formatBRL(variant.priceCents)}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            ou em até <strong>12x</strong> com PIX (aprovação instantânea)
          </p>

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
              onClick={handleAdd}
              size="lg"
              className="flex-1 rounded-full h-12 font-bold text-base"
            >
              <ShoppingBag className="mr-2 h-5 w-5" /> Adicionar ao carrinho
            </Button>
          </div>

          <Button
            onClick={handleBuyNow}
            variant="outline"
            size="lg"
            className="mt-3 w-full rounded-full h-12 font-bold text-base border-foreground text-foreground hover:bg-foreground hover:text-white"
          >
            Comprar agora
          </Button>

          {/* Trust */}
          <ul className="mt-6 space-y-2 text-sm text-foreground">
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" /> Frete grátis para todo o Brasil
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Pagamento 100% seguro via PIX
            </li>
            <li className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-primary" /> Produto original Dexcom
            </li>
          </ul>
        </div>
      </main>

      {/* Descrição */}
      <section className="max-w-3xl w-full mx-auto px-4 sm:px-6 pb-16">
        <article
          className="prose prose-sm sm:prose-base max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-ul:list-disc prose-ul:pl-6"
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
        <p className="mt-4 text-xs text-muted-foreground">
          *Picadas no dedo podem ser necessárias em determinadas situações. †Smartphone vendido separadamente. Verifique compatibilidade.
        </p>
      </section>

      {/* Sticky mobile buy bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-border px-3 py-2.5 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="leading-tight">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Total</div>
          <div className="text-lg font-extrabold text-foreground">{formatBRL(variant.priceCents * quantity)}</div>
        </div>
        <Button
          onClick={handleBuyNow}
          size="lg"
          className="flex-1 rounded-full h-12 font-bold text-sm uppercase tracking-wide"
        >
          Comprar agora
        </Button>
      </div>

      <StoreFooter />
    </div>
  );
}
