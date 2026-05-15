import type { ReactNode } from 'react';

const CARD_BRANDS: { src: string; label: string }[] = [
  { src: '/images/payment-visa.svg', label: 'Visa' },
  { src: '/images/payment-mastercard.svg', label: 'Mastercard' },
  { src: '/images/payment-elo.svg', label: 'Elo' },
  { src: '/images/payment-americanexpress.svg', label: 'American Express' },
];

function LogoChip({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center rounded-md bg-white/95 px-2 py-1 shadow-sm ring-1 ring-black/5">
      {children}
    </div>
  );
}

/** PIX + bandeiras: selos pequenos (sem faixa branca larga). */
export default function PaymentFooterBadges() {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2 sm:justify-start sm:gap-2.5"
      role="group"
      aria-label="PIX, Visa, Mastercard, Elo e American Express"
    >
      <LogoChip>
        <img
          src="/images/payment-pix.svg"
          alt="PIX"
          width={112}
          height={48}
          loading="lazy"
          decoding="async"
          className="h-6 w-auto object-contain sm:h-7"
        />
      </LogoChip>
      {CARD_BRANDS.map(({ src, label }) => (
        <LogoChip key={label}>
          <img
            src={src}
            alt={label}
            title={label}
            width={40}
            height={28}
            loading="lazy"
            decoding="async"
            className="h-5 w-auto object-contain sm:h-5"
          />
        </LogoChip>
      ))}
    </div>
  );
}
