import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Info, X } from 'lucide-react';

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

// ---------------------------------------------------------------- Button

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-soft disabled:bg-ink-200 disabled:text-ink-500 disabled:shadow-none',
  secondary:
    'bg-paper-raised text-ink-900 border border-ink-200 hover:border-ink-400 hover:bg-paper-sunk active:bg-ink-100',
  ghost: 'text-ink-700 hover:bg-paper-sunk hover:text-ink-900',
  danger: 'bg-clay-600 text-white hover:bg-clay-700 active:bg-clay-700',
};

const SIZE: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-[0.95rem] gap-2',
  lg: 'h-14 px-7 text-base gap-2.5',
};

const BUTTON_BASE =
  'inline-flex items-center justify-center rounded-full font-medium transition-colors duration-150 select-none disabled:cursor-not-allowed whitespace-nowrap';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cx(BUTTON_BASE, VARIANT[variant], SIZE[size], block && 'w-full', className)}
      {...rest}
    />
  );
}

interface LinkButtonProps {
  to: string;
  variant?: Variant;
  size?: Size;
  block?: boolean;
  className?: string;
  children: ReactNode;
  state?: unknown;
}

export function LinkButton({
  to,
  variant = 'primary',
  size = 'md',
  block,
  className,
  children,
  state,
}: LinkButtonProps) {
  return (
    <Link
      to={to}
      state={state}
      className={cx(BUTTON_BASE, VARIANT[variant], SIZE[size], block && 'w-full', className)}
    >
      {children}
    </Link>
  );
}

export function ExternalButton({
  href,
  children,
  variant = 'primary',
  size = 'md',
  block,
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  block?: boolean;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(BUTTON_BASE, VARIANT[variant], SIZE[size], block && 'w-full', className)}
    >
      {children}
    </a>
  );
}

// ---------------------------------------------------------------- Surfaces

