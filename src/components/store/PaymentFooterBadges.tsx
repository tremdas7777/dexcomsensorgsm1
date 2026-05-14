import PixLogo from '@/components/PixLogo';

function VisaBadge({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 52 18" aria-label="Visa" role="img">
      <rect width="52" height="18" rx="2" fill="#1434CB" />
      <text
        x="26"
        y="13"
        textAnchor="middle"
        fill="#fff"
        fontSize="10"
        fontWeight="800"
        fontStyle="italic"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardBadge({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 44 28" aria-label="Mastercard" role="img">
      <rect width="44" height="28" rx="3" fill="#fff" />
      <circle cx="17" cy="14" r="8.5" fill="#EB001B" />
      <circle cx="27" cy="14" r="8.5" fill="#F79E1B" fillOpacity={0.88} />
    </svg>
  );
}

function EloBadge({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 44 28" aria-label="Elo" role="img">
      <rect width="44" height="28" rx="3" fill="#fff" />
      <rect x="2" y="2" width="12" height="24" rx="1" fill="#00A4E4" />
      <rect x="16" y="2" width="12" height="24" rx="1" fill="#EF4123" />
      <rect x="30" y="2" width="12" height="24" rx="1" fill="#FFCB05" />
    </svg>
  );
}

function AmexBadge({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 52 18" aria-label="American Express" role="img">
      <rect width="52" height="18" rx="2" fill="#006FCF" />
      <text
        x="26"
        y="12.5"
        textAnchor="middle"
        fill="#fff"
        fontSize="7"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="0.06em"
      >
        AMEX
      </text>
    </svg>
  );
}

/** Selo PIX + bandeiras de cartão para rodapé (fundo escuro). */
export default function PaymentFooterBadges() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center justify-center rounded-md bg-white px-2.5 py-1.5 shadow-sm">
        <PixLogo className="h-6 w-auto text-[#32BCAD]" />
      </div>
      <div className="inline-flex items-center justify-center rounded-md bg-white px-2 py-1.5 shadow-sm">
        <VisaBadge className="h-6 w-auto" />
      </div>
      <div className="inline-flex items-center justify-center rounded-md bg-white px-2 py-1.5 shadow-sm">
        <MastercardBadge className="h-6 w-auto" />
      </div>
      <div className="inline-flex items-center justify-center rounded-md bg-white px-2 py-1.5 shadow-sm">
        <EloBadge className="h-6 w-auto" />
      </div>
      <div className="inline-flex items-center justify-center rounded-md bg-white px-2 py-1.5 shadow-sm">
        <AmexBadge className="h-6 w-auto" />
      </div>
    </div>
  );
}
