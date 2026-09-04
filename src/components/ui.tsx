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
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Check, Copy, Info, Plus, X } from 'lucide-react';

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

// ---------------------------------------------------------------- Button

/**
 * The AfterIDo button system.
 *
 * Six variants, all pill-shaped with soft elevation, sized for thumbs:
 *
 *   primary      #D4A5A5 fill, charcoal bold text  "Mark as Updated", "Continue"
 *   secondary    white fill, rose-gold border, ink lettering
 *   success      sage-600 fill, white text + check "Completed"
 *   disabled     #E0E0E0 fill, muted text, flat    (via the disabled attribute)
 *   destructive  white fill, red border, red ink   "Remove"
 *   ghost        text only                          low-emphasis nav
 *
 * ── Why the primary carries charcoal rather than white ────────────────────
 * The brand specifies white on the rose-gold. Measured, that is 2.16:1, where
 * WCAG AA asks 4.5:1 for text — on the app's single most important control,
 * read one-handed on a phone, often outdoors. Charcoal on the *same* brand fill
 * is 5.09:1. So the fill is still exactly #D4A5A5 and the button still looks
 * like AfterIDo; only the lettering changed, and it is the change that costs
 * the brand least. Hover and active go *lighter* rather than darker for the
 * same reason — darkening the fill under dark text would undo it.
 *
 * `disabled` is a state rather than a variant, so it is expressed as disabled:
 * utilities on each variant — a disabled primary and a disabled secondary both
 * land on #E0E0E0 with muted text and no shadow, as specified.
 */
type Variant = 'primary' | 'secondary' | 'success' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

/** Applied to every filled/outlined variant so disabled always looks the same. */
const DISABLED =
  'disabled:bg-disabled disabled:text-disabled-text disabled:border-disabled disabled:shadow-none';

const VARIANT: Record<Variant, string> = {
  primary: `bg-primary text-charcoal-900 font-semibold border border-transparent shadow-button hover:bg-primary-300 active:bg-primary-200 ${DISABLED}`,
  secondary: `bg-white text-primary-800 border border-primary-600 shadow-soft hover:bg-primary-50 active:bg-primary-100 ${DISABLED}`,
  success: `bg-sage-600 text-white font-semibold border border-transparent shadow-soft hover:bg-sage-700 active:bg-sage-800 ${DISABLED}`,
  ghost: 'text-charcoal-700 border border-transparent hover:bg-surface-sunk hover:text-charcoal-900 disabled:text-disabled-text',
  destructive: `bg-white text-destructive-600 border border-destructive shadow-soft hover:bg-destructive-50 hover:text-destructive-700 active:bg-destructive-100 ${DISABLED}`,
};

const SIZE: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm gap-1.5',
  md: 'h-12 px-6 text-[0.95rem] gap-2',
  lg: 'h-14 px-8 text-base gap-2.5',
};

const BUTTON_BASE =
  'inline-flex items-center justify-center rounded-full font-medium transition-all duration-150 select-none disabled:cursor-not-allowed whitespace-nowrap';

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

/**
 * Floating action button — circular, rose-gold, white "+", elevated.
 *
 * Used for "Add Another Place" on the task screens that track several accounts
 * (banks, cards, memberships), where it sits in thumb reach and focuses the
 * add field. `label` is required: the icon alone tells a screen reader nothing.
 *
 * Rendered through a portal to <body> on purpose. `position: fixed` resolves
 * against the nearest ancestor with a transform, and the app shell's <main>
 * carries an entrance animation whose retained keyframe computes to a real
 * matrix — which silently turns it into the containing block and strands the
 * button partway down the page. Portalling past it is what keeps "fixed"
 * meaning "fixed to the viewport".
 */
