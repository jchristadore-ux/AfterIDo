import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
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

export function Dashboard() {
  const { state, tasks, progress } = useApp();
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
      {/* ------------------------------------------------------- Greeting */}
      <header>
        <h1 className="text-balance text-3xl text-ink-900 sm:text-4xl">
          {allDone ? (
            <>You did it, {firstName}. 🎉</>
          ) : (
            <>
              Congratulations, {firstName}! <span className="align-middle">🎉</span>
            </>
          )}
        </h1>
        <p className="mt-2 text-lg text-ink-600">
          {allDone ? (
            <>
              Every task on your list is settled. You are{' '}
              <strong className="font-medium text-ink-900">{fullName(state.profile.newName)}</strong>{' '}
              everywhere that matters.
            </>
          ) : (
            <>
              Your name-change journey is{' '}
              <strong className="font-medium text-ink-900">{progress.percent}% complete</strong>.
            </>
          )}
        </p>
      </header>

      {/* -------------------------------------------------------- Progress */}
      <Card className="overflow-hidden">
        <div className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:gap-8 sm:p-7">
          <ProgressRing percent={progress.percent}>
            <span className="font-display text-3xl leading-none text-ink-900">
              {progress.percent}%
            </span>
            <span className="mt-1 text-xs text-ink-400">complete</span>
          </ProgressRing>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="font-display text-2xl text-ink-900">
              {progress.settled} of {progress.total} tasks complete
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {progress.inProgress > 0 && (
                <Badge tone="rose">{progress.inProgress} in progress</Badge>
              )}
              {progress.waiting > 0 && <Badge tone="amber">{progress.waiting} waiting</Badge>}
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
          <Card className="overflow-hidden border-rose-200">
            <div className="bg-gradient-to-br from-rose-50 to-paper-raised p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone="rose">
                  <Sparkles size={12} /> Do this next
                </Badge>
                <Badge>
                  <Clock size={12} /> {formatMinutes(next.estimatedMinutes)}
                </Badge>
                <WeCanBadge weCan={next.weCan} />
              </div>
              <p className="text-pretty leading-relaxed text-ink-700">{next.whyNow}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <LinkButton to={`/app/task/${next.id}`} size="lg">
                  Start this step
                  <ArrowRight size={17} />
                </LinkButton>
              </div>
            </div>
            {next.stateGuidance?.headline && (
              <p className="border-t border-rose-100 bg-paper-sunk px-6 py-3 text-sm text-ink-600">
                <strong className="font-medium text-ink-900">
                  {next.stateGuidance.agencyName}:
                </strong>{' '}
                {next.stateGuidance.headline}
              </p>
            )}
          </Card>
        </section>
      ) : (
        <Card className="p-8 text-center">
          <PartyPopper className="mx-auto mb-3 text-rose-600" size={30} />
          <h2 className="text-2xl">Nothing left to do</h2>
          <p className="mx-auto mt-2 max-w-sm text-ink-500">
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
          <Card className="divide-y divide-ink-100">
            {reminders.map((task) => (
              <Link
                key={task.id}
                to={`/app/task/${task.id}`}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-paper-sunk"
              >
                <Bell size={16} className="shrink-0 text-rose-600" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink-900">{task.title}</span>
                  <span className="text-sm text-ink-500">
                    Reminder {relativeDay(task.state.remindAt!)}
                  </span>
                </span>
                <ArrowRight size={16} className="shrink-0 text-ink-300" />
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
              className="text-sm font-medium text-rose-600 hover:text-rose-700"
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
                    ? 'flex items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4'
                    : 'flex items-center gap-4 rounded-2xl border border-ink-100 bg-paper-raised p-4'
                }
              >
                <span
                  className={
                    phase.complete
                      ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-500 text-white'
                      : phase.current
                        ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-600 font-display text-white'
                        : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-sunk font-display text-ink-400'
                  }
                >
                  {phase.complete ? <CircleCheckBig size={17} /> : phase.n}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-ink-900">{phase.title}</span>
                  <span className="block text-sm text-ink-500">{phase.caption}</span>
                </span>
                <span className="shrink-0 text-sm text-ink-400">
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
