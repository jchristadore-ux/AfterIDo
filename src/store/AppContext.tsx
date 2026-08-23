import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type {
  AppState,
  Plan,
  Profile,
  StoredDocument,
  TaskInstance,
  TaskState,
  TaskStatus,
} from '@/types';
import { DEFAULT_TASK_STATE, buildTaskViews, summarize } from '@/lib/progress';
import { EMPTY_STATE, clearState, loadState, saveState } from '@/lib/storage';
import { DEMO_STATE } from '@/data/demo';
import { canUse, type FeatureId } from '@/lib/plan';

type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'set-profile'; profile: Profile }
  | { type: 'complete-onboarding'; profile: Profile }
  | { type: 'patch-task'; id: string; patch: Partial<TaskState> }
  | { type: 'set-status'; id: string; status: TaskStatus }
  | { type: 'add-instance'; id: string; label: string }
  | { type: 'toggle-instance'; id: string; instanceId: string }
  | { type: 'remove-instance'; id: string; instanceId: string }
  | { type: 'add-document'; document: StoredDocument }
  | { type: 'remove-document'; id: string }
  | { type: 'set-plan'; plan: Plan }
  | { type: 'enter-demo' }
  | { type: 'reset' };

function withTask(state: AppState, id: string, patch: Partial<TaskState>): AppState {
  const current = state.tasks[id] ?? DEFAULT_TASK_STATE;
  return { ...state, tasks: { ...state.tasks, [id]: { ...current, ...patch } } };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      return action.state;

    case 'set-profile':
      return { ...state, profile: action.profile };

    case 'complete-onboarding':
      return { ...state, profile: action.profile, onboarded: true };

    case 'patch-task':
      return withTask(state, action.id, action.patch);

    case 'set-status': {
      const patch: Partial<TaskState> = { status: action.status };
      patch.completedAt = action.status === 'complete' ? new Date().toISOString() : undefined;
      // Finishing a task retires its reminder — nothing worse than being
      // nagged about something you already did.
      if (action.status === 'complete' || action.status === 'not-applicable') {
        patch.remindAt = undefined;
      }
      return withTask(state, action.id, patch);
    }

    case 'add-instance': {
      const current = state.tasks[action.id] ?? DEFAULT_TASK_STATE;
      const instance: TaskInstance = {
        id: `inst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        label: action.label,
        done: false,
      };
      return withTask(state, action.id, {
        instances: [...current.instances, instance],
        // Adding the first account is itself a sign she has started.
        status: current.status === 'not-started' ? 'in-progress' : current.status,
      });
    }

    case 'toggle-instance': {
      const current = state.tasks[action.id] ?? DEFAULT_TASK_STATE;
      const instances = current.instances.map((i) =>
        i.id === action.instanceId ? { ...i, done: !i.done } : i,
      );
      return withTask(state, action.id, { instances });
    }

    case 'remove-instance': {
      const current = state.tasks[action.id] ?? DEFAULT_TASK_STATE;
      return withTask(state, action.id, {
        instances: current.instances.filter((i) => i.id !== action.instanceId),
      });
    }

    case 'add-document':
      return { ...state, documents: [action.document, ...state.documents] };

    case 'remove-document':
      return { ...state, documents: state.documents.filter((d) => d.id !== action.id) };

    case 'set-plan':
      return { ...state, plan: action.plan };

    case 'enter-demo':
      return { ...DEMO_STATE };

    case 'reset':
      return { ...EMPTY_STATE };
  }
}

interface AppContextValue {
  state: AppState;
  /** Catalog joined with progress — everything the UI renders comes from here. */
  tasks: ReturnType<typeof buildTaskViews>;
  progress: ReturnType<typeof summarize>;
  can: (feature: FeatureId) => boolean;
  setProfile: (profile: Profile) => void;
  completeOnboarding: (profile: Profile) => void;
  setStatus: (id: string, status: TaskStatus) => void;
  setNotes: (id: string, notes: string) => void;
  setReminder: (id: string, remindAt: string | undefined) => void;
  addInstance: (id: string, label: string) => void;
  toggleInstance: (id: string, instanceId: string) => void;
  removeInstance: (id: string, instanceId: string) => void;
  addDocument: (document: StoredDocument) => void;
  removeDocument: (id: string) => void;
  setPlan: (plan: Plan) => void;
  enterDemo: () => void;
  reset: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE, (initial) => {
    if (typeof window === 'undefined') return initial;
    return loadState() ?? initial;
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

  const tasks = useMemo(() => buildTaskViews(state), [state]);
  const progress = useMemo(() => summarize(tasks), [tasks]);

  const can = useCallback((feature: FeatureId) => canUse(state.plan, feature), [state.plan]);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      tasks,
      progress,
      can,
      setProfile: (profile) => dispatch({ type: 'set-profile', profile }),
      completeOnboarding: (profile) => dispatch({ type: 'complete-onboarding', profile }),
      setStatus: (id, status) => dispatch({ type: 'set-status', id, status }),
      setNotes: (id, notes) => dispatch({ type: 'patch-task', id, patch: { notes } }),
      setReminder: (id, remindAt) => dispatch({ type: 'patch-task', id, patch: { remindAt } }),
      addInstance: (id, label) => dispatch({ type: 'add-instance', id, label }),
      toggleInstance: (id, instanceId) => dispatch({ type: 'toggle-instance', id, instanceId }),
      removeInstance: (id, instanceId) => dispatch({ type: 'remove-instance', id, instanceId }),
      addDocument: (document) => dispatch({ type: 'add-document', document }),
      removeDocument: (id) => dispatch({ type: 'remove-document', id }),
      setPlan: (plan) => dispatch({ type: 'set-plan', plan }),
      enterDemo: () => dispatch({ type: 'enter-demo' }),
      reset: () => {
        clearState();
        dispatch({ type: 'reset' });
      },
    }),
    [state, tasks, progress, can],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
