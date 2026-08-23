/**
 * Core domain types for AfterIDo.
 *
 * Everything the app renders is derived from three inputs:
 *   1. the user's Profile (entered once, in onboarding)
 *   2. the TaskDefinition catalog (static, in src/data/tasks.ts)
 *   3. state-specific overrides (static, in src/data/states.ts)
 *
 * Nothing in the catalog is user-specific, and nothing in the profile is
 * task-specific. That split is what lets us add states and tasks without
 * touching the UI.
 */

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export type NameChangeKind =
  | 'spouse-last-name'
  | 'hyphenated'
  | 'combined'
  | 'middle-name-change'
  | 'other';

export interface PersonName {
  first: string;
  middle: string;
  last: string;
}

export interface Address {
  line1: string;
  line2: string;
  city: string;
  state: StateCode | '';
  zip: string;
}

export interface MarriageInfo {
  spouseName: string;
  date: string; // ISO yyyy-mm-dd
  state: StateCode | '';
  county: string;
  certifiedCopies: number;
}

export interface Profile {
  currentName: PersonName;
  newName: PersonName;
  nameChangeKind: NameChangeKind;
  nameChangeKindOther: string;
  dateOfBirth: string; // ISO yyyy-mm-dd
  address: Address;
  phone: string;
  email: string;
  marriage: MarriageInfo;
  /** Drives which optional tasks appear (mortgage, kids, professional license…). */
  circumstances: CircumstanceId[];
}

export type CircumstanceId =
  | 'employed'
  | 'has-passport'
  | 'owns-home'
  | 'has-mortgage'
  | 'has-auto-loan'
  | 'has-student-loans'
  | 'has-professional-license'
  | 'has-investments'
  | 'has-tsa-precheck'
  | 'is-student'
  | 'has-children'
  | 'has-pets'
  | 'is-veteran';

