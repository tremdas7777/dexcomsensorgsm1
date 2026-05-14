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
          </ul>
        </div>
        <div className="text-sm">
          <h4 className="font-semibold mb-3">Atendimento</h4>
          <ul className="space-y-2 text-white/70">
            <li>
              <a href="mailto:contato@sensordexcomgsm1.shop" className="hover:text-white underline underline-offset-2">
                contato@sensordexcomgsm1.shop
              </a>
            </li>
            <li>
              <a href="tel:+5511963569864" className="hover:text-white underline underline-offset-2">
                Suporte: (11) 96356-9864
              </a>
            </li>
            <li>Frete grátis para todo Brasil</li>
            <li>Pagamento via PIX (aprovação instantânea)</li>
            <li>Entrega rastreada</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 text-center text-xs text-white/50 py-4 px-4 space-y-1.5">
        <p>© {new Date().getFullYear()} Dexcom — Todos os direitos reservados.</p>
        <p className="text-white/60">CNPJ: 47.130.874/0001-05</p>
      </div>
    </footer>
  );
}
