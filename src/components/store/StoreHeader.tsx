import { Link } from 'react-router-dom';

export default function StoreHeader() {
  return (
    <>
      {/* Anúncio topo */}
      <div className="bg-primary text-primary-foreground text-center text-xs sm:text-sm font-semibold tracking-wide py-2 px-4">
        FRETE GRÁTIS PARA TODO BRASIL
      </div>

      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-center">
          <Link to="/" className="flex items-center" aria-label="Início">
            <span className="text-primary font-extrabold text-2xl lowercase tracking-tight">
              dexcom
            </span>
          </Link>
        </div>
      </header>
    </>
  );
}
