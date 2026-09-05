import type { AppState, Profile } from '@/types';

/**
 * Persistence.
 *
 * ── Where this build stores data ──────────────────────────────────────────
 * Everything lives in this browser, in localStorage, under one key. There is
 * no server in this MVP, so nothing she types is transmitted anywhere. That is
 * a deliberate privacy posture for a demo, not a production design.
 *
 * ── What production needs instead ─────────────────────────────────────────
 * A real deployment replaces `loadState`/`saveState` with an authenticated API
 * client and keeps this profile server-side, encrypted at rest, scoped to her
 * account. The shape of the state does not change — only the transport. See
 * `PersistenceAdapter` below for the seam.
 *
 * ── What we never store, anywhere ─────────────────────────────────────────
 * Social Security numbers, driver's license numbers, account numbers and
 * passwords are intentionally absent from the data model. Tasks that need them
 * tell her to have them on hand; the app never asks her to type them in.
 */

const STORAGE_KEY = 'afterido.state.v1';
/**
 * 1 → 2 removed the `plan` field. It used to be settable from the browser,
 * which meant Premium was settable from the browser. Entitlement now comes
 * from the server and `migrate` drops any copy left behind on the device.
 */
const STATE_VERSION = 2;

export const EMPTY_PROFILE: Profile = {
  currentName: { first: '', middle: '', last: '' },
  newName: { first: '', middle: '', last: '' },
  nameChangeKind: 'spouse-last-name',
  nameChangeKindOther: '',
  dateOfBirth: '',
  address: { line1: '', line2: '', city: '', state: '', zip: '' },
  phone: '',
  email: '',
  marriage: { spouseName: '', date: '', state: '', county: '', certifiedCopies: 0 },
  circumstances: [],
};

export const EMPTY_STATE: AppState = {
  version: STATE_VERSION,
  onboarded: false,
  demoMode: false,
  profile: EMPTY_PROFILE,
  tasks: {},
  documents: [],
  customTasks: [],
};

export interface PersistenceAdapter {
  load(): AppState | null;
  save(state: AppState): void;
  clear(): void;
}

/** The adapter used in this build. Swap for an API client in production. */
export const localAdapter: PersistenceAdapter = {
  load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.version !== STATE_VERSION) return migrate(parsed);
      return reconcile(parsed);
    } catch {
      // Corrupt or unavailable storage should never wedge the app.
      return null;
    }
  },
  save(state) {
    try {
      // Uploaded file bytes never persist — only their metadata. See
      // documentStorage.ts for why.
      const safe: AppState = {
        ...state,
        documents: state.documents.map((d) => ({ ...d, availableInSession: false })),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    } catch {
      // Private browsing / quota exceeded. The session still works in memory.
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to do */
    }
  },
};

/**
 * Accepts a plan from outside this browser — a file she exported earlier, or
 * one from her old phone.
 *
 * Anything unrecognised is dropped rather than trusted: the same `reconcile`
 * the loader uses fills in what is missing, `demoMode` is forced off so an
 * imported file can never masquerade as a Premium entitlement, and uploaded
 * file bytes are never part of a plan file in the first place, so every
 * document comes back as metadata with its contents marked absent.
 */
export function planFromJson(text: string): AppState | null {
  try {
    const parsed = JSON.parse(text) as Partial<AppState> & { plan?: unknown };
    if (typeof parsed !== 'object' || parsed === null) return null;
    if (!parsed.profile && !parsed.tasks) return null;

    const { plan: _droppedPlan, ...carried } = parsed;
    const state = reconcile({ ...EMPTY_STATE, ...carried, version: STATE_VERSION } as AppState);

    return {
      ...state,
      demoMode: false,
      documents: state.documents.map((d) => ({ ...d, availableInSession: false })),
    };
  } catch {
    return null;
  }
}

/** The plan as a file she can keep. Pretty-printed so it is readable. */
export function planToJson(state: AppState): string {
  return JSON.stringify(
    { ...state, documents: state.documents.map((d) => ({ ...d, availableInSession: false })) },
    null,
    2,
  );
}

/**
 * Fills in fields added by newer builds so an older saved state still loads.
 * Real migrations would branch on `version`; this keeps the demo forgiving.
 */
function migrate(old: Partial<AppState>): AppState {
  // Drop fields newer builds no longer recognise rather than carrying them
  // forward — `plan` in particular must not survive, see STATE_VERSION.
  const { plan: _droppedPlan, ...carried } = old as Partial<AppState> & { plan?: unknown };
  return reconcile({ ...EMPTY_STATE, ...carried, version: STATE_VERSION });
}

function reconcile(state: AppState): AppState {
  return {
    ...EMPTY_STATE,
    ...state,
    profile: {
      ...EMPTY_PROFILE,
      ...state.profile,
      currentName: { ...EMPTY_PROFILE.currentName, ...state.profile?.currentName },
      newName: { ...EMPTY_PROFILE.newName, ...state.profile?.newName },
      address: { ...EMPTY_PROFILE.address, ...state.profile?.address },
      marriage: { ...EMPTY_PROFILE.marriage, ...state.profile?.marriage },
      circumstances: state.profile?.circumstances ?? [],
    },
    tasks: state.tasks ?? {},
    documents: state.documents ?? [],
    customTasks: state.customTasks ?? [],
  };
}

export function loadState(): AppState | null {
  return localAdapter.load();
}

export function saveState(state: AppState): void {
  localAdapter.save(state);
}

export function clearState(): void {
  localAdapter.clear();
}
