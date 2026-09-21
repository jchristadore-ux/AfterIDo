import { Link } from 'react-router-dom';
import { useAccount } from '@/store/AccountContext';

/**
 * Unmistakable banner when this deployment is taking Stripe *test* payments.
 *
 * Real customers must never think a 4242 card charge (or a test unlock) is a
 * real purchase. Shown site-wide whenever /api/config reports testMode.
 */
export function TestModeBanner() {
  const { status, config } = useAccount();
  if (status === 'loading') return null;
  if (!config.testMode) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-[60] border-b border-champagne-500/40 bg-champagne-100 px-4 py-2.5 text-center text-sm font-medium text-charcoal-900"
    >
      <span className="font-semibold">Stripe test mode.</span> No real charges.
      Premium unlocks here are for testing only —{' '}
      <Link to="/premium" className="underline underline-offset-2">
        see pricing
      </Link>
      .
      {config.stripeMode === 'test' && config.payments === false ? (
        <span className="mt-1 block text-xs font-normal text-charcoal-700">
          Payments are not fully enabled on this deployment (check price id and webhook secret).
        </span>
      ) : null}
    </div>
  );
}
