import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ClipboardList,
  FileText,
  Lock,
  ShieldCheck,
  Sparkles,
  UserRoundPen,
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Wordmark, WordmarkLink } from '@/components/Wordmark';
import { Button, Card, LinkButton } from '@/components/ui';
import { DISCLAIMER_TEXT } from '@/components/Disclaimer';
import { TASKS } from '@/data/tasks';

const STEPS = [
  {
    n: '01',
    icon: UserRoundPen,
    title: 'Tell us about you',
    body: 'One short form — your current name, your new name, and where you got married. Five minutes, once.',
  },
  {
    n: '02',
    icon: ClipboardList,
    title: 'We build your checklist',
    body: 'Every agency, account and policy that needs to know, in the order that actually works.',
  },
  {
    n: '03',
    icon: Check,
    title: 'Complete each change',
    body: 'Your details ready to paste, the official link, and a record of what’s done.',
  },
];

export function Landing() {
  const { state, enterDemo } = useApp();
  const navigate = useNavigate();

  function startDemo() {
    enterDemo();
    navigate('/app');
  }

  return (
    <div className="min-h-dvh bg-canvas">
      {/* ------------------------------------------------------------ Nav */}
      <header className="sticky top-0 z-40 border-b border-charcoal-100/70 bg-canvas/80 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between">
          <WordmarkLink />
          <nav className="flex items-center gap-1 sm:gap-3">
            <Link
              to="/how-it-works"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-charcoal-700 hover:bg-surface-sunk sm:block"
            >
              How it works
            </Link>
            <Link
              to="/pricing"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-charcoal-700 hover:bg-surface-sunk sm:block"
            >
              Pricing
            </Link>
            {state.onboarded ? (
              <LinkButton to="/app" size="sm">
                Open my plan
              </LinkButton>
            ) : (
              <LinkButton to="/start" size="sm">
                Get started
              </LinkButton>
            )}
          </nav>
        </div>
      </header>

      {/* ----------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 h-[34rem] w-[52rem] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary-100/70 via-primary-50/40 to-transparent blur-3xl"
        />
        <div className="container-page relative pt-16 pb-6 sm:pt-24 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            {/* Splash treatment: the wordmark leads, then the tagline. */}
            <Wordmark size="xl" className="mx-auto mb-8" />

            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-champagne-300 bg-champagne-100 px-3.5 py-1.5 text-xs font-medium text-charcoal-900">
              <Sparkles size={13} />
              Built for the weeks right after the wedding
            </p>

            <h1 className="text-balance font-display text-[2.6rem] leading-[1.08] text-charcoal-900 sm:text-6xl lg:text-7xl">
              Your new name,
              <br />
              <span className="text-primary-700">everywhere it matters.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-charcoal-700 sm:text-xl">
              Update your name after ‘I do’ without the paperwork headache. Tell us once, and
              we’ll walk you through every account, document and agency that still knows you by
              your old name.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LinkButton to="/start" size="lg" className="w-full sm:w-auto">
                Update My Name
                <ArrowRight size={18} />
              </LinkButton>
              <LinkButton
                to="/how-it-works"
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto"
              >
                See How It Works
              </LinkButton>
            </div>

            <button
              type="button"
              onClick={startDemo}
              className="mt-5 text-sm text-charcoal-500 underline underline-offset-4 transition-colors hover:text-primary-600"
            >
              Or look around with sample data first — no account needed
            </button>
          </div>
        </div>

        {/* Product peek */}
        <div className="container-page relative pb-16 sm:pb-24">
          <div className="mx-auto mt-12 max-w-2xl">
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
                  <strong className="font-semibold">Next:</strong> Bring your 6 Points of ID to
                  any NJ MVC licensing center.
                </span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- 3 steps */}
      <section className="border-y border-charcoal-100 bg-surface py-16 sm:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl text-charcoal-900 sm:text-4xl">Three steps. That’s the whole app.</h2>
            <p className="mt-3 text-lg text-charcoal-500">
              No research. No spreadsheets. No wondering what you’ve forgotten.
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

      {/* --------------------------------------------------------- Order */}
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
              AfterIDo sequences everything for you, explains why each step comes when it does,
              and locks the ones that aren’t ready yet.
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
              <li key={title} className="flex gap-4 rounded-2xl border border-charcoal-100 bg-surface p-4">
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

      {/* -------------------------------------------------------- Features */}
      <section className="border-t border-charcoal-100 bg-surface py-16 sm:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl text-charcoal-900 sm:text-4xl">
              Everything in one place, finally
            </h2>
            <p className="mt-3 text-lg text-charcoal-500">
              {TASKS.length} possible changes tracked. Only the ones that apply to you.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            <FeatureCard
              icon={Sparkles}
              title="Type it once"
              body="Your name, address, date of birth and marriage details are filled in on every task, laid out in the order each agency asks for them. One tap to copy."
            />
            <FeatureCard
              icon={FileText}
              title="A packet you can print"
              body="Your whole plan as one document — information summary, document checklist, step-by-step instructions and where you left off. Take it to the DMV."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Only official sources"
              body="Every link goes to a government agency or the company itself. We never invent a requirement, and we tell you where each fact came from."
            />
            <FeatureCard
              icon={Lock}
              title="Careful with your details"
              body="We never ask for your Social Security number or account numbers. In this build nothing you type leaves your device."
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- CTA */}
      <section className="py-16 sm:py-24">
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
                Start with the five minutes of questions. We’ll handle the sequencing, the
                paperwork and the remembering.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <LinkButton to="/start" size="lg" className="w-full sm:w-auto">
                  Update My Name
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

      {/* ---------------------------------------------------------- Footer */}
      <footer className="border-t border-charcoal-100 py-10">
        <div className="container-page">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <WordmarkLink />
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-charcoal-500">
              <Link to="/how-it-works" className="hover:text-charcoal-900">
                How it works
              </Link>
              <Link to="/pricing" className="hover:text-charcoal-900">
                Pricing
              </Link>
              <Link to="/trust" className="hover:text-charcoal-900">
                Privacy &amp; trust
              </Link>
              <ExternalLink href="https://www.usa.gov/name-change">
                Official name-change info
              </ExternalLink>
            </nav>
          </div>
          <p className="mt-8 max-w-3xl text-xs leading-relaxed text-charcoal-400">{DISCLAIMER_TEXT}</p>
        </div>
      </footer>
    </div>
  );
}

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-charcoal-900">
      {children}
    </a>
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

