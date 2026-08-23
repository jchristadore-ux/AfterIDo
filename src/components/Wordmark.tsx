import { Link } from 'react-router-dom';
import { cx } from './ui';

/**
 * The mark: a small ring, closing. It reads as a wedding band without being
 * literal about it, and doubles as the progress metaphor the app runs on.
 */
export function Wordmark({
  to = '/',
  size = 'md',
  className,
}: {
  to?: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const dim = size === 'sm' ? 26 : 30;

  return (
    <Link to={to} className={cx('inline-flex items-center gap-2.5', className)}>
      <svg width={dim} height={dim} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <circle
          cx="16"
          cy="17.5"
          r="10"
          fill="none"
          stroke="var(--color-rose-600)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeDasharray="55 63"
          transform="rotate(-105 16 17.5)"
        />
        <path
          d="M16 3.4 18.1 7.6 13.9 7.6Z"
          fill="var(--color-rose-500)"
        />
      </svg>
      <span
        className={cx(
          'font-display tracking-tight text-ink-900',
          size === 'sm' ? 'text-lg' : 'text-xl',
        )}
      >
        NameDay
      </span>
    </Link>
  );
}