export interface Circumstance {
  id: CircumstanceId;
  label: string;
  hint?: string;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export type CategoryId =
  | 'foundation'
  | 'government'
  | 'financial'
  | 'employment'
  | 'insurance'
  | 'personal'
  | 'travel-digital';

export interface Category {
  id: CategoryId;
  label: string;
  blurb: string;
  /** Tailwind-ish token names resolved in the UI, not raw classes. */
  tone: 'primary' | 'success' | 'champagne' | 'charcoal';
}

export type Priority = 'do-first' | 'do-soon' | 'anytime';

export type TaskStatus =
  | 'not-started'
  | 'in-progress'
  | 'waiting'
  | 'complete'
  | 'not-applicable';

/**
 * A field of the user's profile that a given organization will ask for.
 * The point of AfterIDo: she types these once, we hand them back everywhere.
 */
export type PrefillFieldKey =
  | 'currentFullName'
  | 'newFullName'
  | 'currentFirst'
  | 'currentMiddle'
  | 'currentLast'
  | 'newFirst'
  | 'newMiddle'
  | 'newLast'
  | 'dateOfBirth'
  | 'addressBlock'
  | 'addressLine1'
  | 'city'
  | 'state'
  | 'zip'
  | 'phone'
  | 'email'
  | 'marriageDate'
  | 'marriagePlace'
  | 'spouseName';

export interface OfficialLink {
  label: string;
  url: string;
  /** Shown as a small caption so the user knows who they're being sent to. */
  source: string;
}

export interface TaskDefinition {
  id: string;
  title: string;
  /** One plain-English line. No jargon. Shown on the checklist card. */
  summary: string;
  category: CategoryId;
  priority: Priority;
  /** Position within the recommended order of operations (1 = do first). */
  step: number;
  /** Why this task sits where it does in the order. Always shown. */
  whyNow: string;
  estimatedMinutes: [number, number];
  /** Task ids that should be complete before this one is attempted. */
  dependsOn: string[];
  whatYouNeed: string[];
  steps: string[];
  whatHappensNext?: string;
  officialLinks: OfficialLink[];
  /** Profile fields this organization will ask for, in the order they ask. */
  prefill: PrefillFieldKey[];
  /**
   * 'prepare'  — AfterIDo can assemble the information or a letter for her.
   * 'submit'   — she must submit it herself; we can only guide and organize.
   * Deliberately explicit so the UI never overstates what we do.
   */
  weCan: 'prepare' | 'submit';
  /** Only include this task if the predicate passes. */
  appliesIf?: (profile: Profile) => boolean;
  /** Rendered as an editable list of accounts (e.g. "which banks?"). */
  instanceLabel?: string;
  /** Free/premium gating hook — see src/lib/plan.ts. */
  premium?: boolean;
  /** Shown verbatim; keeps us honest about where the facts came from. */
  sourceNote?: string;
}

export interface TaskState {
  status: TaskStatus;
  notes: string;
  /** ISO datetime for a user-set reminder, if any. */
  remindAt?: string;
  completedAt?: string;
  /** Named accounts the user added under this task (e.g. "Chase checking"). */
  instances: TaskInstance[];
}

export interface TaskInstance {
  id: string;
  label: string;
  done: boolean;
}

/** A definition joined with the user's progress on it — what the UI consumes. */
export interface TaskView extends TaskDefinition {
  state: TaskState;
  /** Dependencies that are not yet complete. Empty means it's actionable. */
  blockedBy: TaskDefinition[];
  /** State-specific guidance merged in, if we have any for her state. */
  stateGuidance?: StateTaskGuidance;
}

// ---------------------------------------------------------------------------
// State-specific requirements
// ---------------------------------------------------------------------------

export type StateCode =
  | 'AL' | 'AK' | 'AZ' | 'AR' | 'CA' | 'CO' | 'CT' | 'DE' | 'DC' | 'FL'
  | 'GA' | 'HI' | 'ID' | 'IL' | 'IN' | 'IA' | 'KS' | 'KY' | 'LA' | 'ME'
  | 'MD' | 'MA' | 'MI' | 'MN' | 'MS' | 'MO' | 'MT' | 'NE' | 'NV' | 'NH'
  | 'NJ' | 'NM' | 'NY' | 'NC' | 'ND' | 'OH' | 'OK' | 'OR' | 'PA' | 'RI'
  | 'SC' | 'SD' | 'TN' | 'TX' | 'UT' | 'VT' | 'VA' | 'WA' | 'WV' | 'WI' | 'WY';

/** Guidance that replaces or augments a task's generic copy for one state. */
export interface StateTaskGuidance {
  agencyName: string;
  headline?: string;
  inPersonRequired?: boolean;
  bringWithYou?: string[];
  steps?: string[];
  links?: OfficialLink[];
  timingNote?: string;
}

export interface StateProfile {
  code: StateCode;
  name: string;
  /** Coverage level drives the honesty banner shown to the user. */
  coverage: 'detailed' | 'basic';
  /** ISO date the guidance below was last reviewed against official sources. */
  lastReviewed: string;
  /** Keyed by TaskDefinition.id. */
  tasks: Partial<Record<string, StateTaskGuidance>>;
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export interface DocumentKind {
  id: string;
  label: string;
  /** Which task ids reference this document in "What you'll need". */
  usedFor: string[];
  guidance: string;
}

export interface StoredDocument {
  id: string;
  kindId: string;
  /** File name only. We never persist file bytes to disk in this build. */
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  /**
   * True while the file's bytes are still held in this browser tab's memory.
   * They are intentionally dropped on reload — see src/lib/documentStorage.ts.
   */
  availableInSession: boolean;
}

// ---------------------------------------------------------------------------
// App state
// ---------------------------------------------------------------------------

export type Plan = 'free' | 'premium';

export interface AppState {
  version: number;
  onboarded: boolean;
  demoMode: boolean;
  plan: Plan;
  profile: Profile;
  tasks: Record<string, TaskState>;
  documents: StoredDocument[];
  /** Tasks the user explicitly added that aren't in the catalog. */
  customTasks: CustomTask[];
}

export interface CustomTask {
  id: string;
  title: string;
  category: CategoryId;
}
