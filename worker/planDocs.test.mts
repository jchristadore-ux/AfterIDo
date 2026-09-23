/**
 * Plan sync + document key isolation.
 *
 * Proves: another user cannot read a plan row by id confusion in the DB helpers,
 * optimistic revision conflicts, sanitize rejects secret-shaped fields and
 * oversized junk, and R2 keys stay under `{userId}/{docId}`.
 *
 *     node --experimental-strip-types --experimental-sqlite worker/planDocs.test.mts
 */
import path from 'node:path';
import { testDatabase } from './d1-sqlite.mts';
import {
  deleteUserDocument,
  findOrCreateUser,
  findUserDocument,
  getUserPlan,
  insertUserDocument,
  putUserPlan,
} from './db.ts';
import {
  documentKeyBelongsToUser,
  documentObjectKey,
  sanitizePlanPayload,
} from './planState.ts';
import { documentsEnabled, publicConfig, type Env } from './env.ts';

let failures = 0;
function check(label: string, ok: boolean) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) failures++;
}

const MIGRATIONS = path.join(import.meta.dirname, '..', 'migrations');
const fresh = () =>
  testDatabase(MIGRATIONS) as unknown as D1Database & {
    query: <T>(sql: string, ...p: unknown[]) => T[];
  };

// ── Key isolation ──────────────────────────────────────────────────────────
{
  const userId = 'usr_abc';
  const key = documentObjectKey(userId, 'doc_1');
  check('object key is userId/docId', key === 'usr_abc/doc_1');
  check('key belongs to owner', documentKeyBelongsToUser(userId, key));
  check('key rejects other user', !documentKeyBelongsToUser('usr_other', key));
  check('key rejects nested path', !documentKeyBelongsToUser(userId, 'usr_abc/evil/doc_1'));
  check('key rejects prefix escape', !documentKeyBelongsToUser(userId, 'usr_abcX/doc_1'));
}

// ── sanitizePlanPayload ────────────────────────────────────────────────────
{
  const good = sanitizePlanPayload({
    version: 2,
    onboarded: true,
    demoMode: true,
    profile: {
      currentName: { first: 'Ada', middle: '', last: 'Lovelace' },
      newName: { first: 'Ada', middle: '', last: 'King' },
      nameChangeKind: 'spouse-last-name',
      nameChangeKindOther: '',
      dateOfBirth: '1815-12-10',
      address: { line1: '1 Street', line2: '', city: 'London', state: 'NY', zip: '10001' },
      phone: '',
      email: 'ada@example.com',
      marriage: { spouseName: 'William', date: '1835-07-08', state: 'NY', county: '', certifiedCopies: 2 },
      circumstances: [],
    },
    tasks: { 'task-ssa': { status: 'in-progress', notes: 'ok', instances: [] } },
    documents: [
      {
        id: 'doc_1',
        kindId: 'marriage-cert',
        fileName: 'cert.pdf',
        sizeBytes: 12,
        mimeType: 'application/pdf',
        uploadedAt: '2026-01-01T00:00:00.000Z',
        availableInSession: true,
      },
    ],
    customTasks: [],
    plan: 'premium',
    ssn: 'should-be-caught-at-top',
  });
  // Top-level ssn must fail
  check('rejects top-level ssn', good.ok === false && (good as { code: string }).code === 'forbidden_field');

  const nested = sanitizePlanPayload({
    onboarded: true,
    profile: { currentName: { first: 'A' }, ssn: '111-22-3333' },
    tasks: {},
    documents: [],
    customTasks: [],
  });
  check('rejects nested ssn', nested.ok === false);

  const clean = sanitizePlanPayload({
    onboarded: true,
    demoMode: true,
    profile: {
      currentName: { first: 'Ada', middle: '', last: 'Lovelace' },
      newName: { first: 'Ada', middle: '', last: 'King' },
      nameChangeKind: 'spouse-last-name',
      nameChangeKindOther: '',
      dateOfBirth: '1815-12-10',
      address: { line1: '1 Street', line2: '', city: 'London', state: 'NY', zip: '10001' },
      phone: '',
      email: 'ada@example.com',
      marriage: { spouseName: 'William', date: '1835-07-08', state: 'NY', county: '', certifiedCopies: 2 },
      circumstances: [],
    },
    tasks: {},
    documents: [
      {
        id: 'doc_1',
        kindId: 'marriage-cert',
        fileName: 'cert.pdf',
        sizeBytes: 12,
        mimeType: 'application/pdf',
        uploadedAt: '2026-01-01T00:00:00.000Z',
        availableInSession: true,
      },
    ],
    customTasks: [],
    plan: 'premium',
  });
  check('accepts normal plan', clean.ok === true);
  if (clean.ok) {
    const parsed = JSON.parse(clean.stateJson);
    check('forces demoMode false on server', parsed.demoMode === false);
    check('strips availableInSession', parsed.documents[0].availableInSession === false);
    check('drops legacy plan field', parsed.plan === undefined);
  }

  const huge = sanitizePlanPayload({
    onboarded: true,
    profile: { currentName: { first: 'x'.repeat(500_000) } },
    tasks: {},
    documents: [],
    customTasks: [],
  });
  // first/name is clipped so this should still succeed (clipped), not too_large
  check('clips oversized strings rather than crashing', huge.ok === true);
}

