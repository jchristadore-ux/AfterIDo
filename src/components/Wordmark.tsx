import { Link } from 'react-router-dom';
import wordmark from '@/assets/afterido-wordmark.png';
import { AfterIDoBrand } from '@/brand';
import { cx } from './ui';

const HEIGHT = {
  sm: 'h-6', // mobile header
  md: 'h-8', // desktop header, footer
  lg: 'h-12', // onboarding, about
  xl: 'h-16 sm:h-20', // splash, landing hero
} as const;

export type WordmarkSize = keyof typeof HEIGHT;

/**
 * The AfterIDo wordmark.
 *
 * The source asset is the official logo, trimmed to its ink bounds with the
 * white field keyed to transparency so it composites on any surface rather
 * than punching a white rectangle into tinted ones.
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
 * App-icon mark: the "A" and the rose-gold curve that runs under the wordmark,
 * squared off for a tile. Used for the favicon and as the basis for the app
 * icon, where the full wordmark would be illegible.
 */
export function AppIcon({ size = 40, className }: { size?: number; className?: string }) {
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
      <text
        x="32"
        y="41"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="34"
        fill={AfterIDoBrand.colors.text}
      >
        A
      </text>
      <path
        d="M8 46 C 20 60, 30 34, 42 44 S 56 50, 58 44"
        fill="none"
        stroke={AfterIDoBrand.colors.primary}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
