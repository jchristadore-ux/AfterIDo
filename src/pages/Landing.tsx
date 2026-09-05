import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Lock,
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { useAccount } from '@/store/AccountContext';
import { Wordmark } from '@/components/Wordmark';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { Seo } from '@/components/Seo';
import { Button, Card, LinkButton } from '@/components/ui';
import { LandingPricing } from '@/components/LandingPricing';
import { PeekRow } from '@/components/LandingBits';
import { LandingMiddle } from '@/components/LandingMiddle';
import {
  landingFaqForConfig,
  landingOffersJsonLd,
  trustAccountSentence,
} from '@/lib/landingHonesty';
import { faqJsonLd } from '@/data/faq';
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from '@shared/seo';
import { track } from '@/lib/analytics';

/**
 * The landing page.
 *
 * Sections, in order, because the order is the argument: name the problem,
 * show it is three steps, show what you get, be plain about what costs money,
 * answer the objections, then say what we are not. Anything that isn't part of
 * that argument doesn't belong here.
 *
 * Built phone-first. Every stack is single-column until `sm`, the primary
 * action is full-width and thumb-reachable at each stage, and nothing
 * important sits behind a hover.
 */

export function Landing() {
  const { state, enterDemo } = useApp();
  const { config } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    track('landing_viewed');
  }, []);

  function startDemo() {
    enterDemo();
    navigate('/app');
  }

  const startPath = state.onboarded ? '/app' : '/start';
  const startLabel = state.onboarded ? 'Open my plan' : 'Start My Name Change';
  const landingFaq = landingFaqForConfig(config);

  return (
    <div className="min-h-dvh bg-canvas">
      <Seo
        title={DEFAULT_TITLE}
        description={DEFAULT_DESCRIPTION}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebApplication',
              name: 'AfterIDo',
              applicationCategory: 'LifestyleApplication',
              operatingSystem: 'Any',
              description: DEFAULT_DESCRIPTION,
              offers: landingOffersJsonLd(config.payments),
            },
            faqJsonLd(landingFaq),
          ],
        }}
      />

      <SiteHeader />

      {/* ----------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 h-[34rem] w-[52rem] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary-100/70 via-primary-50/40 to-transparent blur-3xl"
        />
        <div className="container-page relative pt-12 pb-6 sm:pt-20 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            {/*
              Hidden on phones. The sticky header already carries the wordmark,
              and at this size it pushed the headline — the thing that actually
              has to land — below the fold on an iPhone. From `sm` up there is
              room for the splash treatment.
            */}
            <Wordmark size="xl" className="mx-auto mb-8 hidden sm:block" />

            <h1 className="text-balance font-display text-[2.35rem] leading-[1.1] text-charcoal-900 sm:text-6xl lg:text-[4.25rem]">
              Change your name everywhere.
              <br />
              <span className="text-primary-700">Without the headache.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-charcoal-700 sm:text-xl">
              One personalized checklist for everything you need to update after getting married —
              from Social Security and your driver’s license to banks, insurance, work, travel and
              more.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LinkButton to={startPath} size="lg" className="w-full sm:w-auto">
                {startLabel}
                <ArrowRight size={18} />
              </LinkButton>
              <LinkButton
                to="/how-it-works"
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto"
              >
                See how it works
              </LinkButton>
            </div>

            <p className="mt-5 text-sm text-charcoal-500">
              Free to start · No account needed to begin ·{' '}
              <button
                type="button"
                onClick={startDemo}
                className="underline underline-offset-4 transition-colors hover:text-primary-600"
              >
                look around with sample data
              </button>
            </p>
          </div>
        </div>

        {/* Product peek */}
        <div className="container-page relative pb-14 sm:pb-20">
          <div className="mx-auto mt-10 max-w-2xl">
            <Card className="overflow-hidden shadow-lift">
              <div className="flex items-center justify-between border-b border-charcoal-100 bg-surface-sunk px-5 py-3">
                <p className="text-sm font-medium text-charcoal-700">Sarah’s name change</p>
                <p className="text-sm text-primary-600">41% complete</p>
              </div>
              <div className="divide-y divide-charcoal-100">
                <PeekRow done label="Certified marriage certificate" meta="3 copies" />
                <PeekRow done label="Social Security" meta="Card arrived" />
                <PeekRow
                  current
                  label="Driver’s license — New Jersey MVC"
                  meta="Walk in, no appointment"
                />
                <PeekRow label="Passport" meta="Blocked until license is done" muted />
                <PeekRow label="Chase, Ally, Montclair CU" meta="1 of 3 banks" muted />
              </div>
              <div className="flex items-center gap-2.5 bg-primary-50 px-5 py-3.5 text-sm text-primary-700">
                <ArrowRight size={15} className="shrink-0" />
                <span>
                  <strong className="font-semibold">Next:</strong> Bring your 6 Points of ID to any
                  NJ MVC licensing center.
                </span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <LandingMiddle />

      <LandingPricing config={config} startPath={startPath} startLabel={startLabel} />

      {/* -------------------------------------------------------- Trust */}
      <section className="border-y border-charcoal-100 bg-surface py-16 sm:py-24">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-primary-600">
              Your information
            </p>
            <h2 className="text-3xl text-charcoal-900 sm:text-4xl">
              We don’t want most of it.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-charcoal-700">
              Your name, address, date of birth and marriage details are stored in your own browser
              and never sent to us.
              {trustAccountSentence(config.accounts)}
            </p>
            <Link
              to="/privacy"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 underline underline-offset-4"
            >
              Read the privacy policy
              <ArrowRight size={14} />
            </Link>
          </div>

          <Card className="p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-sunk text-primary-600">
              <Lock size={20} strokeWidth={1.8} />
            </span>
            <h3 className="mt-4 text-xl text-charcoal-900">We never ask for</h3>
            <ul className="mt-3 space-y-2 text-charcoal-700">
              {[
                'Your Social Security number',
                'Bank or credit card numbers',
                'Your driver’s license or passport number',
                'Any password',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-charcoal-500">
              They aren’t in the data model at all. Tasks tell you to have them ready for the
              agency; the app never asks you to type them.
            </p>
          </Card>
        </div>
      </section>

      {/* ---------------------------------------------------------- FAQ */}
      <section className="py-16 sm:py-24">
        <div className="container-page max-w-3xl">
          <h2 className="text-3xl text-charcoal-900 sm:text-4xl">Questions people actually ask</h2>
          <dl className="mt-8 space-y-6">
            {landingFaq.map(({ q, a }) => (
              <div key={q} className="border-t border-charcoal-100 pt-6">
                <dt className="text-lg font-medium text-charcoal-900">{q}</dt>
                <dd className="mt-2 leading-relaxed text-charcoal-700">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* --------------------------------------------------- Disclaimer */}
      <section className="pb-16">
        <div className="container-page max-w-3xl">
          <div className="rounded-2xl border border-champagne-500/30 bg-champagne-50 p-6">
            <h2 className="text-lg text-charcoal-900">What AfterIDo is not</h2>
            <p className="mt-2 leading-relaxed text-charcoal-700">
              AfterIDo is not a government agency and not a law firm, and nothing here is legal
              advice. We cannot submit a name change on your behalf — no agency offers that to a
              third-party app — and we can’t guarantee that any organization will accept your change
              or how long it will take. What we do is remove the research and the retyping.
            </p>
            <Link
              to="/disclaimer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-charcoal-900 underline underline-offset-4"
            >
              Read the full disclaimer
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- CTA */}
      <section className="pb-16 sm:pb-24">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-[2rem] bg-charcoal-900 px-7 py-14 text-center sm:px-14 sm:py-20">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-primary-600/25 blur-3xl"
            />
            <div className="relative">
              <h2 className="text-balance font-display text-3xl text-white sm:text-5xl">
                It’s one afternoon, not one summer.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-lg text-white/70">
                Start with five minutes of questions. We’ll handle the sequencing, the paperwork and
                the remembering.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <LinkButton to={startPath} size="lg" className="w-full sm:w-auto">
                  {startLabel}
                  <ArrowRight size={18} />
                </LinkButton>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={startDemo}
                  className="w-full text-white/80 hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  Try the demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
