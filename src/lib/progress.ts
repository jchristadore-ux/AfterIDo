import type {
  AppState,
  CategoryId,
  Priority,
  Profile,
  TaskDefinition,
  TaskState,
  TaskStatus,
  TaskView,
} from '@/types';
import { PHASES, phaseForStep, tasksForProfile } from '@/data/tasks';
import { getStateTaskGuidance } from '@/data/states';

export const DEFAULT_TASK_STATE: TaskState = {
  status: 'not-started',
  notes: '',
  instances: [],
};

export function taskStateFor(state: AppState, id: string): TaskState {
  return state.tasks[id] ?? DEFAULT_TASK_STATE;
}

/** A task is "settled" when it needs no further work from her. */
export function isSettled(status: TaskStatus): boolean {
  return status === 'complete' || status === 'not-applicable';
}

/**
 * Joins the static catalog with her progress and her state's guidance.
 * This is the single place the rest of the app gets tasks from.
 */
export function buildTaskViews(state: AppState): TaskView[] {
  const profile: Profile = state.profile;
  const defs = tasksForProfile(profile);
  const byId = new Map(defs.map((d) => [d.id, d]));

  return defs.map((def) => {
    const taskState = taskStateFor(state, def.id);
    const blockedBy = def.dependsOn
      .map((id) => byId.get(id))
      .filter((d): d is TaskDefinition => !!d)
      .filter((d) => !isSettled(taskStateFor(state, d.id).status));

    return {
      ...def,
      state: taskState,
      blockedBy,
      stateGuidance: getStateTaskGuidance(profile.address.state, def.id),
    };
  });
}

export interface ProgressSummary {
  total: number;
  complete: number;
  /** Complete + not-applicable — what actually drives the percentage. */
  settled: number;
  inProgress: number;
  waiting: number;
  percent: number;
  remaining: number;
}

export function summarize(views: TaskView[]): ProgressSummary {
  const total = views.length;
  const complete = views.filter((v) => v.state.status === 'complete').length;
  const settled = views.filter((v) => isSettled(v.state.status)).length;
  const inProgress = views.filter((v) => v.state.status === 'in-progress').length;
  const waiting = views.filter((v) => v.state.status === 'waiting').length;
  return {
    total,
    complete,
    settled,
    inProgress,
    waiting,
    percent: total === 0 ? 0 : Math.round((settled / total) * 100),
    remaining: total - settled,
  };
}

const PRIORITY_RANK: Record<Priority, number> = {
  'do-first': 0,
  'do-soon': 1,
  anytime: 2,
};

/**
 * "Your next step is…" — the most prominent thing on the dashboard.
 *
 * Anything already started wins, because finishing a half-done task beats
 * starting a new one. Then unblocked tasks by priority, then by phase order.
 */
export function nextBestAction(views: TaskView[]): TaskView | undefined {
  const actionable = views.filter(
    (v) => !isSettled(v.state.status) && v.blockedBy.length === 0,
  );
  if (actionable.length === 0) return undefined;

  return [...actionable].sort((a, b) => {
    const started = (v: TaskView) => (v.state.status === 'in-progress' ? 0 : 1);
    if (started(a) !== started(b)) return started(a) - started(b);
    if (PRIORITY_RANK[a.priority] !== PRIORITY_RANK[b.priority]) {
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    }
    return a.step - b.step;
  })[0];
}

/**
 * Tasks she can do right now, after the next best action. 'waiting' is excluded
 * on purpose — the ball is in someone else's court, so suggesting it as work
 * would be noise.
 */
export function upNext(views: TaskView[], excludeId?: string, limit = 3): TaskView[] {
  return views
    .filter(
      (v) =>
        v.id !== excludeId &&
        !isSettled(v.state.status) &&
        v.state.status !== 'waiting' &&
        v.blockedBy.length === 0,
    )
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.step - b.step)
    .slice(0, limit);
}

export interface PhaseGroup {
  n: number;
  title: string;
  caption: string;
  tasks: TaskView[];
  complete: boolean;
  /** True for the earliest phase that still has open work. */
  current: boolean;
}

export function groupByPhase(views: TaskView[]): PhaseGroup[] {
  const groups = PHASES.map((phase) => {
    const tasks = views
      .filter((v) => phaseForStep(v.step) === phase.n)
      .sort((a, b) => a.step - b.step);
    return {
      n: phase.n,
      title: phase.title,
      caption: phase.caption,
      tasks,
      complete: tasks.length > 0 && tasks.every((t) => isSettled(t.state.status)),
      current: false,
    };
  }).filter((g) => g.tasks.length > 0);

  const firstOpen = groups.find((g) => !g.complete);
  if (firstOpen) firstOpen.current = true;
  return groups;
}

export interface CategoryGroup {
  id: CategoryId;
  tasks: TaskView[];
  settled: number;
}

export function groupByCategory(views: TaskView[], order: CategoryId[]): CategoryGroup[] {
  return order
    .map((id) => {
      const tasks = views.filter((v) => v.category === id).sort((a, b) => a.step - b.step);
      return { id, tasks, settled: tasks.filter((t) => isSettled(t.state.status)).length };
    })
    .filter((g) => g.tasks.length > 0);
}

/** Reminders that are due or overdue, soonest first. */
export function dueReminders(views: TaskView[]): TaskView[] {
  const now = Date.now();
  return views
    .filter((v) => v.state.remindAt && !isSettled(v.state.status))
    .filter((v) => new Date(v.state.remindAt!).getTime() <= now + 7 * 86_400_000)
    .sort(
      (a, b) => new Date(a.state.remindAt!).getTime() - new Date(b.state.remindAt!).getTime(),
    );
}

export function allReminders(views: TaskView[]): TaskView[] {
  return views
    .filter((v) => v.state.remindAt)
    .sort(
      (a, b) => new Date(a.state.remindAt!).getTime() - new Date(b.state.remindAt!).getTime(),
    );
}

export const STATUS_LABEL: Record<TaskStatus, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  waiting: 'Waiting to hear back',
  complete: 'Completed',
  'not-applicable': 'Not applicable',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  'do-first': 'Do first',
  'do-soon': 'Do soon',
  anytime: 'Anytime',
};

export const PRIORITY_DOT: Record<Priority, string> = {
  'do-first': '🔴',
  'do-soon': '🟡',
  anytime: '🟢',
};
