import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Banknote,
  Briefcase,
  Check,
  ClipboardList,
  FileText,
  Landmark,
  Lock,
  Plane,
  ShieldCheck,
  Sparkles,
  UserRoundPen,
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { useAccount } from '@/store/AccountContext';
import { Wordmark } from '@/components/Wordmark';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { Seo } from '@/components/Seo';
import { Button, Card, LinkButton } from '@/components/ui';
import { LANDING_FAQ, faqJsonLd } from '@/data/faq';
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from '@shared/seo';
import { TASKS } from '@/data/tasks';
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

const STEPS = [
  {
    n: '01',
    icon: UserRoundPen,
    title: 'Answer a few questions',
    body: 'Your current name, your new name, where you married, and which of a dozen circumstances apply. About five minutes, once.',
  },
  {
    n: '02',
    icon: ClipboardList,
    title: 'Get your checklist',
    body: 'Every agency, account and policy that needs to know — filtered to the ones that actually apply to you, in the order that works.',
  },
  {
    n: '03',
    icon: Check,
    title: 'Work through it',
    body: 'Your details ready to paste, the official link for each step, what to bring, and a record of what’s done.',
  },
];

const CATEGORIES = [
  { icon: Landmark, label: 'Government', body: 'Social Security, licence, passport, voter registration, IRS.' },
  { icon: Briefcase, label: 'Employment', body: 'HR and payroll, benefits, retirement plan, professional licences.' },
  { icon: Banknote, label: 'Financial', body: 'Banks, credit cards, mortgage, loans, investments, credit bureaus.' },
  { icon: ShieldCheck, label: 'Insurance', body: 'Health, auto, home or renters, life, and your beneficiaries.' },
  { icon: Plane, label: 'Travel', body: 'Passport, TSA PreCheck, Global Entry, airline and hotel profiles.' },
  { icon: FileText, label: 'Personal', body: 'Will, deeds, utilities, doctors, schools, subscriptions, the vet.' },
];

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
              offers: [
                { '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Free' },
                { '@type': 'Offer', price: '19.99', priceCurrency: 'USD', name: 'Premium' },
              ],
            },
            faqJsonLd(LANDING_FAQ),
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

      {/* --------------------------------------------------- How it works */}
      <section id="how-it-works" className="border-y border-charcoal-100 bg-surface py-16 sm:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-primary-600">
              How it works
            </p>
            <h2 className="text-3xl text-charcoal-900 sm:text-4xl">Three steps. That’s the whole app.</h2>
            <p className="mt-3 text-lg text-charcoal-500">
              No research. No spreadsheet. No wondering what you’ve forgotten.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:mt-16 md:grid-cols-3">
            {STEPS.map(({ n, icon: Icon, title, body }) => (
              <Card key={n} className="p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                    <Icon size={20} strokeWidth={1.8} />
                  </span>
                  <span className="font-display text-sm tracking-widest text-charcoal-400">{n}</span>
                </div>
                <h3 className="mt-4 text-xl text-charcoal-900">{title}</h3>
                <p className="mt-2 leading-relaxed text-charcoal-500">{body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- Order matters */}
      <section className="py-16 sm:py-24">
        <div className="container-page grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-primary-600">
              The part nobody tells you
            </p>
            <h2 className="text-3xl text-charcoal-900 sm:text-4xl">Order matters more than effort.</h2>
            <p className="mt-4 text-lg leading-relaxed text-charcoal-700">
              Go to the DMV before Social Security has processed your change and you will be sent
              home. Book a flight before your passport is updated and the name won’t match your
              ticket.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-charcoal-700">
              AfterIDo sequences everything, explains why each step comes when it does, and locks
              the ones that aren’t ready yet.
            </p>
            <LinkButton to="/how-it-works" variant="secondary" className="mt-7">
              See the full order
              <ArrowRight size={16} />
            </LinkButton>
          </div>

          <ol className="space-y-3">
            {[
              ['Marriage certificate', 'Certified copies. Everything else asks for one.'],
              ['Social Security', 'The master record every other agency checks against.'],
              ['Driver’s license', 'Only once Social Security has processed.'],
              ['Passport', 'After your government ID matches.'],
              ['Everything else', 'Banks, work, insurance, and the rest of your life.'],
            ].map(([title, body], i) => (
              <li
                key={title}
                className="flex gap-4 rounded-2xl border border-charcoal-100 bg-surface p-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 font-display text-sm text-white">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-medium text-charcoal-900">{title}</span>
                  <span className="mt-0.5 block text-sm text-charcoal-500">{body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------- What you get */}
      <section className="border-t border-charcoal-100 bg-surface py-16 sm:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-primary-600">
              What you get
            </p>
            <h2 className="text-3xl text-charcoal-900 sm:text-4xl">
              Seven categories. {TASKS.length} possible changes.
            </h2>
            <p className="mt-3 text-lg text-charcoal-500">
              Only the ones that apply to you actually appear.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map(({ icon: Icon, label, body }) => (
              <Card key={label} className="p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-sunk text-primary-600">
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <h3 className="mt-3.5 text-lg text-charcoal-900">{label}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-charcoal-500">{body}</p>
              </Card>
            ))}
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <FeatureCard
              icon={Sparkles}
              title="Type it once"
              body="Your name, address, date of birth and marriage details are laid out on every task in the order that organization asks for them. One tap to copy."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Only official sources"
              body="Every link goes to a government agency or the company itself — never an affiliate. We never invent a requirement, and we say where each fact came from."
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Free vs Premium */}
      <section className="py-16 sm:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-primary-600">
              Pricing
            </p>
            <h2 className="text-3xl text-charcoal-900 sm:text-4xl">
              Free to plan. {config.priceLabel} if you want it prepared.
            </h2>
            <p className="mt-3 text-lg text-charcoal-500">
              One payment. Not a subscription. Nothing to cancel.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
            <Card className="flex flex-col p-6">
              <h3 className="text-2xl text-charcoal-900">Free</h3>
              <p className="mt-1 text-sm text-charcoal-500">Everything you need to do it yourself.</p>
              <p className="mt-5 font-display text-4xl text-charcoal-900">$0</p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm text-charcoal-700">
                {[
                  'Your personalized checklist',
                  'Every government step, in the right order',
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
                  'The complete roadmap — financial, insurance, travel and personal',
                  'State-specific guidance for your state',
                  'Ready-to-send notification letters',
                  'Document checklists and a vault to track them',
                  'A printable packet for the DMV counter',
                  'Email reminders and your own custom tasks',
                ].map((f) => (
                  <Tick key={f}>{f}</Tick>
                ))}
              </ul>
              <LinkButton to="/premium" block className="mt-7">
                See what’s included
              </LinkButton>
            </Card>
          </div>
        </div>
      </section>

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
              and never sent to us. If you make an account, the only thing on our side is your email
              address and whether you bought Premium.
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
            {LANDING_FAQ.map(({ q, a }) => (
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

function Tick({ children }: { children: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <Check size={15} className="mt-0.5 shrink-0 text-sage-600" />
      {children}
    </li>
  );
}

function PeekRow({
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
            ? 'flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-500 text-white'
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

function FeatureCard({
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
