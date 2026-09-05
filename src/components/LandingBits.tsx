import { Check, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui';

export function PeekRow({
  label,
  meta,
  done,
  current,
  muted,
}: {
  label: string;
  meta: string;
  done?: boolean;
  current?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <span
        aria-hidden="true"
        className={
          done
            ? 'flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-600 text-white'
            : current
              ? 'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-primary-500'
              : 'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-charcoal-200'
        }
      >
        {done && <Check size={11} strokeWidth={3} />}
        {current && <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={
            done
              ? 'block truncate text-sm text-charcoal-500 line-through decoration-charcoal-200'
              : muted
                ? 'block truncate text-sm text-charcoal-400'
                : 'block truncate text-sm font-medium text-charcoal-900'
          }
        >
          {label}
        </span>
      </span>
      <span className="shrink-0 text-xs text-charcoal-400">{meta}</span>
    </div>
  );
}

export function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Sparkles;
  title: string;
  body: string;
}) {
  return (
    <Card className="p-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-sunk text-primary-600">
        <Icon size={20} strokeWidth={1.8} />
      </span>
      <h3 className="mt-4 text-xl text-charcoal-900">{title}</h3>
      <p className="mt-2 leading-relaxed text-charcoal-500">{body}</p>
    </Card>
  );
}
