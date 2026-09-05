import { Check, Sparkles } from 'lucide-react';
import { Callout, Card, LinkButton } from '@/components/ui';
import type { ServerConfig } from '@/lib/api';

function Tick({ children }: { children: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <Check size={15} className="mt-0.5 shrink-0 text-sage-600" />
      {children}
    </li>
  );
}

/** Free vs Premium block — honest when payments are off, same as /premium. */
export function LandingPricing({
  config,
  startPath,
  startLabel,
}: {
  config: ServerConfig;
  startPath: string;
  startLabel: string;
}) {
  return (
    <section className="py-16 sm:py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-primary-600">
            Pricing
          </p>
          <h2 className="text-3xl text-charcoal-900 sm:text-4xl">
            {config.payments
              ? `Free to plan. ${config.priceLabel} if you want it prepared.`
              : 'Free to plan. Premium isn’t for sale here.'}
          </h2>
          <p className="mt-3 text-lg text-charcoal-500">
            {config.payments
              ? 'One payment. Not a subscription. Nothing to cancel.'
              : 'Everything in Free works on this deployment. Premium features are listed so you know what they are — not because you can buy them here.'}
          </p>
        </div>

        {!config.payments && (
          <Callout
            tone="champagne"
            title="Premium isn’t on sale on this deployment"
            className="mx-auto mt-8 max-w-4xl"
          >
            This copy of AfterIDo runs without a payment processor connected, so there is no way to
            buy Premium here and nothing pretends otherwise. Everything in the Free column works
            exactly as described.
          </Callout>
        )}

        <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
          <Card className="flex flex-col p-6">
            <h3 className="text-2xl text-charcoal-900">Free</h3>
            <p className="mt-1 text-sm text-charcoal-500">Everything you need to do it yourself.</p>
            <p className="mt-5 font-display text-4xl text-charcoal-900">$0</p>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm text-charcoal-700">
              {[
                'Your complete personalized checklist',
                'Every category — government, work, financial, insurance, travel, personal',
                'All of it in the right order',
                'Official agency links for each one',
                'Your details filled in once and reused',
                'Progress tracking',
              ].map((f) => (
                <Tick key={f}>{f}</Tick>
              ))}
            </ul>
            <LinkButton to={startPath} variant="secondary" block className="mt-7">
              {startLabel}
            </LinkButton>
          </Card>

          <Card className="flex flex-col border-primary-300 p-6 shadow-lift ring-1 ring-primary-200">
            <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white">
              <Sparkles size={12} /> Most useful
            </span>
            <h3 className="text-2xl text-charcoal-900">Premium</h3>
            <p className="mt-1 text-sm text-charcoal-500">Everything prepared, and somewhere to keep it.</p>
            <p className="mt-5 flex items-baseline gap-2">
              <span className="font-display text-4xl text-charcoal-900">{config.priceLabel}</span>
              <span className="text-sm text-charcoal-400">one time</span>
            </p>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm text-charcoal-700">
              {[
                'Everything in Free',
                'Ready-to-send notification letters',
                'A printable packet for the DMV counter',
                'Document checklists and a vault to track them',
                'Email reminders and your own custom tasks',
                'A dated completion record when you finish',
                'In-depth state guidance where we have verified it',
              ].map((f) => (
                <Tick key={f}>{f}</Tick>
              ))}
            </ul>
            {config.payments ? (
              <LinkButton to="/premium" block className="mt-7">
                See what’s included
              </LinkButton>
            ) : (
              <LinkButton to="/premium" variant="secondary" block className="mt-7">
                Why Premium isn’t available here
              </LinkButton>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
