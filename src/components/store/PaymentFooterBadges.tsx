const CARD_BRANDS: { src: string; label: string }[] = [
  { src: '/images/payment-visa.svg', label: 'Visa' },
  { src: '/images/payment-mastercard.svg', label: 'Mastercard' },
  { src: '/images/payment-elo.svg', label: 'Elo' },
  { src: '/images/payment-americanexpress.svg', label: 'American Express' },
];

/**
 * Faixa de pagamentos no rodapé: PIX + cartões (SVGs locais, marcas Simple Icons onde aplicável).
 */
export default function PaymentFooterBadges() {
  return (
    <div
      className="mx-auto w-fit max-w-full rounded-xl bg-white text-neutral-900 shadow-md shadow-black/20 ring-1 ring-black/5"
      role="group"
      aria-label="Formas de pagamento: PIX, Visa, Mastercard, Elo e American Express"
    >
      <div className="flex flex-col gap-2.5 px-3 py-3 sm:flex-row sm:items-center sm:gap-0 sm:px-4 sm:py-3">
        <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:items-center sm:gap-3 sm:border-r sm:border-neutral-200 sm:pr-5">
          <img
            src="/images/payment-pix.svg"
            alt="PIX"
            width={112}
            height={48}
            loading="lazy"
            decoding="async"
            className="h-7 w-auto object-contain sm:h-8"
          />
          <p className="max-w-[14rem] text-center text-[11px] leading-snug text-neutral-600 sm:text-left">
            <span className="font-semibold text-neutral-900">PIX na hora</span>
            <span className="text-neutral-400"> · </span>
            Cartão em até 12x
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-end sm:pl-5 sm:pt-0">
          {CARD_BRANDS.map(({ src, label }) => (
            <img
              key={label}
              src={src}
              alt={label}
              title={label}
              width={40}
              height={28}
              loading="lazy"
              decoding="async"
              className="h-5 w-auto object-contain opacity-[0.88] transition-opacity duration-200 hover:opacity-100 sm:h-6"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
