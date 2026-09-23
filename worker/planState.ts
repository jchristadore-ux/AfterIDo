/**
 * Server-side validation for checklist/profile JSON synced to D1.
 *
 * The client may send anything. We accept only the known AppState shape, strip
 * fields that must never persist (file-availability flags, unknown keys), and
 * reject payloads that try to smuggle secrets we refuse to collect.
 */

const FORBIDDEN_KEY_RE =
  /^(ssn|social.?security|driver.?licen[cs]e|passport.?number|account.?number|routing.?number|password|passwd|card.?number|cvv|pin)$/i;

const MAX_STATE_CHARS = 400_000;
const MAX_STRING = 4_000;
const MAX_DOCUMENTS = 100;
const MAX_CUSTOM_TASKS = 100;
const MAX_TASK_KEYS = 200;

export type PlanSanitizeError =
  | { ok: false; code: 'too_large' | 'invalid' | 'forbidden_field'; message: string }
  | { ok: true; stateJson: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function rejectForbiddenKeys(value: unknown, path: string): string | null {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = rejectForbiddenKeys(value[i], `${path}[${i}]`);
      if (hit) return hit;
    }
    return null;
  }
  if (!isPlainObject(value)) return null;
  for (const key of Object.keys(value)) {
    if (FORBIDDEN_KEY_RE.test(key)) return path ? `${path}.${key}` : key;
    const hit = rejectForbiddenKeys(value[key], path ? `${path}.${key}` : key);
    if (hit) return hit;
  }
  return null;
}

function clipString(value: unknown, max = MAX_STRING): string {
  if (typeof value !== 'string') return '';
  return value.slice(0, max);
}

function sanitizeName(raw: unknown): { first: string; middle: string; last: string } {
  const o = isPlainObject(raw) ? raw : {};
  return {
    first: clipString(o.first, 120),
    middle: clipString(o.middle, 120),
    last: clipString(o.last, 120),
  };
}

function sanitizeAddress(raw: unknown) {
  const o = isPlainObject(raw) ? raw : {};
  return {
    line1: clipString(o.line1, 200),
    line2: clipString(o.line2, 200),
    city: clipString(o.city, 120),
    state: clipString(o.state, 2),
    zip: clipString(o.zip, 20),
  };
}

function sanitizeMarriage(raw: unknown) {
  const o = isPlainObject(raw) ? raw : {};
  const copies = typeof o.certifiedCopies === 'number' && Number.isFinite(o.certifiedCopies)
    ? Math.max(0, Math.min(50, Math.floor(o.certifiedCopies)))
    : 0;
  return {
    spouseName: clipString(o.spouseName, 200),
    date: clipString(o.date, 32),
    state: clipString(o.state, 2),
    county: clipString(o.county, 120),
    certifiedCopies: copies,
  };
}

function sanitizeProfile(raw: unknown) {
  const o = isPlainObject(raw) ? raw : {};
  const circumstances = Array.isArray(o.circumstances)
    ? o.circumstances.filter((c): c is string => typeof c === 'string').map((c) => c.slice(0, 64)).slice(0, 40)
    : [];
  return {
    currentName: sanitizeName(o.currentName),
    newName: sanitizeName(o.newName),
    nameChangeKind: clipString(o.nameChangeKind, 64) || 'spouse-last-name',
    nameChangeKindOther: clipString(o.nameChangeKindOther, 200),
    dateOfBirth: clipString(o.dateOfBirth, 32),
    address: sanitizeAddress(o.address),
    phone: clipString(o.phone, 40),
    email: clipString(o.email, 254),
    marriage: sanitizeMarriage(o.marriage),
    circumstances,
  };
}