export function Card({
  children,
  className,
  as: As = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
}) {
  return (
    <As
      className={cx(
        'rounded-card border border-ink-100 bg-paper-raised shadow-soft',
        className,
      )}
    >
      {children}
    </As>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('flex items-end justify-between gap-4', className)}>
      <div>
        {eyebrow && (
          <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-400">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl text-ink-900 sm:text-2xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------- Badges

type Tone = 'rose' | 'sage' | 'amber' | 'clay' | 'neutral';

const TONE: Record<Tone, string> = {
  rose: 'bg-rose-100 text-rose-700 border-rose-200',
  sage: 'bg-sage-100 text-sage-700 border-sage-300/60',
  amber: 'bg-amber-100 text-amber-700 border-amber-500/25',
  clay: 'bg-clay-100 text-clay-700 border-clay-500/25',
  neutral: 'bg-paper-sunk text-ink-700 border-ink-200',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------- Progress

export function ProgressBar({
  percent,
  className,
  tone = 'rose',
}: {
  percent: number;
  className?: string;
  tone?: 'rose' | 'sage';
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={cx('h-2.5 w-full overflow-hidden rounded-full bg-ink-100', className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Name change progress"
    >
      <div
        className={cx(
          'h-full rounded-full transition-[width] duration-700 ease-out',
          tone === 'rose'
            ? 'bg-gradient-to-r from-rose-400 to-rose-600'
            : 'bg-gradient-to-r from-sage-300 to-sage-600',
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function ProgressRing({
  percent,
  size = 132,
  stroke = 10,
  children,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-ink-100)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#nd-ring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.2,0.7,0.3,1)' }}
        />
        <defs>
          <linearGradient id="nd-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-rose-400)" />
            <stop offset="100%" stopColor="var(--color-rose-600)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Form fields

export function Field({
  label,
  hint,
  error,
  children,
  optional,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  optional?: boolean;
  className?: string;
}) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 flex items-baseline gap-2 text-sm font-medium text-ink-700">
        {label}
        {optional && <span className="text-xs font-normal text-ink-400">optional</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-ink-500">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs text-clay-600">{error}</span>}
    </label>
  );
}

const CONTROL =
  'w-full rounded-xl border border-ink-200 bg-paper-raised px-3.5 py-3 text-ink-900 placeholder:text-ink-400 transition-colors focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cx(CONTROL, className)} {...rest} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cx(CONTROL, 'min-h-28 resize-y', className)} {...rest} />;
});

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(CONTROL, 'appearance-none bg-none pr-10', className)} {...rest}>
      {children}
    </select>
  );
}

/** Big tappable radio card — the onboarding pattern. */
export function ChoiceCard({
  selected,
  onSelect,
  title,
  description,
  name,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
  name: string;
}) {
  return (
    <label
      className={cx(
        'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors',
        selected
          ? 'border-rose-400 bg-rose-50 ring-1 ring-rose-200'
          : 'border-ink-200 bg-paper-raised hover:border-ink-400',
      )}
    >
      <input
        type="radio"
        name={name}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cx(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          selected ? 'border-rose-600 bg-rose-600' : 'border-ink-200',
        )}
      >
        {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
      <span className="min-w-0">
        <span className="block font-medium text-ink-900">{title}</span>
        {description && <span className="mt-0.5 block text-sm text-ink-500">{description}</span>}
      </span>
    </label>
  );
}

export function CheckCard({
  checked,
  onToggle,
  title,
  description,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  description?: string;
}) {
  return (
    <label
      className={cx(
        'flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors',
        checked
          ? 'border-rose-400 bg-rose-50 ring-1 ring-rose-200'
          : 'border-ink-200 bg-paper-raised hover:border-ink-400',
      )}
    >
      <input type="checkbox" checked={checked} onChange={onToggle} className="sr-only" />
      <span
        aria-hidden="true"
        className={cx(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
          checked ? 'border-rose-600 bg-rose-600 text-white' : 'border-ink-200',
        )}
      >
        {checked && <Check size={13} strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="block text-[0.95rem] font-medium text-ink-900">{title}</span>
        {description && <span className="mt-0.5 block text-sm text-ink-500">{description}</span>}
      </span>
    </label>
  );
}

// ---------------------------------------------------------------- Callout

export function Callout({
  tone = 'neutral',
  icon,
  title,
  children,
  className,
}: {
  tone?: Tone;
  icon?: ReactNode;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const toneClass: Record<Tone, string> = {
    rose: 'border-rose-200 bg-rose-50 text-rose-800',
    sage: 'border-sage-300/60 bg-sage-50 text-sage-700',
    amber: 'border-amber-500/25 bg-amber-50 text-amber-700',
    clay: 'border-clay-500/25 bg-clay-50 text-clay-700',
    neutral: 'border-ink-200 bg-paper-sunk text-ink-700',
  };

  return (
    <div className={cx('rounded-2xl border p-4 text-sm leading-relaxed', toneClass[tone], className)}>
      <div className="flex gap-3">
        <span className="mt-0.5 shrink-0">{icon ?? <Info size={16} />}</span>
        <div className="min-w-0">
          {title && <p className="mb-1 font-semibold">{title}</p>}
          <div className="[&_a]:underline [&_a]:underline-offset-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Copy

export function CopyButton({
  value,
  label = 'Copy',
  className,
  size = 'sm',
  variant = 'secondary',
}: {
  value: string;
  label?: string;
  className?: string;
  size?: Size;
  variant?: Variant;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard can be blocked (insecure context, permissions). Fall back to
      // a selection so she can still copy manually.
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* nothing more we can do */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={copy}
      className={className}
      aria-live="polite"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copied' : label}
    </Button>
  );
}

// ---------------------------------------------------------------- Modal

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/35 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-rise relative w-full max-w-lg rounded-t-3xl bg-paper-raised p-6 shadow-lift sm:rounded-3xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-m-2 rounded-full p-2 text-ink-500 hover:bg-paper-sunk hover:text-ink-900"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto">{children}</div>
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Misc

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-dashed border-ink-200 bg-paper-sunk/50 px-6 py-12 text-center">
      {icon && <div className="mb-3 flex justify-center text-ink-400">{icon}</div>}
      <p className="font-display text-lg text-ink-900">{title}</p>
      {children && <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">{children}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cx('border-0 border-t border-ink-100', className)} />;
}
