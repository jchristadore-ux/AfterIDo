import { useState } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAccount } from '@/store/AccountContext';
import { useApp } from '@/store/AppContext';

/**
 * One quiet line at the top of the app suggesting an account.
 *
 * The spec puts "create account" between onboarding and the dashboard, and the
 * onboarding flow does route there — but it is skippable, so this is what
 * catches the people who skipped. It is a strip rather than a modal because an
 * account is genuinely optional here: the checklist works without one, and the
 * only thing it buys is a purchase that survives a new phone. Blocking the app
 * over that would be a lie about how much it matters.
 *
 * Dismissal is per-tab. It's a nudge, and a nudge that returns tomorrow is a
 * nag.
 */
export function AccountNudge() {
  const { config, account, status } = useAccount();
  const { state } = useApp();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('afterido.nudge.dismissed') === '1',
  );

  if (status !== 'ready' || !config.accounts || account || dismissed || state.demoMode) return null;

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem('afterido.nudge.dismissed', '1');
    } catch {
      /* private browsing — the nudge just comes back, which is fine */
    }
  }

  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-champagne-500/25 bg-champagne-50 px-4 py-3 no-print">
      <p className="min-w-0 flex-1 text-sm leading-relaxed text-charcoal-700">
        Your plan is saved on this device only.{' '}
        <Link
          to="/create-account"
          className="font-medium text-charcoal-900 underline underline-offset-2"
        >
          Add your email
        </Link>{' '}
        so nothing is lost if you switch phones.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-full p-1.5 text-charcoal-400 transition-colors hover:bg-champagne-100 hover:text-charcoal-700"
      >
        <X size={15} />
      </button>
    </div>
  );
}
