import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { MarketingShell } from '@/components/MarketingShell';
import { Seo } from '@/components/Seo';
import { Button, Callout, Card, LinkButton } from '@/components/ui';
import { useAccount } from '@/store/AccountContext';
import { track } from '@/lib/analytics';

/**
 * Where Stripe sends her back after paying.
 *
 * The important thing this page does *not* do: believe the URL. Landing here
 * grants nothing. It asks the server to confirm, and the server asks Stripe.
 * A forged `?session_id=` produces the "not confirmed yet" state, not Premium.
 *
 * A short retry loop covers the ordinary case where the webhook is still in
 * flight when the browser arrives — a second or two, usually less.
 */
export function PremiumSuccess() {
  const [params] = useSearchParams();
  const { confirmCheckout, refresh, plan, config } = useAccount();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'done' | 'pending'>('checking');
  const started = useRef(false);

  const sessionId = params.get('session_id');

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      if (!sessionId || !config.payments) {
        await refresh();
        setStatus('pending');
        return;
      }

      for (let attempt = 0; attempt < 5; attempt++) {
        if (await confirmCheckout(sessionId)) {
          track('purchase_completed');
          setStatus('done');
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
      }
      setStatus('pending');
    })();
  }, [sessionId, config.payments, confirmCheckout, refresh]);

  const unlocked = status === 'done' || plan === 'premium';

  return (
    <MarketingShell
      title={unlocked ? 'Premium is unlocked' : 'Finishing up…'}
      intro={
        unlocked
          ? 'Thank you. Everything is open on your plan now, on this device and any other you sign in from.'
          : undefined
      }
    >
      <Seo title="Purchase complete" noindex />

      <Card className="p-7 text-center">
        {status === 'checking' && !unlocked && (
          <>
            <Loader2 size={28} className="mx-auto animate-spin text-primary-500" />
            <p className="mt-4 text-charcoal-700">
              Confirming your payment with Stripe. This usually takes a couple of seconds.
            </p>
          </>
        )}

        {unlocked && (
          <>
            <CheckCircle2 size={34} className="mx-auto text-sage-600" />
            <p className="mt-4 text-lg text-charcoal-900">You’re all set.</p>
            <p className="mx-auto mt-2 max-w-md leading-relaxed text-charcoal-700">
              State-specific guidance, notification letters, your document checklist, the printable
              packet, reminders and custom tasks are all open. Stripe has emailed your receipt.
            </p>
            <div className="mt-7">
              <LinkButton to="/app" size="lg">
                Open my plan
              </LinkButton>
            </div>
          </>
        )}

        {status === 'pending' && !unlocked && (
          <>
            <Callout tone="champagne" title="We haven’t seen the payment yet">
              If you completed checkout, this usually settles within a minute — Stripe sometimes
              takes a moment to tell us. Reload this page, or open your plan and it will appear.
              Nothing is lost either way, and you have not been charged twice.
            </Callout>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button onClick={() => window.location.reload()}>Check again</Button>
              <Button variant="secondary" onClick={() => navigate('/app')}>
                Open my plan
              </Button>
            </div>
            {config.supportEmail && (
              <p className="mt-5 text-sm text-charcoal-500">
                Still nothing after a few minutes?{' '}
                <a
                  href={`mailto:${config.supportEmail}`}
                  className="underline underline-offset-2 hover:text-charcoal-900"
                >
                  {config.supportEmail}
                </a>{' '}
                and we’ll sort it out.
              </p>
            )}
          </>
        )}
      </Card>
    </MarketingShell>
  );
}