function sanitizeTaskState(raw: unknown) {
  if (!isPlainObject(raw)) return null;
  const status = clipString(raw.status, 32);
  const notes = clipString(raw.notes, MAX_STRING);
  const remindAt = typeof raw.remindAt === 'string' ? clipString(raw.remindAt, 64) : undefined;
  const completedAt = typeof raw.completedAt === 'string' ? clipString(raw.completedAt, 64) : undefined;
  const instances = Array.isArray(raw.instances)
    ? raw.instances
        .filter(isPlainObject)
        .slice(0, 50)
        .map((inst) => ({
          id: clipString(inst.id, 64),
          label: clipString(inst.label, 200),
          done: inst.done === true,
        }))
        .filter((inst) => inst.id && inst.label)
    : [];
  return {
    status: status || 'not-started',
    notes,
    remindAt,
    completedAt,
    instances,
  };
}

function sanitizeDocument(raw: unknown) {
  if (!isPlainObject(raw)) return null;
  const id = clipString(raw.id, 64);
  if (!id) return null;
  return {
    id,
    kindId: clipString(raw.kindId, 64),
    fileName: clipString(raw.fileName, 120) || 'document',
    sizeBytes:
      typeof raw.sizeBytes === 'number' && Number.isFinite(raw.sizeBytes)
        ? Math.max(0, Math.min(20 * 1024 * 1024, Math.floor(raw.sizeBytes)))
        : 0,
    mimeType: clipString(raw.mimeType, 120) || 'application/octet-stream',
    uploadedAt: clipString(raw.uploadedAt, 64) || new Date(0).toISOString(),
    // Bytes never travel in plan JSON; availability is session/R2, not D1.
    availableInSession: false,
  };
}

/**
 * Returns a compact, safe JSON string for `user_plans.state_json`, or an error.
 * Drops unknown top-level keys (including legacy `plan`) and any forbidden
 * secret-shaped fields nested anywhere in the payload.
 */
export function sanitizePlanPayload(raw: unknown): PlanSanitizeError {
  if (!isPlainObject(raw)) {
    return { ok: false, code: 'invalid', message: 'Plan must be a JSON object.' };
  }

  const forbidden = rejectForbiddenKeys(raw, '');
  if (forbidden) {
    return {
      ok: false,
      code: 'forbidden_field',
      message: `Plans must not include "${forbidden}". AfterIDo never stores that kind of data.`,
    };
  }

  const tasksIn = isPlainObject(raw.tasks) ? raw.tasks : {};
  const taskKeys = Object.keys(tasksIn).slice(0, MAX_TASK_KEYS);
  const tasks: Record<string, ReturnType<typeof sanitizeTaskState>> = {};
  for (const key of taskKeys) {
    const cleaned = sanitizeTaskState(tasksIn[key]);
    if (cleaned) tasks[key.slice(0, 64)] = cleaned;
  }

  const documents = Array.isArray(raw.documents)
    ? raw.documents.map(sanitizeDocument).filter((d): d is NonNullable<typeof d> => d !== null).slice(0, MAX_DOCUMENTS)
    : [];

  const customTasks = Array.isArray(raw.customTasks)
    ? raw.customTasks
        .filter(isPlainObject)
        .slice(0, MAX_CUSTOM_TASKS)
        .map((t) => ({
          id: clipString(t.id, 64),
          title: clipString(t.title, 200),
          category: clipString(t.category, 64),
        }))
        .filter((t) => t.id && t.title)
    : [];

  const state = {
    version: 2,
    onboarded: raw.onboarded === true,
    // Demo sample data must never become a server-side plan.
    demoMode: false,
    profile: sanitizeProfile(raw.profile),
    tasks,
    documents,
    customTasks,
  };

  const stateJson = JSON.stringify(state);
  if (stateJson.length > MAX_STATE_CHARS) {
    return { ok: false, code: 'too_large', message: 'That plan is too large to store.' };
  }
  return { ok: true, stateJson };
}

/** R2 object key: always `{userId}/{docId}` so listing/deletion stay scoped. */
export function documentObjectKey(userId: string, docId: string): string {
  return `${userId}/${docId}`;
}

/** True only when the key is exactly under this user's prefix (no path tricks). */
export function documentKeyBelongsToUser(userId: string, key: string): boolean {
  const prefix = `${userId}/`;
  return key.startsWith(prefix) && !key.slice(prefix.length).includes('/');
}

export const PLAN_JSON_MAX_BYTES = MAX_STATE_CHARS + 1024;
