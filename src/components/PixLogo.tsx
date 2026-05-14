import { cn } from '@/lib/utils';

interface PixLogoProps {
  className?: string;
}

/** Selo “pague com PIX” (imagem oficial de marca) — usar só junto a textos sobre PIX, não em botões de ação. */
export default function PixLogo({ className }: PixLogoProps) {
  return (
    <img
      src="/images/pix-pague-com-oficial.jpg"
      alt=""
      aria-label="PIX — pague com"
      loading="lazy"
      decoding="async"
      className={cn(
        className,
        'inline-block h-5 w-auto max-w-[11rem] object-contain object-left align-middle shrink-0',
      )}
    />
  );
}
