import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Info, Lock } from 'lucide-react';
import type { CircumstanceId, NameChangeKind, Profile, StateCode } from '@/types';
import { useApp } from '@/store/AppContext';
import { useAccount } from '@/store/AccountContext';
import { Seo } from '@/components/Seo';
import { WordmarkLink } from '@/components/Wordmark';
import { track } from '@/lib/analytics';
import {
  Button,
  Callout,
  Card,
  CheckCard,
  ChoiceCard,
  Field,
  Input,
  Select,
  cx,
} from '@/components/ui';
import { CIRCUMSTANCES } from '@/data/categories';
import { US_STATES } from '@/data/states';
import { tasksForProfile } from '@/data/tasks';
import { formatPhone, fullName } from '@/lib/format';

const NAME_CHANGE_OPTIONS: { id: NameChangeKind; title: string; description: string }[] = [
  {
    id: 'spouse-last-name',
    title: 'Taking my spouse’s last name',
    description: 'The most common path — your last name becomes theirs.',
  },
  {
    id: 'hyphenated',
    title: 'Hyphenating our last names',
    description: 'Johnson-Smith. Both names, joined.',
  },
  {
    id: 'combined',
    title: 'Combining our last names',
    description: 'A new last name made from both of yours.',
  },
  {
    id: 'middle-name-change',
    title: 'Moving my last name to my middle',
    description: 'Sarah Elizabeth Johnson becomes Sarah Johnson Smith.',
  },
  { id: 'other', title: 'Something else', description: 'Tell us in a few words.' },
];

type StepId = 'you' | 'contact' | 'new-name' | 'marriage' | 'life' | 'review';

const STEPS: { id: StepId; label: string }[] = [
  { id: 'you', label: 'About you' },
  { id: 'contact', label: 'Contact' },
  { id: 'new-name', label: 'New name' },
  { id: 'marriage', label: 'Marriage' },
  { id: 'life', label: 'Your life' },
  { id: 'review', label: 'Review' },
];

