/**
 * Resend send + reminder dead-letter / single alert.
 *
 * Mocks `fetch` so CI never talks to Resend. Covers:
 *   - success path marks the reminder sent
 *   - repeated failures climb attempts → one dead-letter row → one alert
 *   - a second sweep after dead-letter does not alert again
 *
 *     node --experimental-strip-types --experimental-sqlite worker/email.test.mts
 */
import path from 'node:path';
import { testDatabase } from './d1-sqlite.mts';
import {
  MAX_REMINDER_ATTEMPTS,
  findOrCreateUser,
  listEmailDeadLetters,
  replaceReminders,
} from './db.ts';
import { sendEmail, redactEmail, deadLetterAlertEmail } from './email.ts';
import { runReminderSweep } from './reminders.ts';
import type { Env } from './env.ts';

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

const now = () => Math.floor(Date.now() / 1000);

type FetchCall = { url: string; body: unknown };
const calls: FetchCall[] = [];
let fetchImpl: (url: string, init?: RequestInit) => Promise<Response> = async () =>
  new Response('{}', { status: 200 });

const originalFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  let body: unknown = null;
  if (init?.body && typeof init.body === 'string') {
    try {
      body = JSON.parse(init.body);
    } catch {
      body = init.body;
    }
  }
  calls.push({ url, body });
  return fetchImpl(url, init);
}) as typeof fetch;

function mockEnv(db: D1Database, overrides: Partial<Env> = {}): Env {
  return {
    ASSETS: { fetch: async () => new Response('ok') } as unknown as Fetcher,
    DB: db,
    SESSION_SECRET: 'x'.repeat(32),
    RESEND_API_KEY: 're_test_key',
    EMAIL_FROM: 'AfterIDo <hello@after-i-do.com>',
    SUPPORT_EMAIL: 'ops@example.com',
    PUBLIC_ORIGIN: 'https://after-i-do.com',
    ALLOW_DEV_SIGNIN_LINKS: 'true', // accountsEnabled without needing real mail for sign-in path
    ...overrides,
  };
}

// ── redact + alert copy ────────────────────────────────────────────────────
{
  check('redacts local part', redactEmail('sarah@example.com') === 's***@example.com');
  const alert = deadLetterAlertEmail({
    reminderId: 'rem_1',
    subject: 'Reminder: SSA',
    redactedTo: 's***@example.com',
    attempts: 4,
    lastError: 'resend_http_429',
  });
  check('alert subject names reminder', alert.subject.includes('rem_1'));
  check('alert has no magic-link shape', !/https?:\/\/\S+\/api\/auth/.test(alert.text));
  check('alert does not include raw recipient', !alert.text.includes('sarah@'));
}

// ── sendEmail success / failure capture ────────────────────────────────────
{
  calls.length = 0;
  fetchImpl = async () => new Response(JSON.stringify({ id: 'email_1' }), { status: 200 });
  const ok = await sendEmail(mockEnv(fresh()), {
    to: 'a@example.com',
    subject: 'Hi',
    text: 'body with https://after-i-do.com/api/auth/callback?token=SECRET',
  });
  check('sendEmail success', ok.ok === true);
  check('sendEmail posts to Resend', calls[0]?.url === 'https://api.resend.com/emails');

  calls.length = 0;
  fetchImpl = async () =>
    new Response(JSON.stringify({ message: 'rate limited forever and ever '.repeat(20) }), {
      status: 429,
    });
  const fail = await sendEmail(mockEnv(fresh()), {
    to: 'a@example.com',
    subject: 'Hi',
    text: 'secret link TOKEN',
  });
  check('sendEmail failure not ok', fail.ok === false);
  check('sendEmail captures truncated status error', (fail.error ?? '').startsWith('resend_http_429'));
  check('sendEmail error is truncated', (fail.error?.length ?? 0) < 400);
}

// ── success path via sweep ─────────────────────────────────────────────────
{
  calls.length = 0;
  fetchImpl = async () => new Response('{"id":"ok"}', { status: 200 });
  const db = fresh();
  const user = await findOrCreateUser(db, 'ok@example.com');
  await db.prepare('UPDATE users SET reminders_opt_in = 1 WHERE id = ?').bind(user.id).run();
  await replaceReminders(db, user.id, [
    { sendAt: now() - 10, subject: 'Due', body: 'do the thing' },
  ]);

  await runReminderSweep(mockEnv(db));

  const remaining = db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM reminders WHERE user_id = ? AND sent_at IS NULL',
    user.id,
  );
  check('successful sweep marks reminder sent', remaining[0]?.n === 0);
  check('successful sweep called Resend once', calls.length === 1);
  check('no dead letters on success', (await listEmailDeadLetters(db)).length === 0);
}

