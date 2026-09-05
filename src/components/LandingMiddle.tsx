import {
  ArrowRight,
  Banknote,
  Briefcase,
  Check,
  ClipboardList,
  FileText,
  Landmark,
  Plane,
  ShieldCheck,
  Sparkles,
  UserRoundPen,
} from 'lucide-react';
import { Card, LinkButton } from '@/components/ui';
import { FeatureCard } from '@/components/LandingBits';
import { TASKS } from '@/data/tasks';

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

export function LandingMiddle() {
  return (
    <>
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
    </>
  );
}
