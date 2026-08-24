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
  CategoryId,
  CustomTask,
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
import { useAccount } from './AccountContext';

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
  | { type: 'add-custom-task'; title: string; category: CategoryId }
  | { type: 'remove-custom-task'; id: string }
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

    // Editing the profile means these are real details now, not the sample
    // ones — so the demo ends here. Without this, someone could enter the
    // demo (which previews the Premium features) and simply type over Sarah's
    // information to get them for free.
    case 'set-profile':
      return { ...state, profile: action.profile, demoMode: false };

    case 'complete-onboarding':
      return { ...state, profile: action.profile, onboarded: true, demoMode: false };

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

    case 'add-custom-task': {
      const custom: CustomTask = {
        id: `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        title: action.title,
        category: action.category,
      };
      return { ...state, customTasks: [...state.customTasks, custom] };
    }

    case 'remove-custom-task': {
      const { [action.id]: _removed, ...tasks } = state.tasks;
      return {
        ...state,
        customTasks: state.customTasks.filter((t) => t.id !== action.id),
        tasks,
      };
    }

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
  /**
   * The plan actually in force. Comes from the server for a real account; the
   * demo previews Premium because it is explicitly labelled sample data and
   * ends the moment anything real is typed into it.
   */
  plan: Plan;
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
  addCustomTask: (title: string, category: CategoryId) => void;
  removeCustomTask: (id: string) => void;
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

  // The entitlement comes from the account, which comes from the server.
  // `state.plan` in localStorage is not consulted — a value the browser owns
  // is a value the browser can change.
  const { plan: accountPlan } = useAccount();
  const plan: Plan = state.demoMode ? 'premium' : accountPlan;

  const can = useCallback((feature: FeatureId) => canUse(plan, feature), [plan]);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      tasks,
      progress,
      plan,
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
      addCustomTask: (title, category) => dispatch({ type: 'add-custom-task', title, category }),
      removeCustomTask: (id) => dispatch({ type: 'remove-custom-task', id }),
      enterDemo: () => dispatch({ type: 'enter-demo' }),
      reset: () => {
        clearState();
        dispatch({ type: 'reset' });
      },
    }),
    [state, tasks, progress, plan, can],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