// ── failures → dead-letter → single alert ──────────────────────────────────
{
  calls.length = 0;
  // Customer sends fail; the one-shot SUPPORT_EMAIL alert succeeds.
  fetchImpl = async (_url, init) => {
    let to: string[] = [];
    if (init?.body && typeof init.body === 'string') {
      try {
        to = (JSON.parse(init.body) as { to?: string[] }).to ?? [];
      } catch {
        /* ignore */
      }
    }
    if (to.includes('ops@example.com')) {
      return new Response('{"id":"alert_ok"}', { status: 200 });
    }
    return new Response('{"message":"bounce"}', { status: 422 });
  };
  const db = fresh();
  const user = await findOrCreateUser(db, 'fail@example.com');
  await db.prepare('UPDATE users SET reminders_opt_in = 1 WHERE id = ?').bind(user.id).run();
  await replaceReminders(db, user.id, [
    { sendAt: now() - 10, subject: 'Will fail', body: 'secret notes' },
  ]);

  const env = mockEnv(db);

  // Each sweep consumes one attempt while the row is still due.
  for (let i = 0; i < MAX_REMINDER_ATTEMPTS; i++) {
    await runReminderSweep(env);
  }

  const dead = await listEmailDeadLetters(db);
  check('dead letter row created after max attempts', dead.length === 1);
  check('dead letter keeps subject', dead[0]?.subject === 'Will fail');
  check('dead letter stores last_error', (dead[0]?.last_error ?? '').includes('resend_http_422'));
  check('dead letter attempts at max', dead[0]?.attempts === MAX_REMINDER_ATTEMPTS);

  // Resend calls: MAX failures for the customer + 1 alert to SUPPORT_EMAIL
  const customerCalls = calls.filter(
    (c) =>
      c.body &&
      typeof c.body === 'object' &&
      Array.isArray((c.body as { to?: string[] }).to) &&
      (c.body as { to: string[] }).to.includes('fail@example.com'),
  );
  const alertCalls = calls.filter(
    (c) =>
      c.body &&
      typeof c.body === 'object' &&
      Array.isArray((c.body as { to?: string[] }).to) &&
      (c.body as { to: string[] }).to.includes('ops@example.com'),
  );
  check(
    `customer send retried ${MAX_REMINDER_ATTEMPTS} times`,
    customerCalls.length === MAX_REMINDER_ATTEMPTS,
  );
  check('exactly one operator alert', alertCalls.length === 1);
  const alertBody = alertCalls[0]?.body as { text?: string; subject?: string };
  check('alert text redacts customer', (alertBody.text ?? '').includes('f***@example.com'));
  check('alert text omits reminder body secrets', !(alertBody.text ?? '').includes('secret notes'));

  // Further sweeps must not re-alert or re-insert.
  const callsBefore = calls.length;
  await runReminderSweep(env);
  await runReminderSweep(env);
  check('no further Resend calls after dead-letter', calls.length === callsBefore);
  check('still a single dead-letter row', (await listEmailDeadLetters(db)).length === 1);
}

// ── email disabled: dead-letter still recorded, loud log (no throw) ────────
{
  calls.length = 0;
  fetchImpl = async () => new Response('should not be called', { status: 500 });
  const db = fresh();
  const user = await findOrCreateUser(db, 'noconfig@example.com');
  await db.prepare('UPDATE users SET reminders_opt_in = 1 WHERE id = ?').bind(user.id).run();
  await replaceReminders(db, user.id, [
    { sendAt: now() - 10, subject: 'Offline', body: 'b' },
  ]);

  const env = mockEnv(db, { RESEND_API_KEY: undefined });
  for (let i = 0; i < MAX_REMINDER_ATTEMPTS; i++) {
    await runReminderSweep(env);
  }
  check('dead letter without Resend key', (await listEmailDeadLetters(db)).length === 1);
  check('no fetch when email disabled', calls.length === 0);
}

globalThis.fetch = originalFetch;

if (failures > 0) {
  console.error(`\n${failures} email test(s) failed`);
  process.exit(1);
}
console.log('\nAll email / dead-letter tests passed.');