export function Onboarding() {
  const { state, completeOnboarding } = useApp();
  const { config, account } = useAccount();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [profile, setProfile] = useState<Profile>(state.profile);
  const [touched, setTouched] = useState(false);

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  useEffect(() => {
    track('onboarding_started');
  }, []);

  const errors = validate(step.id, profile);
  const canAdvance = Object.keys(errors).length === 0;

  const taskCount = useMemo(() => tasksForProfile(profile).length, [profile]);

  function patch(update: Partial<Profile>) {
    setProfile((p) => ({ ...p, ...update }));
  }

  function next() {
    if (!canAdvance) {
      setTouched(true);
      return;
    }
    setTouched(false);
    if (isLast) {
      completeOnboarding(profile);
      track('onboarding_completed');
      // The one screen between here and the dashboard, and only when it can
      // do something: an account offer needs a server, and someone already
      // signed in has no use for it. It is skippable either way.
      navigate(config.accounts && !account ? '/create-account?next=%2Fapp' : '/app');
      return;
    }
    setIndex((i) => i + 1);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }

  function back() {
    setTouched(false);
    if (index === 0) {
      navigate('/');
      return;
    }
    setIndex((i) => i - 1);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }

  const err = (key: string) => (touched ? errors[key] : undefined);

  return (
    <div className="min-h-dvh bg-canvas">
      <Seo title="Start your name change" noindex />
      <header className="border-b border-charcoal-100 bg-surface">
        <div className="container-page flex h-16 items-center justify-between">
          <WordmarkLink />
          <p className="text-sm text-charcoal-500">
            Step {index + 1} of {STEPS.length}
          </p>
        </div>
        <div className="h-1 w-full bg-charcoal-100">
          <div
            className="h-full bg-primary-600 transition-[width] duration-500 ease-out"
            style={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </header>

      <main className="container-page max-w-2xl pt-9 pb-32">
        <div key={step.id} className="animate-rise">
          {step.id === 'you' && (
            <StepShell
              welcome="Welcome to the easiest way to update your name after ‘I do’."
              title="Let’s start with your name today"
              intro="This is the name that’s currently on your license, your bank account and your Social Security record."
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="First name" error={err('currentFirst')}>
                  <Input
                    value={profile.currentName.first}
                    autoComplete="given-name"
                    onChange={(e) =>
                      patch({ currentName: { ...profile.currentName, first: e.target.value } })
                    }
                  />
                </Field>
                <Field label="Middle name" optional>
                  <Input
                    value={profile.currentName.middle}
                    autoComplete="additional-name"
                    onChange={(e) =>
                      patch({ currentName: { ...profile.currentName, middle: e.target.value } })
                    }
                  />
                </Field>
                <Field label="Last name" error={err('currentLast')}>
                  <Input
                    value={profile.currentName.last}
                    autoComplete="family-name"
                    onChange={(e) =>
                      patch({ currentName: { ...profile.currentName, last: e.target.value } })
                    }
                  />
                </Field>
              </div>

              <Field
                label="Date of birth"
                hint="Every agency asks for it. We fill it in for you from here on."
                error={err('dateOfBirth')}
                className="mt-4 max-w-xs"
              >
                <Input
                  type="date"
                  value={profile.dateOfBirth}
                  autoComplete="bday"
                  onChange={(e) => patch({ dateOfBirth: e.target.value })}
                />
              </Field>

              <Callout tone="neutral" icon={<Lock size={16} />} className="mt-6">
                We never ask for your Social Security number, license number, or any account
                number. In this build, nothing you type leaves your device.
              </Callout>
            </StepShell>
          )}

          {step.id === 'contact' && (
            <StepShell
              title="Where can we reach you?"
              intro="Your address goes on almost every form. Use the one on your license."
            >
              <Field label="Street address" error={err('line1')}>
                <Input
                  value={profile.address.line1}
                  autoComplete="address-line1"
                  onChange={(e) => patch({ address: { ...profile.address, line1: e.target.value } })}
                />
              </Field>
              <Field label="Apartment, suite, unit" optional className="mt-4">
                <Input
                  value={profile.address.line2}
                  autoComplete="address-line2"
                  onChange={(e) => patch({ address: { ...profile.address, line2: e.target.value } })}
                />
              </Field>

              <div className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
                <Field label="City" error={err('city')}>
                  <Input
                    value={profile.address.city}
                    autoComplete="address-level2"
                    onChange={(e) => patch({ address: { ...profile.address, city: e.target.value } })}
                  />
                </Field>
                <Field label="State" error={err('state')}>
                  <Select
                    value={profile.address.state}
                    onChange={(e) =>
                      patch({
                        address: { ...profile.address, state: e.target.value as StateCode },
                      })
                    }
                  >
                    <option value="">Choose…</option>
                    {US_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="ZIP" error={err('zip')}>
                  <Input
                    value={profile.address.zip}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={10}
                    onChange={(e) => patch({ address: { ...profile.address, zip: e.target.value } })}
                  />
                </Field>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Phone" error={err('phone')}>
                  <Input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={profile.phone}
                    onChange={(e) => patch({ phone: e.target.value })}
                    onBlur={() => patch({ phone: formatPhone(profile.phone) })}
                  />
                </Field>
                <Field label="Email" error={err('email')}>
                  <Input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={profile.email}
                    onChange={(e) => patch({ email: e.target.value })}
                  />
                </Field>
              </div>

              {profile.address.state && (
                <Callout tone="primary" className="mt-6">
                  We’ll tailor your license, voting and professional-licensing steps to{' '}
                  <strong>{US_STATES.find((s) => s.code === profile.address.state)?.name}</strong>.
                </Callout>
              )}
            </StepShell>
          )}

          {step.id === 'new-name' && (
            <StepShell
              title="What will your new legal name be?"
              intro="Write it exactly as you want it to appear on your license and passport."
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="New first name" error={err('newFirst')}>
                  <Input
                    value={profile.newName.first}
                    onChange={(e) => patch({ newName: { ...profile.newName, first: e.target.value } })}
                  />
                </Field>
                <Field label="New middle name" optional>
                  <Input
                    value={profile.newName.middle}
                    onChange={(e) =>
                      patch({ newName: { ...profile.newName, middle: e.target.value } })
                    }
                  />
                </Field>
                <Field label="New last name" error={err('newLast')}>
                  <Input
                    value={profile.newName.last}
                    onChange={(e) => patch({ newName: { ...profile.newName, last: e.target.value } })}
                  />
                </Field>
              </div>

              {fullName(profile.newName).trim().length > 0 && (
                <div className="mt-5 rounded-2xl border border-primary-200 bg-primary-50 px-5 py-4 text-center">
                  <p className="text-xs uppercase tracking-[0.14em] text-primary-600">
                    Your new legal name
                  </p>
                  <p className="mt-1 font-display text-2xl text-charcoal-900">
                    {fullName(profile.newName)}
                  </p>
                </div>
              )}

              <fieldset className="mt-8">
                <legend className="mb-3 text-sm font-medium text-charcoal-700">
                  How did your name change?
                </legend>
                <div className="space-y-2.5">
                  {NAME_CHANGE_OPTIONS.map((opt) => (
                    <ChoiceCard
                      key={opt.id}
                      name="name-change-kind"
                      selected={profile.nameChangeKind === opt.id}
                      onSelect={() => patch({ nameChangeKind: opt.id })}
                      title={opt.title}
                      description={opt.description}
                    />
                  ))}
                </div>
              </fieldset>

              {profile.nameChangeKind === 'other' && (
                <Field label="Tell us how" className="mt-4">
                  <Input
                    value={profile.nameChangeKindOther}
                    onChange={(e) => patch({ nameChangeKindOther: e.target.value })}
                    placeholder="e.g. restoring a family name"
                  />
                </Field>
              )}

              <Callout tone="champagne" icon={<Info size={16} />} className="mt-6">
                A marriage certificate covers taking or hyphenating a spouse’s surname in most
                states. Inventing a brand-new last name sometimes requires a court order instead
                — check with your county clerk before you file anything.
              </Callout>
            </StepShell>
          )}

          {step.id === 'marriage' && (
            <StepShell
              title="About your marriage"
              intro="This is what the certificate has to match, and it decides where you order copies from."
            >
              <Field label="Spouse’s full name" error={err('spouseName')}>
                <Input
                  value={profile.marriage.spouseName}
                  onChange={(e) =>
                    patch({ marriage: { ...profile.marriage, spouseName: e.target.value } })
                  }
                />
              </Field>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Date of marriage" error={err('marriageDate')}>
                  <Input
                    type="date"
                    value={profile.marriage.date}
                    onChange={(e) =>
                      patch({ marriage: { ...profile.marriage, date: e.target.value } })
                    }
                  />
                </Field>
                <Field label="State where you married" error={err('marriageState')}>
                  <Select
                    value={profile.marriage.state}
                    onChange={(e) =>
                      patch({
                        marriage: { ...profile.marriage, state: e.target.value as StateCode },
                      })
                    }
                  >
                    <option value="">Choose…</option>
                    {US_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field
                label="County where your license was issued"
                hint="This is who you order certified copies from."
                className="mt-4"
                error={err('county')}
              >
                <Input
                  value={profile.marriage.county}
                  onChange={(e) =>
                    patch({ marriage: { ...profile.marriage, county: e.target.value } })
                  }
                  placeholder="e.g. Essex"
                />
              </Field>

              <Field
                label="How many certified copies do you have?"
                className="mt-4 max-w-40"
              >
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={profile.marriage.certifiedCopies}
                  onChange={(e) =>
                    patch({
                      marriage: {
                        ...profile.marriage,
                        certifiedCopies: Math.max(0, Number(e.target.value) || 0),
                      },
                    })
                  }
                />
              </Field>

              <Callout
                tone={profile.marriage.certifiedCopies >= 3 ? 'success' : 'champagne'}
                className="mt-5"
              >
                <p className="font-semibold">Why certified copies matter</p>
                <p className="mt-1">
                  A certified copy carries an official seal from the office that recorded your
                  marriage. Agencies will not accept a photocopy, a photo, or the decorative
                  certificate from your ceremony. Several of them keep a copy temporarily, which
                  is why we suggest ordering at least three at once — a second order later costs
                  the same fee plus another wait.
                </p>
              </Callout>
            </StepShell>
          )}

          {step.id === 'life' && (
            <StepShell
              title="What applies to you?"
              intro="Check everything true. This is how we keep your checklist short — you only see what you actually need."
            >
              <div className="grid gap-2.5 sm:grid-cols-2">
                {CIRCUMSTANCES.map((c) => (
                  <CheckCard
                    key={c.id}
                    checked={profile.circumstances.includes(c.id)}
                    onToggle={() => toggleCircumstance(c.id)}
                    title={c.label}
                    description={c.hint}
                  />
                ))}
              </div>

              <p className="mt-6 rounded-2xl bg-surface-sunk px-5 py-4 text-center text-sm text-charcoal-700">
                Your checklist so far:{' '}
                <strong className="font-display text-lg text-primary-600">{taskCount}</strong> tasks
              </p>
            </StepShell>
          )}

          {step.id === 'review' && (
            <StepShell
              title="Here’s what we have"
              intro="Check it over. You can change any of this later from your profile."
            >
              <Card className="divide-y divide-charcoal-100">
                <ReviewRow label="Current name" value={fullName(profile.currentName)} />
                <ReviewRow label="New legal name" value={fullName(profile.newName)} emphasis />
                <ReviewRow
                  label="Address"
                  value={[
                    profile.address.line1,
                    profile.address.line2,
                    `${profile.address.city}, ${profile.address.state} ${profile.address.zip}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                />
                <ReviewRow label="Phone" value={profile.phone} />
                <ReviewRow label="Email" value={profile.email} />
                <ReviewRow label="Spouse" value={profile.marriage.spouseName} />
                <ReviewRow
                  label="Married"
                  value={`${profile.marriage.date} · ${profile.marriage.county} County, ${profile.marriage.state}`}
                />
                <ReviewRow
                  label="Certified copies"
                  value={`${profile.marriage.certifiedCopies}`}
                />
              </Card>

              <div className="mt-6 rounded-card border border-primary-200 bg-primary-50 p-6 text-center">
                <p className="text-sm text-charcoal-700">Your personalized plan is ready</p>
                <p className="mt-1 font-display text-3xl text-charcoal-900">{taskCount} tasks</p>
                <p className="mt-1 text-sm text-charcoal-500">
                  sequenced in the order that actually works
                </p>
              </div>
            </StepShell>
          )}
        </div>
      </main>

      {/* Sticky action bar — always in thumb reach on mobile */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 border-t border-charcoal-100 bg-surface/95 backdrop-blur-md">
        <div className="container-page flex max-w-2xl items-center justify-between gap-3 py-3.5">
          <Button variant="ghost" onClick={back}>
            <ArrowLeft size={16} />
            {index === 0 ? 'Home' : 'Back'}
          </Button>
          <div className="flex items-center gap-3">
            {touched && !canAdvance && (
              <span className="hidden text-xs text-destructive-600 sm:block">
                A few fields still need you
              </span>
            )}
            <Button onClick={next} size="lg" className={cx(!canAdvance && 'opacity-60')}>
              {isLast ? (
                <>
                  <Check size={18} /> Build my plan
                </>
              ) : (
                <>
                  Continue <ArrowRight size={18} />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  function toggleCircumstance(id: CircumstanceId) {
    setProfile((p) => ({
      ...p,
      circumstances: p.circumstances.includes(id)
        ? p.circumstances.filter((c) => c !== id)
        : [...p.circumstances, id],
    }));
  }
}

function StepShell({
  welcome,
  title,
  intro,
  children,
}: {
  welcome?: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {welcome && (
        <p className="mb-4 rounded-2xl bg-champagne-100 px-4 py-3 text-sm leading-relaxed text-charcoal-900">
          {welcome}
        </p>
      )}
      <h1 className="text-balance text-3xl text-charcoal-900 sm:text-4xl">{title}</h1>
      <p className="mt-3 text-pretty leading-relaxed text-charcoal-700">{intro}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3">
      <span className="text-sm text-charcoal-500">{label}</span>
      <span
        className={cx(
          'text-right',
          emphasis ? 'font-display text-lg text-primary-700' : 'text-charcoal-900',
        )}
      >
        {value.trim() || '—'}
      </span>
    </div>
  );
}

function validate(step: StepId, p: Profile): Record<string, string> {
  const e: Record<string, string> = {};
  const required = (v: string, key: string, msg: string) => {
    if (!v.trim()) e[key] = msg;
  };

  if (step === 'you') {
    required(p.currentName.first, 'currentFirst', 'We need your first name');
    required(p.currentName.last, 'currentLast', 'We need your last name');
    required(p.dateOfBirth, 'dateOfBirth', 'Almost every form asks for this');
  }

  if (step === 'contact') {
    required(p.address.line1, 'line1', 'Street address is required');
    required(p.address.city, 'city', 'City is required');
    required(p.address.state, 'state', 'Choose your state');
    if (!/^\d{5}(-\d{4})?$/.test(p.address.zip.trim())) e.zip = 'Enter a 5-digit ZIP';
    if (p.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a 10-digit phone number';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.email.trim())) e.email = 'Enter a valid email';
  }

  if (step === 'new-name') {
    required(p.newName.first, 'newFirst', 'Enter your new first name');
    required(p.newName.last, 'newLast', 'Enter your new last name');
  }

  if (step === 'marriage') {
    required(p.marriage.spouseName, 'spouseName', 'Your spouse’s name is on the certificate');
    required(p.marriage.date, 'marriageDate', 'When did you get married?');
    required(p.marriage.state, 'marriageState', 'Choose the state');
    required(p.marriage.county, 'county', 'This is who issues your certified copies');
  }

  return e;
}
