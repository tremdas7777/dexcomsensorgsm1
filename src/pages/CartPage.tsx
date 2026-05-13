import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import StoreHeader from '@/components/store/StoreHeader';
import StoreFooter from '@/components/store/StoreFooter';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cartStore';
import { formatBRL, findVariant } from '@/lib/storeProduct';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, subtotalCents, updateQuantity, removeFromCart } = useCart();

  const handleCheckout = () => {
    const first = items[0];
    if (!first) return;
    window.location.href = findVariant(first.variantId).checkoutUrl;
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <StoreHeader />
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-extrabold">Seu carrinho está vazio</h1>
          <p className="text-muted-foreground mt-2 max-w-md">
            Adicione o Sensor Dexcom G7 ao carrinho para finalizar a compra.
          </p>
          <Button asChild size="lg" className="mt-6 rounded-full px-8 h-12 font-bold">
            <Link to="/produto/sensor-g7-30-dias">Ver produto</Link>
          </Button>
        </main>
        <StoreFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StoreHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-extrabold mb-6">Seu carrinho</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista */}
          <ul className="lg:col-span-2 space-y-4">
            {items.map((it) => (
              <li
                key={it.key}
                className="bg-white border border-border rounded-xl p-4 flex gap-4 items-center"
              >
                <Link to={`/produto/${it.productHandle}`} className="shrink-0">
                  <img
                    src={it.productImage}
                    alt={it.productTitle}
                    className="w-20 h-20 object-contain bg-secondary/40 rounded-md"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/produto/${it.productHandle}`}
                    className="font-bold text-foreground hover:text-primary block truncate"
                  >
                    {it.productTitle}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {it.variantTitle} — {it.variantSubtitle}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center border border-border rounded-full">
                      <button
                        aria-label="Diminuir"
                        onClick={() => updateQuantity(it.key, it.quantity - 1)}
                        className="p-2 hover:bg-secondary rounded-l-full"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{it.quantity}</span>
                      <button
                        aria-label="Aumentar"
                        onClick={() => updateQuantity(it.key, it.quantity + 1)}
                        className="p-2 hover:bg-secondary rounded-r-full"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="font-extrabold">
                      {formatBRL(it.unitPriceCents * it.quantity)}
                    </div>
                  </div>
                </div>
                <button
                  aria-label="Remover"
                  onClick={() => removeFromCart(it.key)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          {/* Resumo */}
          <aside className="bg-white border border-border rounded-xl p-5 h-fit lg:sticky lg:top-24">
            <h2 className="font-bold text-lg mb-4">Resumo do pedido</h2>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-bold">{formatBRL(subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-muted-foreground">Frete</span>
              <span className="font-bold text-primary">GRÁTIS</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between items-baseline">
              <span className="font-bold">Total</span>
              <span className="text-2xl font-extrabold">{formatBRL(subtotalCents)}</span>
            </div>
            <Button
              onClick={handleCheckout}
              size="lg"
              className="w-full mt-5 rounded-full h-12 font-bold text-base"
            >
              Finalizar compra
            </Button>
            <Link
              to="/produto/sensor-g7-30-dias"
              className="block text-center text-sm text-muted-foreground hover:text-foreground mt-3"
            >
              Continuar comprando
            </Link>
          </aside>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}
