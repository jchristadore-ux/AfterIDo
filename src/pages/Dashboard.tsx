import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CircleCheck,
  CircleCheckBig,
  Clock,
  FileText,
  PartyPopper,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import {
  dueReminders,
  groupByPhase,
  isSettled,
  nextBestAction,
  upNext,
} from '@/lib/progress';
import { formatMinutes, fullName, relativeDay } from '@/lib/format';
import { Badge, Card, LinkButton, ProgressRing, SectionHeading } from '@/components/ui';
import { TaskCard } from '@/components/TaskCard';
import { WeCanBadge } from '@/components/Disclaimer';
import { CompletionSummary } from '@/components/CompletionSummary';

export function Dashboard() {
  const { state, tasks, progress } = useApp();
  const location = useLocation();
  /** Set by the task screen's "Mark as Updated" — the milestone moment. */
  const justUpdated = (location.state as { justUpdated?: string } | null)?.justUpdated;
  const next = nextBestAction(tasks);
  const alsoReady = upNext(tasks, next?.id, 3);
  const phases = groupByPhase(tasks);
  const reminders = dueReminders(tasks);
  const recentlyDone = tasks
    .filter((t) => t.state.status === 'complete' && t.state.completedAt)
    .sort(
      (a, b) =>
        new Date(b.state.completedAt!).getTime() - new Date(a.state.completedAt!).getTime(),
    )
    .slice(0, 3);

  const firstName = state.profile.newName.first || 'there';
  const allDone = progress.remaining === 0 && progress.total > 0;

  return (
    <div className="space-y-10">
      {/* ------------------------------------------------------ Milestone */}
      {justUpdated && !allDone && (
        <div className="animate-rise flex items-start gap-3 rounded-card border border-sage-300/60 bg-sage-50 p-5">
          <CircleCheck size={22} className="mt-0.5 shrink-0 text-sage-600" />
          <div className="min-w-0">
            <p className="font-display text-lg text-charcoal-900">
              Another one done — you’re crushing this.
            </p>
            <p className="mt-0.5 text-sm text-charcoal-700">
              {justUpdated} is marked as updated.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------- Greeting */}
      <header>
        <h1 className="text-balance text-3xl text-charcoal-900 sm:text-4xl">
          {allDone ? (
            <>You did it, {firstName}. 🎉</>
          ) : (
            <>
              Congratulations, {firstName}! <span className="align-middle">🎉</span>
            </>
          )}
        </h1>
        <p className="mt-2 text-lg text-charcoal-700">
          {allDone ? (
            <>
              Every task on your list is settled. You are{' '}
              <strong className="font-medium text-charcoal-900">{fullName(state.profile.newName)}</strong>{' '}
              everywhere that matters.
            </>
          ) : (
            <>
              Your name-change journey is{' '}
              <strong className="font-medium text-charcoal-900">{progress.percent}% complete</strong>.
            </>
          )}
        </p>
      </header>

      {/* --------------------------------------------- Completion record */}
      {allDone && (
        <section>
          <SectionHeading
            eyebrow="Finished"
            title="Keep the record"
            className="mb-4"
          />
          <CompletionSummary />
        </section>
      )}

      {/* -------------------------------------------------------- Progress */}
      <Card className="overflow-hidden">
        <div className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:gap-8 sm:p-7">
          <ProgressRing percent={progress.percent}>
            <span className="font-display text-3xl leading-none text-charcoal-900">
              {progress.percent}%
            </span>
            <span className="mt-1 text-xs text-charcoal-400">complete</span>
          </ProgressRing>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="font-display text-2xl text-charcoal-900">
              {progress.settled} of {progress.total} tasks complete
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {progress.inProgress > 0 && (
                <Badge tone="primary">{progress.inProgress} in progress</Badge>
              )}
              {progress.waiting > 0 && <Badge tone="champagne">{progress.waiting} waiting</Badge>}
              <Badge>{progress.remaining} to go</Badge>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
              <LinkButton to="/app/checklist" variant="secondary" size="sm">
                Full checklist
              </LinkButton>
              <LinkButton to="/app/packet" variant="secondary" size="sm">
                <FileText size={15} />
                My packet
              </LinkButton>
            </div>
          </div>
        </div>
      </Card>

      {/* ------------------------------------------------- Next best action */}
      {next ? (
        <section>
          <SectionHeading eyebrow="Your next step" title={next.title} className="mb-4" />
          <Card className="overflow-hidden border-primary-200">
            <div className="bg-gradient-to-br from-primary-50 to-surface p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone="primary">
                  <Sparkles size={12} /> Do this next
                </Badge>
                <Badge>
                  <Clock size={12} /> {formatMinutes(next.estimatedMinutes)}
                </Badge>
                <WeCanBadge weCan={next.weCan} />
              </div>
              <p className="text-pretty leading-relaxed text-charcoal-700">{next.whyNow}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <LinkButton to={`/app/task/${next.id}`} size="lg">
                  Start this step
                  <ArrowRight size={17} />
                </LinkButton>
              </div>
            </div>
            {next.stateGuidance?.headline && (
              <p className="border-t border-primary-100 bg-surface-sunk px-6 py-3 text-sm text-charcoal-700">
                <strong className="font-medium text-charcoal-900">
                  {next.stateGuidance.agencyName}:
                </strong>{' '}
                {next.stateGuidance.headline}
              </p>
            )}
          </Card>
        </section>
      ) : (
        <Card className="p-8 text-center">
          <PartyPopper className="mx-auto mb-3 text-primary-600" size={30} />
          <h2 className="text-2xl">Nothing left to do</h2>
          <p className="mx-auto mt-2 max-w-sm text-charcoal-500">
            Every task on your list is complete or marked not applicable. Print your packet as a
            record of what you changed and when.
          </p>
          <LinkButton to="/app/packet" className="mt-6">
            <FileText size={16} /> Open my packet
          </LinkButton>
        </Card>
      )}

      {/* ------------------------------------------------------- Reminders */}
      {reminders.length > 0 && (
        <section>
          <SectionHeading eyebrow="Coming up" title="Your reminders" className="mb-4" />
          <Card className="divide-y divide-charcoal-100">
            {reminders.map((task) => (
              <Link
                key={task.id}
                to={`/app/task/${task.id}`}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-sunk"
              >
                <Bell size={16} className="shrink-0 text-primary-600" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-charcoal-900">{task.title}</span>
                  <span className="text-sm text-charcoal-500">
                    Reminder {relativeDay(task.state.remindAt!)}
                  </span>
                </span>
                <ArrowRight size={16} className="shrink-0 text-charcoal-400" />
              </Link>
            ))}
          </Card>
        </section>
      )}

      {/* ---------------------------------------------------- Also ready */}
      {alsoReady.length > 0 && (
        <section>
          <SectionHeading
            eyebrow="No waiting required"
            title="You could also do these now"
            className="mb-4"
          />
          <div className="space-y-2.5">
            {alsoReady.map((task) => (
              <TaskCard key={task.id} task={task} showPhase />
            ))}
          </div>
        </section>
      )}

      {/* ----------------------------------------------------- Phase map */}
      <section>
        <SectionHeading
          eyebrow="The order that works"
          title="Your five phases"
          className="mb-4"
          action={
            <Link
              to="/app/checklist"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              See all
            </Link>
          }
        />
        <ol className="space-y-2.5">
          {phases.map((phase) => {
            const settled = phase.tasks.filter((t) => isSettled(t.state.status)).length;
            return (
              <li
                key={phase.n}
                className={
                  phase.current
                    ? 'flex items-center gap-4 rounded-2xl border border-primary-200 bg-primary-50 p-4'
                    : 'flex items-center gap-4 rounded-2xl border border-charcoal-100 bg-surface p-4'
                }
              >
                <span
                  className={
                    phase.complete
                      ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-600 text-white'
                      : phase.current
                        ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 font-display text-white'
                        : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-sunk font-display text-charcoal-400'
                  }
                >
                  {phase.complete ? <CircleCheckBig size={17} /> : phase.n}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-charcoal-900">{phase.title}</span>
                  <span className="block text-sm text-charcoal-500">{phase.caption}</span>
                </span>
                <span className="shrink-0 text-sm text-charcoal-400">
                  {settled}/{phase.tasks.length}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ------------------------------------------------------ Recent */}
      {recentlyDone.length > 0 && (
        <section>
          <SectionHeading eyebrow="Behind you" title="Recently completed" className="mb-4" />
          <div className="space-y-2.5">
            {recentlyDone.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