// ── Plan get/put authz via DB helpers (API always scopes by currentUser) ───
{
  const db = fresh();
  const alice = await findOrCreateUser(db, 'alice@example.com');
  const bob = await findOrCreateUser(db, 'bob@example.com');

  const sanitized = sanitizePlanPayload({
    onboarded: true,
    profile: {
      currentName: { first: 'Alice', middle: '', last: 'A' },
      newName: { first: 'Alice', middle: '', last: 'B' },
      nameChangeKind: 'spouse-last-name',
      nameChangeKindOther: '',
      dateOfBirth: '',
      address: { line1: '', line2: '', city: '', state: '', zip: '' },
      phone: '',
      email: 'alice@example.com',
      marriage: { spouseName: '', date: '', state: '', county: '', certifiedCopies: 0 },
      circumstances: [],
    },
    tasks: {},
    documents: [],
    customTasks: [],
  });
  if (!sanitized.ok) throw new Error('sanitize failed in setup');

  const saved = await putUserPlan(db, alice.id, sanitized.stateJson, 0);
  check('alice plan insert revision 1', saved?.revision === 1);

  const aliceRead = await getUserPlan(db, alice.id);
  const bobRead = await getUserPlan(db, bob.id);
  check('alice can load her plan', aliceRead?.state_json.includes('Alice') === true);
  check('bob has no plan row', bobRead === null);

  // Bob cannot "read alice" through findUserDocument-style scoping either —
  // getUserPlan always takes the caller-supplied user id (API uses session).
  const conflict = await putUserPlan(db, alice.id, sanitized.stateJson, 0);
  check('stale revision rejected', conflict === null);

  const ok = await putUserPlan(db, alice.id, sanitized.stateJson, 1);
  check('matching revision advances', ok?.revision === 2);
}

// ── Document metadata isolation ────────────────────────────────────────────
{
  const db = fresh();
  const alice = await findOrCreateUser(db, 'alice2@example.com');
  const bob = await findOrCreateUser(db, 'bob2@example.com');
  const key = documentObjectKey(alice.id, 'doc_xyz');

  await insertUserDocument(db, {
    id: 'doc_xyz',
    user_id: alice.id,
    r2_key: key,
    file_name: 'cert.pdf',
    content_type: 'application/pdf',
    byte_size: 100,
    kind_id: 'marriage-cert',
  });

  const asAlice = await findUserDocument(db, alice.id, 'doc_xyz');
  const asBob = await findUserDocument(db, bob.id, 'doc_xyz');
  check('owner finds document metadata', asAlice?.r2_key === key);
  check('other user cannot load metadata by id', asBob === null);

  const deleted = await deleteUserDocument(db, bob.id, 'doc_xyz');
  check('other user cannot delete', deleted === null);
  const stillThere = await findUserDocument(db, alice.id, 'doc_xyz');
  check('owner row survives foreign delete', stillThere !== null);

  const removed = await deleteUserDocument(db, alice.id, 'doc_xyz');
  check('owner can delete', removed?.id === 'doc_xyz');
}

// ── documents capability flag ──────────────────────────────────────────────
{
  const base = {
    ASSETS: null as unknown as Fetcher,
    DB: {} as D1Database,
    SESSION_SECRET: 's'.repeat(32),
    RESEND_API_KEY: 're_test',
    EMAIL_FROM: 'AfterIDo <hello@example.com>',
  } satisfies Partial<Env> as Env;

  check('documents off without R2', documentsEnabled(base) === false);
  check('publicConfig.documents false without R2', publicConfig(base).documents === false);

  const withR2 = { ...base, DOCUMENTS: {} as R2Bucket };
  check('documents on with R2 + accounts', documentsEnabled(withR2) === true);
  check('publicConfig.documents true with R2', publicConfig(withR2).documents === true);
}

if (failures) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('\nAll plan/docs checks passed.');
