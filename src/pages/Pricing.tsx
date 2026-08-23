import { useNavigate } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { MarketingShell } from '@/components/MarketingShell';
import { Button, Callout, Card, LinkButton, cx } from '@/components/ui';
import { PLAN_TIERS } from '@/lib/plan';

export function Pricing() {
  const { state, setPlan } = useApp();
  const navigate = useNavigate();

  return (
    <MarketingShell
      eyebrow="Pricing"
      title="Free to plan. Pay once if you want it prepared."
      intro="The checklist and the order of operations are free, forever. Premium is for the parts that save you the most time — and it’s a single payment, not a subscription."
    >
      <div className="space-y-10">
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
                  <LinkButton to="/start" variant="secondary" block>
                    Start free
                  </LinkButton>
                )}
                {tier.id === 'premium' && (
                  <Button
                    block
                    onClick={() => {
                      setPlan('premium');
                      navigate(state.onboarded ? '/app' : '/start');
                    }}
                  >
                    {state.plan === 'premium' ? 'You have Premium' : 'Unlock preview'}
                  </Button>
                )}
                {tier.id === 'premium-plus' && (
                  <Button block variant="secondary" disabled>
                    Not available yet
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        <Callout tone="champagne" title="About payments in this build">
          There is no payment processing here and no code path that takes money. “Unlock preview”
          turns the Premium features on locally so you can see what they do. A production
          deployment would create a Stripe Checkout session server-side and grant the entitlement
          only from a verified webhook.
        </Callout>

        <section>
          <h2 className="text-2xl text-charcoal-900">Questions people actually ask</h2>
          <dl className="mt-5 space-y-5">
            <Faq q="Do I need Premium to change my name?">
              No. The full checklist, the order of operations and every official link are free.
              Premium saves you time — it doesn’t unlock anything the government requires.
            </Faq>
            <Faq q="Is this a subscription?">
              No. Premium is a single $19.99 payment. Premium Plus, if we build it, would be the
              subscription — for households and life events beyond the wedding.
            </Faq>
            <Faq q="Can AfterIDo submit my name change for me?">
              No, and be wary of anything that says it can. Agencies don’t offer that to
              third-party apps. What we do is remove the research and the retyping.
            </Faq>
            <Faq q="What if I’m in a state you haven’t researched?">
              You get the same checklist and the official agency links for your state, and we say
              plainly that we haven’t verified the local specifics — rather than guessing.
            </Faq>
          </dl>
        </section>
      </div>
    </MarketingShell>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-charcoal-100 pt-5">
      <dt className="font-medium text-charcoal-900">{q}</dt>
      <dd className="mt-1.5 leading-relaxed text-charcoal-700">{children}</dd>
    </div>
  );
}
