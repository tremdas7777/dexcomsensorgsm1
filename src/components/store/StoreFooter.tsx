import { Link } from 'react-router-dom';

export default function StoreFooter() {
  return (
    <footer className="bg-foreground text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <span className="text-primary font-extrabold text-2xl lowercase">dexcom</span>
          <p className="text-white/70 text-sm mt-3 leading-relaxed">
            Conhecimento que impulsiona o progresso, percepção que impulsiona a saúde.
          </p>
        </div>
        <div className="text-sm">
          <h4 className="font-semibold mb-3">Loja</h4>
          <ul className="space-y-2 text-white/70">
            <li><Link to="/produto/sensor-g7-30-dias" className="hover:text-white">Sensor G7 - 30 dias</Link></li>
            <li><Link to="/carrinho" className="hover:text-white">Carrinho</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <h4 className="font-semibold mb-3">Atendimento</h4>
          <ul className="space-y-2 text-white/70">
            <li>Frete grátis para todo Brasil</li>
            <li>Pagamento via PIX (aprovação instantânea)</li>
            <li>Entrega rastreada</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 text-center text-xs text-white/50 py-4 px-4">
        © {new Date().getFullYear()} Dexcom — Todos os direitos reservados.
      </div>
    </footer>
  );
}
