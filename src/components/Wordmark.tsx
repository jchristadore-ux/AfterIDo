import { Link } from 'react-router-dom';
import wordmark from '@/assets/afterido-wordmark.png';
import { AfterIDoBrand } from '@/brand';
import { cx } from './ui';

/**
 * Heights are tuned to the asset's 1.56:1 aspect. The ring and diamond sit
 * above the wordmark, so roughly half the image height is the mark rather than
 * the name — a height that reads well for a plain wordmark leaves this one
 * illegible. Every step is about double what a text-only lockup would use.
 */
const HEIGHT = {
  sm: 'h-10', // mobile header
  md: 'h-12', // desktop header, footer
  lg: 'h-20', // onboarding, about
  xl: 'h-28 sm:h-36', // splash, landing hero
} as const;

export type WordmarkSize = keyof typeof HEIGHT;

/**
 * The AfterIDo wordmark.
 *
 * The source asset is the official logo, trimmed to its artwork bounds with the
 * cream paper field keyed to transparency so it composites on any surface
 * rather than punching a rectangle into tinted ones.
 *
 * It ships at 900×576 on a 256-colour palette — 44 KB, down from 284 KB, which
 * on a phone-first product was the single heaviest thing on the page. 576px is
 * four times the tallest render below, so it still has headroom on any retina
 * display; the palette is large enough that the ring's metallic gradient does
 * not band, which a smaller one visibly did.
 *
 * Note the wordmark itself is charcoal: place it on white, champagne or another
 * light surface. On a dark ground the lettering disappears and only the
 * rose-gold ring survives.
 */
export function Wordmark({
  size = 'md',
  className,
}: {
  size?: WordmarkSize;
  className?: string;
}) {
  return (
    <img
      src={wordmark}
      alt={AfterIDoBrand.name}
      className={cx('w-auto select-none', HEIGHT[size], className)}
      draggable={false}
    />
  );
}

/** The wordmark as a link — the standard header/footer treatment. */
export function WordmarkLink({
  to = '/',
  size = 'md',
  className,
}: {
  to?: string;
  size?: WordmarkSize;
  className?: string;
}) {
  return (
    <Link to={to} className={cx('inline-flex items-center', className)} aria-label={AfterIDoBrand.name}>
      <Wordmark size={size} />
    </Link>
  );
}

/**
 * App-icon mark: the rose-gold ring and diamond from the logo, with the ribbon
 * running through it. Used for the favicon and as the basis for the app icon,
 * where the full wordmark would be illegible.
 */
export function AppIcon({ size = 40, className }: { size?: number; className?: string }) {
  const gold = AfterIDoBrand.colors.primary;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cx('shrink-0', className)}
      role="img"
      aria-label={`${AfterIDoBrand.name} icon`}
    >
      <rect width="64" height="64" rx="14" fill={AfterIDoBrand.colors.white} />
      <rect
        width="64"
        height="64"
        rx="14"
        fill="none"
        stroke={AfterIDoBrand.colors.text}
        strokeWidth="1"
        opacity="0.12"
      />
      {/* Band */}
      <circle cx="32" cy="38" r="14" fill="none" stroke={gold} strokeWidth="3.2" />
      {/* Stone */}
      <path d="M25 17 L29 11 L35 11 L39 17 L32 27 Z" fill={gold} />
      <path d="M25 17 H39 M29 11 L32 27 M35 11 L32 27" stroke="#fff" strokeWidth="0.9" opacity="0.65" fill="none" />
      {/* Ribbon, crossing the band the way it does in the wordmark */}
      <path
        d="M5 47 C 15 40, 22 54, 32 49 S 49 40, 59 46"
        fill="none"
        stroke={gold}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
