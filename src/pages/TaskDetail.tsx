import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  BellOff,
  Building2,
  Check,
  Clock,
  Info,
  Lock,
  MapPin,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type { Profile, TaskStatus, TaskView } from '@/types';
import { useApp } from '@/store/AppContext';
import { PRIORITY_LABEL, isSettled } from '@/lib/progress';
import { formatMinutes, relativeDay } from '@/lib/format';
import { REMINDER_PRESETS, remindInDays } from '@/lib/notifications';
import { track } from '@/lib/analytics';
import { notificationLetter } from '@/lib/prefill';
import { getStateProfile } from '@/data/states';
import {
  Badge,
  Button,
  Callout,
  Card,
  CopyButton,
  ExternalButton,
  Fab,
  Field,
  Modal,
  SectionHeading,
  Textarea,
  cx,
} from '@/components/ui';
import { PrefillPanel } from '@/components/PrefillPanel';
import { PremiumGate } from '@/components/PremiumGate';
import { WeCanBadge } from '@/components/Disclaimer';

const STATUS_OPTIONS: { value: TaskStatus; label: string; tone: string }[] = [
  { value: 'not-started', label: 'Not started', tone: 'border-charcoal-200' },
  { value: 'in-progress', label: 'In progress', tone: 'border-primary-400 bg-primary-50 text-primary-700' },
  { value: 'waiting', label: 'Waiting', tone: 'border-champagne-500/40 bg-champagne-50 text-charcoal-700' },
  { value: 'complete', label: 'Completed', tone: 'border-sage-500 bg-sage-50 text-sage-700' },
  { value: 'not-applicable', label: 'Not applicable', tone: 'border-charcoal-200 bg-surface-sunk' },
];

