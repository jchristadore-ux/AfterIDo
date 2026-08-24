import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { useAccount } from '@/store/AccountContext';
import type { FeatureId } from '@/lib/plan';
import { Card, LinkButton } from './ui';

/**
 * Renders `children` when the plan covers `feature`, otherwise an upgrade
 * panel.
 *
 * This is a convenience, not a security boundary — it decides what to draw,
 * and drawing decisions happen in a browser the user controls. The features it
 * hides are all computed from data she already gave us, so there is nothing
 * here worth stealing; the two things that *are* worth protecting, her
 * entitlement and her payment, are decided by the server (see worker/index.ts)
 * and cannot be reached by editing anything on this side.
 */
export function PremiumGate({
  feature,
  title,
  description,
  children,
}: {
  feature: FeatureId;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { can } = useApp();
  const { config } = useAccount();

  if (can(feature)) return <>{children}</>;

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-primary-100 bg-gradient-to-br from-primary-50 to-surface px-6 py-7">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white">
          <Sparkles size={13} /> Premium
        </span>
        <h3 className="mt-3 font-display text-xl text-charcoal-900">{title}</h3>
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-charcoal-700">{description}</p>
      </div>

      <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-charcoal-500">
          {config.priceLabel} once. No subscription.{' '}
          <Link to="/premium" className="underline underline-offset-2 hover:text-charcoal-900">
            See what’s included
          </Link>
        </p>
        <LinkButton to="/premium" className="shrink-0">
          Unlock Premium
        </LinkButton>
      </div>

      {!config.payments && (
        <p className="border-t border-charcoal-100 bg-surface-sunk px-6 py-2.5 text-xs text-charcoal-400">
          Premium can’t be bought on this preview — it isn’t connected to a payment processor.
          Everything free still works.
        </p>
      )}
    </Card>
  );
}
