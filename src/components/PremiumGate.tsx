import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import type { FeatureId } from '@/lib/plan';
import { Button, Card } from './ui';

/**
 * Renders `children` when the plan covers `feature`, otherwise an upgrade
 * panel. No payment code runs anywhere — "unlock" flips a local flag and says
 * so, which is enough to demo the paywall without pretending to take money.
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
  const { can, setPlan } = useApp();

  if (can(feature)) return <>{children}</>;

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-rose-100 bg-gradient-to-br from-rose-50 to-paper-raised px-6 py-7">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white">
          <Sparkles size={13} /> Premium
        </span>
        <h3 className="mt-3 font-display text-xl text-ink-900">{title}</h3>
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-600">{description}</p>
      </div>
      <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-500">
          $19.99 once. No subscription.{' '}
          <Link to="/pricing" className="underline underline-offset-2 hover:text-ink-900">
            See what’s included
          </Link>
        </p>
        <Button onClick={() => setPlan('premium')} className="shrink-0">
          Unlock preview
        </Button>
      </div>
      <p className="border-t border-ink-100 bg-paper-sunk px-6 py-2.5 text-xs text-ink-400">
        Payments aren’t enabled in this build — “Unlock preview” just turns the features on
        locally so you can see them.
      </p>
    </Card>
  );
}
