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

const STORAGE_KEY = 'nameday.state.v1';
const STATE_VERSION = 1;

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
  plan: 'free',
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
 * Fills in fields added by newer builds so an older saved state still loads.
 * Real migrations would branch on `version`; this keeps the demo forgiving.
 */
function migrate(old: Partial<AppState>): AppState {
  return reconcile({ ...EMPTY_STATE, ...old, version: STATE_VERSION });
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
