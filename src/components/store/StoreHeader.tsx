import { Link } from 'react-router-dom';
import { Search, User, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cartStore';

export default function StoreHeader() {
  const { count } = useCart();
  return (
    <>
      {/* Anúncio topo */}
      <div className="bg-primary text-primary-foreground text-center text-xs sm:text-sm font-semibold tracking-wide py-2 px-4">
        FRETE GRÁTIS PARA TODO BRASIL
      </div>

      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center" aria-label="Início">
            <span className="text-primary font-extrabold text-2xl lowercase tracking-tight">
              dexcom
            </span>
          </Link>

          <nav aria-label="Principal" className="flex items-center gap-4 sm:gap-5 text-foreground">
            <button
              type="button"
              aria-label="Buscar"
              className="p-2 hover:opacity-70 transition-opacity"
              onClick={() => alert('Busca em breve')}
            >
              <Search className="h-5 w-5" />
            </button>
            <Link to="/conta" aria-label="Conta" className="p-2 hover:opacity-70 transition-opacity">
              <User className="h-5 w-5" />
            </Link>
            <Link
              to="/carrinho"
              aria-label="Carrinho"
              className="relative p-2 hover:opacity-70 transition-opacity"
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {count}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
