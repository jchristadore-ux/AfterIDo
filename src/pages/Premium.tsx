import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, Lock, Sparkles } from 'lucide-react';
import { MarketingShell } from '@/components/MarketingShell';
import { Seo } from '@/components/Seo';
import { Button, Callout, Card, LinkButton, cx } from '@/components/ui';
import { PLAN_TIERS } from '@/lib/plan';
import { useAccount } from '@/store/AccountContext';
import { useApp } from '@/store/AppContext';
import { track } from '@/lib/analytics';
import { ApiError } from '@/lib/api';
import { PRICING_FAQ, faqJsonLd } from '@/data/faq';

/**
 * The paywall.
 *
 * Three states, and the page is honest in all of them: signed in and able to
 * buy, signed out and needing an account first, or running somewhere with no
 * payment processor at all — which is what a static preview deployment is.
 */
export function Premium() {
  const { state } = useApp();
  const { config, account, plan, beginCheckout, busy } = useAccount();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(
    params.get('checkout') === 'cancelled'
      ? 'Your payment was cancelled and you have not been charged.'
      : null,
  );

  useEffect(() => {
    track('premium_viewed');
  }, []);

  async function buy() {
    setError(null);
    if (!account) {
      navigate(`/create-account?next=${encodeURIComponent('/premium')}`);
      return;
    }
    try {
      track('checkout_started');
      await beginCheckout();
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'We could not start checkout. Try again.',
      );
    }
  }

  const alreadyPremium = plan === 'premium' && !state.demoMode;

  return (
    <MarketingShell
      eyebrow="Pricing"
      title="Free to plan. Pay once if you want it prepared."
      intro="The checklist, the order of operations and every official link are free, forever. Premium is for the parts that save the most time — one payment, no subscription, nothing to cancel."
    >
      <Seo
        title="AfterIDo Premium — $19.99 once, no subscription"
        description="Unlock the complete roadmap: state guidance, notification letters, document checklists, a printable packet, reminders and custom tasks. One payment, not a subscription."
        jsonLd={faqJsonLd(PRICING_FAQ)}
      />

      <div className="space-y-10">
        {error && (
          <Callout tone="destructive" title="Payment not completed">
            {error}
          </Callout>
        )}

        {alreadyPremium && (
          <Callout tone="success" title="You have Premium">
            Bought {account?.premiumSince ? formatGrantDate(account.premiumSince) : 'already'} on{' '}
            {account?.email}. Sign in with that address on any device and it comes with you.{' '}
            <Link to="/app">Open my plan</Link>
          </Callout>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          {PLAN_TIERS.map((tier) => (
            <Card
              key={tier.id}
              className={cx(
                'flex flex-col p-6',
                tier.highlight && 'border-primary-300 shadow-lift ring-1 ring-primary-200',
                !tier.available && 'opacity-70',
              )}
            >
              {tier.highlight && (
                <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white">
                  <Sparkles size={12} /> Most useful
                </span>
              )}

              <h2 className="text-2xl text-charcoal-900">{tier.name}</h2>
              <p className="mt-1 text-sm text-charcoal-500">{tier.tagline}</p>

              <p className="mt-5 flex items-baseline gap-2">
                <span className="font-display text-4xl text-charcoal-900">{tier.price}</span>
                {tier.cadence && <span className="text-sm text-charcoal-400">{tier.cadence}</span>}
              </p>

              <ul className="mt-6 flex-1 space-y-2.5 text-sm text-charcoal-700">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check size={15} className="mt-0.5 shrink-0 text-sage-600" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                {tier.id === 'free' && (
                  <LinkButton to={state.onboarded ? '/app' : '/start'} variant="secondary" block>
                    {state.onboarded ? 'Open my plan' : 'Start free'}
                  </LinkButton>
                )}

                {tier.id === 'premium' &&
                  (alreadyPremium ? (
                    <LinkButton to="/app" block variant="success">
                      You have Premium
                    </LinkButton>
                  ) : config.payments ? (
                    <Button block onClick={buy} disabled={busy}>
                      {busy ? 'Opening checkout…' : `Unlock Premium — ${config.priceLabel}`}
                    </Button>
                  ) : (
                    <Button block variant="secondary" disabled>
                      <Lock size={15} className="mr-1.5" /> Not available here
                    </Button>
                  ))}

                {tier.id === 'premium-plus' && (
                  <Button block variant="secondary" disabled>
                    Not available yet
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {config.payments ? (
          <p className="text-center text-sm text-charcoal-500">
            Payment is handled by Stripe on their own secure page.{' '}
            <strong className="font-medium text-charcoal-700">
              Your card details never reach AfterIDo.
            </strong>
            {config.testMode && (
              <>
                {' '}
                <span className="rounded-full bg-champagne-100 px-2 py-0.5 text-xs font-medium text-charcoal-900">
                  Stripe is in test mode — no real charge will be made.
                </span>
              </>
            )}
          </p>
        ) : (
          <Callout tone="champagne" title="Premium isn’t on sale on this deployment">
            This copy of AfterIDo runs without a payment processor connected, so there is no way to
            buy Premium here and nothing pretends otherwise. Everything in the Free column works
            exactly as described.
          </Callout>
        )}

        <section>
          <h2 className="text-2xl text-charcoal-900">Questions people actually ask</h2>
          <dl className="mt-5 space-y-5">
            {PRICING_FAQ.map(({ q, a }) => (
              <div key={q} className="border-t border-charcoal-100 pt-5">
                <dt className="font-medium text-charcoal-900">{q}</dt>
                <dd className="mt-1.5 leading-relaxed text-charcoal-700">{a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="text-center">
          <LinkButton to={state.onboarded ? '/app' : '/start'} size="lg">
            {state.onboarded ? 'Open my plan' : 'Start My Name Change'}
            <ArrowRight size={18} />
          </LinkButton>
        </div>
      </div>
    </MarketingShell>
  );
}

function formatGrantDate(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