export function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const { state, tasks, setStatus, setNotes, setReminder, addInstance, toggleInstance, removeInstance } =
    useApp();
  const navigate = useNavigate();

  const task = tasks.find((t) => t.id === taskId);

  if (!task) {
    return (
      <Card className="p-8 text-center">
        <p className="font-display text-xl">We couldn’t find that task</p>
        <p className="mt-2 text-sm text-charcoal-500">
          It may not apply to you, or the link may be out of date.
        </p>
        <Button className="mt-6" onClick={() => navigate('/app/checklist')}>
          Back to checklist
        </Button>
      </Card>
    );
  }

  const settled = isSettled(task.state.status);
  const blocked = task.blockedBy.length > 0 && !settled;
  const stateProfile = getStateProfile(state.profile.address.state);

  return (
    <div className="space-y-8">
      <Link
        to="/app/checklist"
        className="inline-flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-900"
      >
        <ArrowLeft size={15} /> Checklist
      </Link>

      {/* ---------------------------------------------------------- Header */}
      <header>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone={task.priority === 'do-first' ? 'destructive' : task.priority === 'do-soon' ? 'champagne' : 'success'}>
            {PRIORITY_LABEL[task.priority]}
          </Badge>
          <Badge>
            <Clock size={12} /> {formatMinutes(task.estimatedMinutes)}
          </Badge>
          <WeCanBadge weCan={task.weCan} />
        </div>
        <h1 className="text-balance text-3xl leading-tight text-charcoal-900 sm:text-4xl">
          {task.title}
        </h1>
        <p className="mt-3 text-pretty text-lg leading-relaxed text-charcoal-700">{task.summary}</p>
      </header>

      {/* --------------------------------------------------------- Blocked */}
      {blocked && (
        <Callout tone="champagne" icon={<Lock size={16} />} title="Do this one first">
          <p>
            This step depends on{' '}
            {task.blockedBy.map((dep, i) => (
              <span key={dep.id}>
                {i > 0 && ', '}
                <Link to={`/app/task/${dep.id}`} className="font-medium">
                  {dep.title}
                </Link>
              </span>
            ))}
            . You can still read through it and get your documents ready.
          </p>
        </Callout>
      )}

      {/* ---------------------------------------------------------- Status */}
      <Card className="p-5">
        <p className="mb-3 text-sm font-medium text-charcoal-700">Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const active = task.state.status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(task.id, opt.value)}
                aria-pressed={active}
                className={cx(
                  'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                  active ? opt.tone : 'border-charcoal-200 text-charcoal-500 hover:border-charcoal-400',
                  active && 'ring-1 ring-current/20',
                )}
              >
                {active && <Check size={13} className="mr-1 inline" />}
                {opt.label}
              </button>
            );
          })}
        </div>
        {task.state.status === 'complete' && task.state.completedAt && (
          <p className="mt-3 text-sm text-sage-700">
            Completed {new Date(task.state.completedAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}
      </Card>

      {/* -------------------------------------------------------- Why now */}
      <section>
        <SectionHeading eyebrow="Why now" title="Where this sits in the order" className="mb-3" />
        <Card className="p-5">
          <p className="leading-relaxed text-charcoal-700">{task.whyNow}</p>
        </Card>
      </section>

      {/* ------------------------------------------------ What you'll need */}
      {task.whatYouNeed.length > 0 && (
        <section>
          <SectionHeading title="What you’ll need" className="mb-3" />
          <Card className="p-5">
            <ul className="space-y-2.5">
              {task.whatYouNeed.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-charcoal-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {/* ------------------------------------------------- State guidance */}
      {task.stateGuidance && stateProfile && (
        <section>
          <SectionHeading
            eyebrow={`In ${stateProfile.name}`}
            title={task.stateGuidance.agencyName}
            className="mb-3"
          />
          <PremiumGate
            feature="state-guidance"
            title={`${stateProfile.name}-specific instructions`}
            description={`Exactly which documents ${stateProfile.name} asks for, whether you can do it online, and what to expect when you get there.`}
          >
            <Card
              className={cx(
                'overflow-hidden',
                stateProfile.coverage === 'detailed' ? 'border-primary-200' : '',
              )}
            >
              <div className="p-5">
                {task.stateGuidance.headline && (
                  <p className="flex items-start gap-2.5 text-charcoal-900">
                    <MapPin size={17} className="mt-0.5 shrink-0 text-primary-600" />
                    <span className="font-medium">{task.stateGuidance.headline}</span>
                  </p>
                )}

                {task.stateGuidance.inPersonRequired && (
                  <Badge tone="champagne" className="mt-3">
                    <Building2 size={12} /> In person
                  </Badge>
                )}

                {task.stateGuidance.bringWithYou && (
                  <div className="mt-5">
                    <p className="mb-2 text-sm font-medium text-charcoal-700">Bring with you</p>
                    <ul className="space-y-2">
                      {task.stateGuidance.bringWithYou.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-charcoal-700">
                          <Check size={14} className="mt-1 shrink-0 text-sage-600" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {task.stateGuidance.steps && (
                  <ol className="mt-5 space-y-3">
                    {task.stateGuidance.steps.map((s, i) => (
                      <li key={s} className="flex gap-3 text-sm leading-relaxed text-charcoal-700">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">
                          {i + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ol>
                )}

                {task.stateGuidance.timingNote && (
                  <Callout tone="neutral" className="mt-5">
                    {task.stateGuidance.timingNote}
                  </Callout>
                )}

                {task.stateGuidance.links && task.stateGuidance.links.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {task.stateGuidance.links.map((link) => (
                      <ExternalButton
                        key={link.url}
                        href={link.url}
                        variant="secondary"
                        size="sm"
                      >
                        {link.label}
                        <ArrowUpRight size={14} />
                      </ExternalButton>
                    ))}
                  </div>
                )}
              </div>

              <p className="border-t border-charcoal-100 bg-surface-sunk px-5 py-2.5 text-xs text-charcoal-500">
                {stateProfile.coverage === 'detailed'
                  ? `Checked against ${stateProfile.name} official sources on ${stateProfile.lastReviewed}. Requirements change — confirm on the agency page before you go.`
                  : `We haven’t verified ${stateProfile.name}-specific details yet. Everything above is a starting point, not a requirement list — the official page is authoritative.`}
              </p>
            </Card>
          </PremiumGate>
        </section>
      )}

      {/* --------------------------------------------------------- Steps */}
      <section>
        <SectionHeading title="What to do" className="mb-3" />
        <Card className="p-5">
          {task.steps.length > 0 ? (
            <ol className="space-y-4">
              {task.steps.map((s, i) => (
                <li key={s} className="flex gap-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-charcoal-900 text-xs font-semibold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 leading-relaxed text-charcoal-700">{s}</span>
                </li>
              ))}
            </ol>
          ) : (
            // A task the user added herself. We were not told how this
            // organization handles a name change, so we do not invent steps —
            // we give her the details to hand over and get out of the way.
            <p className="leading-relaxed text-charcoal-700">
              You added this one, so we don’t have their process. Contact them, say your legal name
              has changed after marriage, and have a certified copy of your marriage certificate
              ready. Your details are below, ready to paste — and the{' '}
              <Link to="/app/letters" className="underline underline-offset-2">
                general notification letter
              </Link>{' '}
              covers most organizations.
            </p>
          )}
        </Card>
      </section>

      {/* ------------------------------------------------------ Prefill */}
      <PrefillPanel keys={task.prefill} profile={state.profile} />

      {/* ------------------------------------------------- Official links */}
      {task.officialLinks.length > 0 && (
        <section>
          <SectionHeading
            eyebrow="Official sources only"
            title="Go to the official website"
            className="mb-3"
          />
          <div className="space-y-2.5">
            {task.officialLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-charcoal-100 bg-surface p-4 shadow-soft transition-all hover:-translate-y-px hover:border-primary-200 hover:shadow-lift"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-charcoal-900">{link.label}</span>
                  <span className="block truncate text-sm text-charcoal-500">{link.source}</span>
                </span>
                <ArrowUpRight size={18} className="shrink-0 text-primary-600" />
              </a>
            ))}
          </div>
          <p className="mt-3 text-xs text-charcoal-400">
            AfterIDo never submits anything to an agency on your behalf. These links take you
            straight to the agency’s own site.
          </p>
        </section>
      )}

      {task.sourceNote && (
        <Callout tone="neutral" icon={<Info size={16} />}>
          <span className="font-medium">Where this came from: </span>
          {task.sourceNote}
        </Callout>
      )}

      {/* ---------------------------------------------------- Instances */}
      {task.instanceLabel && (
        <InstanceList
          task={task}
          addInstance={addInstance}
          toggleInstance={toggleInstance}
          removeInstance={removeInstance}
        />
      )}

      {/* ------------------------------------------------------- Letter */}
      {task.weCan === 'prepare' && task.officialLinks.length === 0 && (
        <LetterSection profile={state.profile} />
      )}

      {/* -------------------------------------------------- What's next */}
      {task.whatHappensNext && (
        <Callout tone="primary" title="What happens next">
          {task.whatHappensNext}
        </Callout>
      )}

      {/* ------------------------------------------------------ Reminder */}
      <section>
        <SectionHeading title="Remind me" className="mb-3" />
        <PremiumGate
          feature="reminders"
          title="Reminders"
          description="Set a nudge for the steps that need a second visit, a wait, or a follow-up call."
        >
          <Card className="p-5">
            {task.state.remindAt ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-charcoal-900">
                  <Bell size={16} className="text-primary-600" />
                  Reminder set for{' '}
                  <strong className="font-medium">
                    {new Date(task.state.remindAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </strong>
                  <span className="text-charcoal-500">({relativeDay(task.state.remindAt)})</span>
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReminder(task.id, undefined)}
                >
                  <BellOff size={14} /> Clear
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {REMINDER_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="secondary"
                    size="sm"
                    onClick={() => setReminder(task.id, remindInDays(preset.days))}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-charcoal-400">
              Reminders appear on your dashboard. Email and push notifications aren’t enabled in
              this build.
            </p>
          </Card>
        </PremiumGate>
      </section>

      {/* --------------------------------------------------------- Notes */}
      <section>
        <SectionHeading title="Your notes" className="mb-3" />
        <Field label="" hint="Confirmation numbers, who you spoke to, what they said.">
          <Textarea
            value={task.state.notes}
            onChange={(e) => setNotes(task.id, e.target.value)}
            placeholder="e.g. Called Tuesday — Marisol said the new card ships in 7–10 days."
          />
        </Field>
      </section>

      {/* -------------------------------------------------- Bottom action */}
      <div className="sticky bottom-24 z-20 lg:bottom-6">
        {task.state.status !== 'complete' ? (
          <Button
            block
            size="lg"
            onClick={() => {
              setStatus(task.id, 'complete');
              track('task_completed', { category: task.category });
              // The dashboard reads this to show the milestone message once.
              navigate('/app', { state: { justUpdated: task.title } });
            }}
            className="shadow-lift"
          >
            <Check size={18} /> Mark as Updated
          </Button>
        ) : (
          <Button
            block
            size="lg"
            variant="secondary"
            onClick={() => setStatus(task.id, 'in-progress')}
            className="shadow-lift"
          >
            Reopen this task
          </Button>
        )}
      </div>
    </div>
  );
}

function InstanceList({
  task,
  addInstance,
  toggleInstance,
  removeInstance,
}: {
  task: TaskView;
  addInstance: (id: string, label: string) => void;
  toggleInstance: (id: string, instanceId: string) => void;
  removeInstance: (id: string, instanceId: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const done = task.state.instances.filter((i) => i.done).length;

  function focusAddField() {
    inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    inputRef.current?.focus();
  }

  return (
    <section>
      <SectionHeading
        eyebrow="One at a time"
        title={`Your ${task.instanceLabel?.toLowerCase()}s`}
        className="mb-3"
        action={
          task.state.instances.length > 0 ? (
            <Badge tone={done === task.state.instances.length ? 'success' : 'neutral'}>
              {done}/{task.state.instances.length}
            </Badge>
          ) : undefined
        }
      />
      <Card className="p-5">
        {task.state.instances.length === 0 ? (
          <p className="text-sm text-charcoal-500">
            Add the places that still know you by your old name. We’ll help you check them off.
          </p>
        ) : (
          <ul className="mb-4 space-y-1.5">
            {task.state.instances.map((instance) => (
              <li key={instance.id} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
                <button
                  type="button"
                  onClick={() => toggleInstance(task.id, instance.id)}
                  aria-pressed={instance.done}
                  className={cx(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                    instance.done
                      ? 'border-sage-500 bg-sage-500 text-white'
                      : 'border-charcoal-200 hover:border-primary-400',
                  )}
                >
                  {instance.done && <Check size={12} strokeWidth={3} />}
                </button>
                <span
                  className={cx(
                    'min-w-0 flex-1 text-[0.95rem]',
                    instance.done ? 'text-charcoal-400 line-through' : 'text-charcoal-900',
                  )}
                >
                  {instance.label}
                </span>
                <button
                  type="button"
                  onClick={() => removeInstance(task.id, instance.id)}
                  aria-label={`Remove ${instance.label}`}
                  className="shrink-0 rounded-lg p-1.5 text-charcoal-400 hover:bg-surface-sunk hover:text-destructive-600"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const label = draft.trim();
            if (!label) return;
            addInstance(task.id, label);
            setDraft('');
          }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Add a ${task.instanceLabel?.toLowerCase()}…`}
            className="min-w-0 flex-1 rounded-xl border border-charcoal-200 bg-surface px-3.5 py-2.5 text-charcoal-900 placeholder:text-charcoal-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
          <Button type="submit" variant="secondary" disabled={!draft.trim()}>
            <Plus size={15} /> Add Another Place
          </Button>
        </form>
      </Card>

      {/*
        The FAB rides above the mobile tab bar and jumps to the add field —
        on a long task screen the form is often well off-screen.
      */}
      <Fab
        label="Jump to add another place"
        onClick={focusAddField}
        className="fixed right-5 bottom-28 z-30 lg:hidden"
      />
    </section>
  );
}

function LetterSection({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const letter = notificationLetter(profile, recipient);

  return (
    <section>
      <SectionHeading
        eyebrow="Document generation"
        title="A letter you can send"
        className="mb-3"
      />
      <PremiumGate
        feature="letters"
        title="Ready-to-send notification letters"
        description="A written notice with your details already filled in, for the banks, landlords and providers that want it in writing."
      >
        <Card className="p-5">
          <p className="text-sm leading-relaxed text-charcoal-700">
            Some organizations want written notice. This letter is filled in from your profile
            — add the recipient and your account number, then print or paste it into an email.
          </p>
          <Button className="mt-4" variant="secondary" onClick={() => setOpen(true)}>
            Generate letter
          </Button>
          <p className="mt-3 text-xs text-charcoal-400">
            This is a plain courtesy letter, not a government form. AfterIDo never generates or
            imitates official agency forms.
          </p>
        </Card>

        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Name change notification letter"
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                <X size={15} /> Close
              </Button>
              <CopyButton value={letter} label="Copy letter" variant="primary" size="md" />
            </>
          }
        >
          <Field label="Who is this going to?" className="mb-4">
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="e.g. Montclair Credit Union"
              className="w-full rounded-xl border border-charcoal-200 bg-surface px-3.5 py-3 text-charcoal-900 placeholder:text-charcoal-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </Field>
          <pre className="whitespace-pre-wrap rounded-xl bg-surface-sunk p-4 font-sans text-sm leading-relaxed text-charcoal-900">
            {letter}
          </pre>
        </Modal>
      </PremiumGate>
    </section>
  );
}
