import { Link } from 'react-router-dom';
import { Check, ChevronRight, Clock, Lock } from 'lucide-react';
import type { TaskView } from '@/types';
import { PRIORITY_LABEL, STATUS_LABEL, isSettled } from '@/lib/progress';
import { formatMinutes, relativeDay } from '@/lib/format';
import { Badge, cx } from './ui';

const PRIORITY_TONE = {
  'do-first': 'clay',
  'do-soon': 'amber',
  anytime: 'sage',
} as const;

export function StatusPill({ task }: { task: TaskView }) {
  const { status } = task.state;
  if (status === 'complete') {
    return (
      <Badge tone="sage">
        <Check size={12} strokeWidth={3} /> Complete
      </Badge>
    );
  }
  if (status === 'not-applicable') return <Badge>Not applicable</Badge>;
  if (status === 'in-progress') return <Badge tone="rose">In progress</Badge>;
  if (status === 'waiting') return <Badge tone="amber">Waiting</Badge>;
  return <Badge tone={PRIORITY_TONE[task.priority]}>{PRIORITY_LABEL[task.priority]}</Badge>;
}

export function TaskCard({ task, showPhase = false }: { task: TaskView; showPhase?: boolean }) {
  const settled = isSettled(task.state.status);
  const blocked = task.blockedBy.length > 0 && !settled;
  const instancesDone = task.state.instances.filter((i) => i.done).length;

  return (
    <Link
      to={`/app/task/${task.id}`}
      className={cx(
        'group flex items-start gap-3.5 rounded-2xl border p-4 transition-all duration-150',
        settled
          ? 'border-ink-100 bg-paper-sunk/40'
          : 'border-ink-100 bg-paper-raised shadow-soft hover:-translate-y-px hover:border-rose-200 hover:shadow-lift',
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          task.state.status === 'complete'
            ? 'border-sage-500 bg-sage-500 text-white'
            : task.state.status === 'not-applicable'
              ? 'border-ink-200 bg-ink-100 text-ink-400'
              : blocked
                ? 'border-ink-200 text-ink-400'
                : 'border-ink-200 group-hover:border-rose-400',
        )}
      >
        {task.state.status === 'complete' && <Check size={13} strokeWidth={3} />}
        {task.state.status === 'not-applicable' && <span className="text-[11px]">—</span>}
        {blocked && task.state.status === 'not-started' && <Lock size={11} />}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cx(
              'font-medium leading-snug',
              settled ? 'text-ink-500 line-through decoration-ink-200' : 'text-ink-900',
            )}
          >
            {task.title}
          </span>
          {showPhase && !settled && <StatusPill task={task} />}
        </span>

        {!settled && (
          <span className="mt-1 block text-sm leading-relaxed text-ink-500">{task.summary}</span>
        )}

        <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
          {!showPhase && !settled && <StatusPill task={task} />}
          {settled && <span>{STATUS_LABEL[task.state.status]}</span>}
          {!settled && (
            <span className="inline-flex items-center gap-1">
              <Clock size={12} /> {formatMinutes(task.estimatedMinutes)}
            </span>
          )}
          {task.state.instances.length > 0 && (
            <span>
              {instancesDone} of {task.state.instances.length} accounts
            </span>
          )}
          {task.state.remindAt && !settled && (
            <span className="text-rose-600">Reminder {relativeDay(task.state.remindAt)}</span>
          )}
        </span>

        {blocked && (
          <span className="mt-2 flex items-start gap-1.5 rounded-lg bg-paper-sunk px-2.5 py-1.5 text-xs text-ink-500">
            <Lock size={11} className="mt-0.5 shrink-0" />
            <span>
              Finish <strong className="font-medium text-ink-700">{task.blockedBy[0].title}</strong>
              {task.blockedBy.length > 1 && ` and ${task.blockedBy.length - 1} more`} first
            </span>
          </span>
        )}
      </span>

      <ChevronRight
        size={18}
        className="mt-1 shrink-0 text-ink-200 transition-colors group-hover:text-rose-400"
      />
    </Link>
  );
}