export function Fab({
  label,
  onClick,
  icon,
  className,
}: {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cx(
        'flex h-14 w-14 items-center justify-center rounded-full bg-primary text-charcoal-900 shadow-fab',
        'transition-transform duration-150 hover:scale-105 active:scale-95',
        className,
      )}
    >
      {icon ?? <Plus size={26} strokeWidth={2.5} />}
    </button>,
    document.body,
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
        'rounded-card border border-charcoal-100 bg-surface shadow-soft',
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
          <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-charcoal-400">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl text-charcoal-900 sm:text-2xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------- Badges

type Tone = 'primary' | 'success' | 'champagne' | 'destructive' | 'neutral';

const TONE: Record<Tone, string> = {
  primary: 'bg-primary-100 text-primary-700 border-primary-200',
  success: 'bg-sage-100 text-sage-700 border-sage-300/60',
  champagne: 'bg-champagne-100 text-charcoal-700 border-champagne-500/25',
  destructive: 'bg-destructive-100 text-destructive-600 border-destructive/25',
  neutral: 'bg-surface-sunk text-charcoal-700 border-charcoal-200',
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
  tone = 'primary',
}: {
  percent: number;
  className?: string;
  tone?: 'primary' | 'success';
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={cx('h-2.5 w-full overflow-hidden rounded-full bg-charcoal-100', className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Name change progress"
    >
      <div
        className={cx(
          'h-full rounded-full transition-[width] duration-700 ease-out',
          tone === 'primary'
            ? 'bg-gradient-to-r from-primary-400 to-primary-600'
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
          stroke="var(--color-charcoal-100)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#aid-ring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.2,0.7,0.3,1)' }}
        />
        <defs>
          <linearGradient id="aid-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-primary-400)" />
            <stop offset="100%" stopColor="var(--color-primary-600)" />
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
      <span className="mb-1.5 flex items-baseline gap-2 text-sm font-medium text-charcoal-700">
        {label}
        {optional && <span className="text-xs font-normal text-charcoal-400">optional</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-charcoal-500">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs text-destructive-600">{error}</span>}
    </label>
  );
}

const CONTROL =
  'w-full rounded-xl border border-charcoal-200 bg-surface px-3.5 py-3 text-charcoal-900 placeholder:text-charcoal-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200';

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
          ? 'border-primary-400 bg-primary-50 ring-1 ring-primary-200'
          : 'border-charcoal-200 bg-surface hover:border-charcoal-400',
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
          selected ? 'border-primary-600 bg-primary-600' : 'border-charcoal-200',
        )}
      >
        {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
      <span className="min-w-0">
        <span className="block font-medium text-charcoal-900">{title}</span>
        {description && <span className="mt-0.5 block text-sm text-charcoal-500">{description}</span>}
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
          ? 'border-primary-400 bg-primary-50 ring-1 ring-primary-200'
          : 'border-charcoal-200 bg-surface hover:border-charcoal-400',
      )}
    >
      <input type="checkbox" checked={checked} onChange={onToggle} className="sr-only" />
      <span
        aria-hidden="true"
        className={cx(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
          checked ? 'border-primary-600 bg-primary-600 text-white' : 'border-charcoal-200',
        )}
      >
        {checked && <Check size={13} strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="block text-[0.95rem] font-medium text-charcoal-900">{title}</span>
        {description && <span className="mt-0.5 block text-sm text-charcoal-500">{description}</span>}
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
    primary: 'border-primary-200 bg-primary-50 text-primary-700',
    success: 'border-sage-300/60 bg-sage-50 text-sage-700',
    champagne: 'border-champagne-500/25 bg-champagne-50 text-charcoal-700',
    destructive: 'border-destructive/25 bg-destructive-50 text-destructive-600',
    neutral: 'border-charcoal-200 bg-surface-sunk text-charcoal-700',
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
  onCopied,
}: {
  value: string;
  label?: string;
  className?: string;
  size?: Size;
  variant?: Variant;
  /** Fired after a successful copy — used for analytics, never for the value. */
  onCopied?: () => void;
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
    onCopied?.();
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
  const dialogRef = useRef<HTMLDivElement>(null);

  /**
   * Escape closes, focus goes into the dialog and stays there, and the page
   * behind it stops scrolling.
   *
   * The trap is the part that was missing. `aria-modal` tells a screen reader
   * the rest of the page is inert; it does not stop Tab walking straight out of
   * the dialog into it, which leaves a keyboard user reading a page they cannot
   * see and pressing Enter on controls they did not mean to. These dialogs
   * confirm deleting an account and restoring over a plan, so that matters.
   */
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusable = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    // The dialog itself takes focus first, so a screen reader announces the
    // title rather than starting partway down the content.
    dialogRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const items = focusable();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === dialogRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (active instanceof Node && !dialogRef.current?.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      // Back to whatever opened the dialog, so the page does not silently
      // dump focus at the top when it closes.
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-charcoal-900/35 backdrop-blur-[2px]"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="animate-rise relative w-full max-w-lg rounded-t-3xl bg-surface p-6 shadow-lift outline-none sm:rounded-3xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-m-2 rounded-full p-2 text-charcoal-500 hover:bg-surface-sunk hover:text-charcoal-900"
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
    <div className="rounded-card border border-dashed border-charcoal-200 bg-surface-sunk/50 px-6 py-12 text-center">
      {icon && <div className="mb-3 flex justify-center text-charcoal-400">{icon}</div>}
      <p className="font-display text-lg text-charcoal-900">{title}</p>
      {children && <p className="mx-auto mt-2 max-w-sm text-sm text-charcoal-500">{children}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cx('border-0 border-t border-charcoal-100', className)} />;
}
