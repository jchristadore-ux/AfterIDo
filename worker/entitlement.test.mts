/**
 * The money tests.
 *
 * `verify.test.mts` proves the signatures — who you are, and whether Stripe
 * really sent that. These prove what happens *next*: that a payment grants
 * Premium once and only once however many times Stripe tells us about it, that
 * a refund actually takes it away, that one customer cannot reach another's
 * account, and that a sign-in link cannot be used twice.
 *
 * Every one of these was found missing in the pre-launch audit, and two of them
 * were found broken. They run against real SQLite over the real migrations, so
 * `INSERT OR IGNORE`, `COALESCE` and the redeem-race UPDATE are genuinely
 * executed rather than described.
 *
 *     npm test
 */
import path from 'node:path';
import { testDatabase } from './d1-sqlite.mts';
import {
  MAX_REMINDER_ATTEMPTS,
  bumpSessionVersion,
  dueReminders,
  findOrCreateUser,
  findUserById,
  findUserForCharge,
  grantPremium,
  isPlausibleEmail,
  markReminderFailed,
  markReminderSent,
  normaliseEmail,
  rateLimit,
  redeemLoginToken,
  replaceReminders,
  revokePremium,
  storeLoginToken,
} from './db.ts';
import { accountsEnabled, paymentsEnabled, publicConfig } from './env.ts';
import type { Env } from './env.ts';
import { buildReminderPayloads } from '../src/lib/reminderSchedule.ts';
import { canUse } from '../src/lib/plan.ts';

let failures = 0;
function check(label: string, ok: boolean) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) failures++;
}

const MIGRATIONS = path.join(import.meta.dirname, '..', 'migrations');
// The shim is structurally a D1Database for everything db.ts calls on it.
const fresh = () => testDatabase(MIGRATIONS) as unknown as D1Database & { query: <T>(sql: string, ...p: unknown[]) => T[] };

const now = () => Math.floor(Date.now() / 1000);

// ── Granting Premium ───────────────────────────────────────────────────────
{
  const db = fresh();
  const user = await findOrCreateUser(db, 'sarah@example.com');

  await grantPremium(db, {
    userId: user.id,
    sessionId: 'cs_test_1',
    amountTotal: 1999,
    currency: 'usd',
    livemode: true,
    stripeCustomerId: 'cus_1',
    paymentIntentId: 'pi_1',
  });

  const after = await findUserById(db, user.id);
  check('payment grants premium', after?.plan === 'premium');
  check('grant records the date', typeof after?.plan_granted_at === 'number');
  check('grant records the stripe customer', after?.stripe_customer_id === 'cus_1');

  // Stripe redelivers webhooks as a matter of routine, and the success page
  // reads the session back independently. Both land here.
  const grantedAt = after?.plan_granted_at;
  await grantPremium(db, {
    userId: user.id,
    sessionId: 'cs_test_1',
    amountTotal: 1999,
    currency: 'usd',
    livemode: true,
    stripeCustomerId: 'cus_1',
    paymentIntentId: 'pi_1',
  });

  const purchases = db.query<{ n: number }>('SELECT COUNT(*) AS n FROM purchases');
  check('duplicate webhook does not duplicate the purchase', purchases[0]?.n === 1);
  const replayed = await findUserById(db, user.id);
  check('duplicate webhook does not move the purchase date', replayed?.plan_granted_at === grantedAt);
}

// ── A purchase whose payment intent arrives late ───────────────────────────
{
  const db = fresh();
  const user = await findOrCreateUser(db, 'late@example.com');

  // The success-page read-back can win the race and know less than the webhook.
  await grantPremium(db, {
    userId: user.id, sessionId: 'cs_2', amountTotal: 1999, currency: 'usd',
    livemode: true, stripeCustomerId: null, paymentIntentId: null,
  });
  await grantPremium(db, {
    userId: user.id, sessionId: 'cs_2', amountTotal: 1999, currency: 'usd',
    livemode: true, stripeCustomerId: 'cus_2', paymentIntentId: 'pi_2',
  });

  const rows = db.query<{ payment_intent: string | null }>('SELECT payment_intent FROM purchases');
  check('a later event backfills the payment intent', rows[0]?.payment_intent === 'pi_2');
  const filled = await findUserById(db, user.id);
  check('a later event backfills the stripe customer', filled?.stripe_customer_id === 'cus_2');
}

// ── Refunds ────────────────────────────────────────────────────────────────
{
  const db = fresh();
  const user = await findOrCreateUser(db, 'refund@example.com');
  await grantPremium(db, {
    userId: user.id, sessionId: 'cs_3', amountTotal: 1999, currency: 'usd',
    livemode: true, stripeCustomerId: 'cus_3', paymentIntentId: 'pi_3',
  });

  const byCustomer = await findUserForCharge(db, { customerId: 'cus_3', paymentIntentId: null });
  check('refund finds the account by stripe customer', byCustomer?.id === user.id);

  // The case that was broken before launch: Stripe's one-time Checkout did not
  // create a Customer, so this was the only route home and it did not exist.
  const byIntent = await findUserForCharge(db, { customerId: null, paymentIntentId: 'pi_3' });
  check('refund finds the account by payment intent alone', byIntent?.id === user.id);

  check(
    'refund for an unknown charge finds nobody',
    (await findUserForCharge(db, { customerId: 'cus_nope', paymentIntentId: 'pi_nope' })) === null,
  );

  await revokePremium(db, user.id);
  const revoked = await findUserById(db, user.id);
  check('refund removes premium', revoked?.plan === 'free');
  check('refund clears the grant date', revoked?.plan_granted_at === null);

  const kept = db.query<{ n: number }>('SELECT COUNT(*) AS n FROM purchases');
  check('refund keeps the financial record', kept[0]?.n === 1);
}

// ── One customer cannot reach another ──────────────────────────────────────
{
  const db = fresh();
  const a = await findOrCreateUser(db, 'a@example.com');
  const b = await findOrCreateUser(db, 'b@example.com');

  await grantPremium(db, {
    userId: a.id, sessionId: 'cs_a', amountTotal: 1999, currency: 'usd',
    livemode: true, stripeCustomerId: 'cus_a', paymentIntentId: 'pi_a',
  });

  const stillFree = await findUserById(db, b.id);
  check("one customer's purchase does not upgrade another", stillFree?.plan === 'free');

  await replaceReminders(db, a.id, [
    { sendAt: now() + 3600, subject: "A's private reminder", body: 'x' },
  ]);
  const bReminders = db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM reminders WHERE user_id = ?',
    b.id,
  );
  check("one customer's reminders do not land on another", bReminders[0]?.n === 0);

  // Deleting an account must not take the other's rows, or the payment record.
  await db.batch([
    db.prepare('DELETE FROM reminders WHERE user_id = ?').bind(a.id),
    db.prepare('UPDATE purchases SET user_id = NULL WHERE user_id = ?').bind(a.id),
    db.prepare('DELETE FROM users WHERE id = ?').bind(a.id),
  ]);
  check('deleting an account leaves the other intact', (await findUserById(db, b.id)) !== null);
  const detached = db.query<{ user_id: string | null; n: number }>(
    'SELECT user_id, COUNT(*) AS n FROM purchases',
  );
  check('deleting an account detaches rather than destroys the purchase', detached[0]?.n === 1);
  check('the detached purchase has no owner', detached[0]?.user_id === null);
}

// ── Sign-in links ──────────────────────────────────────────────────────────
{
  const db = fresh();
  const user = await findOrCreateUser(db, 'link@example.com');
  await storeLoginToken(db, user.id, 'token-abc');

  check('a fresh link signs the right person in', (await redeemLoginToken(db, 'token-abc')) === user.id);
  check('the same link cannot be used twice', (await redeemLoginToken(db, 'token-abc')) === null);
  check('an unknown link is refused', (await redeemLoginToken(db, 'token-nope')) === null);

  // Only the hash is stored, so a leaked row cannot be replayed as a login.
  const stored = db.query<{ token_hash: string }>('SELECT token_hash FROM login_tokens');
  check('the raw link is never stored', !stored.some((r) => r.token_hash.includes('token-abc')));
}

// ── Signing out everywhere ─────────────────────────────────────────────────
{
  const db = fresh();
  const user = await findOrCreateUser(db, 'sessions@example.com');
  check('a new account starts at session version 0', user.session_version === 0);

  const bumped = await bumpSessionVersion(db, user.id);
  check('signing out everywhere bumps the version', bumped === 1);
  const reread = await findUserById(db, user.id);
  check('the bump is persisted', reread?.session_version === 1);
}

// ── Reminders ──────────────────────────────────────────────────────────────
{
  const db = fresh();
  const user = await findOrCreateUser(db, 'rem@example.com');
  await db.prepare('UPDATE users SET reminders_opt_in = 1 WHERE id = ?').bind(user.id).run();

  await replaceReminders(db, user.id, [
    { sendAt: now() - 60, subject: 'Due now', body: 'b' },
    { sendAt: now() + 86400, subject: 'Later', body: 'b' },
  ]);

  let due = await dueReminders(db);
  check('only reminders that have come due are sent', due.length === 1 && due[0].subject === 'Due now');

  // A failed send must not retire the row — that is what used to make a
  // reminder she asked for vanish with no trace.
  await markReminderFailed(db, due[0].id);
  due = await dueReminders(db);
  check('a failed send is retried', due.length === 1);

  for (let i = 1; i < MAX_REMINDER_ATTEMPTS; i++) await markReminderFailed(db, due[0].id);
  check('a permanently failing reminder is eventually given up on', (await dueReminders(db)).length === 0);

  // Replacing the set is what makes removing a reminder in the app remove it
  // from the queue, rather than leaving a ghost that still sends.
  await replaceReminders(db, user.id, []);
  const remaining = db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM reminders WHERE user_id = ? AND sent_at IS NULL',
    user.id,
  );
  check('clearing reminders empties the queue', remaining[0]?.n === 0);

  // A sent reminder is not resurrected by a later replace.
  await replaceReminders(db, user.id, [{ sendAt: now() - 10, subject: 'One', body: 'b' }]);
  const [only] = await dueReminders(db);
  await markReminderSent(db, only.id);
  check('a sent reminder is not sent again', (await dueReminders(db)).length === 0);
}

// ── Reminders are ordered, so a backlog cannot starve ──────────────────────
{
  const db = fresh();
  const user = await findOrCreateUser(db, 'order@example.com');
  await db.prepare('UPDATE users SET reminders_opt_in = 1 WHERE id = ?').bind(user.id).run();
  await replaceReminders(db, user.id, [
    { sendAt: now() - 10, subject: 'newest', body: 'b' },
    { sendAt: now() - 5000, subject: 'oldest', body: 'b' },
    { sendAt: now() - 100, subject: 'middle', body: 'b' },
  ]);
  const ordered = await dueReminders(db, 2);
  check(
    'the oldest reminders are sent first',
    ordered.length === 2 && ordered[0].subject === 'oldest' && ordered[1].subject === 'middle',
  );
}

// ── Rate limiting ──────────────────────────────────────────────────────────
{
  const db = fresh();
  let allowed = 0;
  for (let i = 0; i < 8; i++) if (await rateLimit(db, 'link:email:x', 5, 3600)) allowed++;
  check('the rate limiter stops after the limit', allowed === 5);
  check('a different bucket is unaffected', await rateLimit(db, 'link:email:y', 5, 3600));
}

// ── Accounts one address, however it is typed ──────────────────────────────
{
  const db = fresh();
  const first = await findOrCreateUser(db, normaliseEmail('  Sarah@Example.COM '));
  const second = await findOrCreateUser(db, normaliseEmail('sarah@example.com'));
  check('one address is one account however it is typed', first.id === second.id);

  check('a plausible address is accepted', isPlausibleEmail('sarah@example.com'));
  check('an address with no domain is refused', !isPlausibleEmail('sarah@example'));
  check('an address with a space is refused', !isPlausibleEmail('sar ah@example.com'));
  check('an absurdly long address is refused', !isPlausibleEmail('a'.repeat(250) + '@example.com'));
}

// ── Capabilities: the deployment states that matter ────────────────────────
{
  const base = {
    DB: {} as D1Database,
    SESSION_SECRET: 's'.repeat(48),
    RESEND_API_KEY: 're_x',
    EMAIL_FROM: 'AfterIDo <hello@example.com>',
    STRIPE_SECRET_KEY: 'sk_test_x',
    STRIPE_WEBHOOK_SECRET: 'whsec_x',
    STRIPE_PRICE_ID: 'price_x',
  } as unknown as Env;

  check('a fully configured deployment has accounts', accountsEnabled(base));
  check('a fully configured deployment has payments', paymentsEnabled(base));

  // The critical one. Without mail, the only way to sign anyone in is to hand
  // the caller the link — so accounts stay off instead.
  check(
    'no mail provider means no accounts',
    !accountsEnabled({ ...base, RESEND_API_KEY: undefined }),
  );
  check(
    'no mail provider means no payments either',
    !paymentsEnabled({ ...base, RESEND_API_KEY: undefined }),
  );
  check(
    'the dev-link switch is the only thing that substitutes for mail',
    accountsEnabled({ ...base, RESEND_API_KEY: undefined, ALLOW_DEV_SIGNIN_LINKS: 'true' }),
  );
  check(
    'the dev-link switch is an exact match, not merely truthy',
    !accountsEnabled({ ...base, RESEND_API_KEY: undefined, ALLOW_DEV_SIGNIN_LINKS: '1' }),
  );

  check('a short session secret means no accounts', !accountsEnabled({ ...base, SESSION_SECRET: 'short' }));
  check('a product id is not a price id', !paymentsEnabled({ ...base, STRIPE_PRICE_ID: 'prod_x' }));
  check('no webhook secret means no payments', !paymentsEnabled({ ...base, STRIPE_WEBHOOK_SECRET: undefined }));

  const config = publicConfig(base);
  check('a test key reports test mode', config.testMode === true);
  check('a live key reports live mode', publicConfig({ ...base, STRIPE_SECRET_KEY: 'sk_live_x' }).testMode === false);
  check('no secret is ever in the public config', !JSON.stringify(config).includes('sk_test_x'));
  check('no session secret is ever in the public config', !JSON.stringify(config).includes('s'.repeat(48)));
}

// ── Entitlements ───────────────────────────────────────────────────────────
{
  check('free includes the whole checklist', canUse('free', 'full-checklist'));
  check('free includes prefill', canUse('free', 'prefill'));
  check('free does not include letters', !canUse('free', 'letters'));
  check('free does not include the packet', !canUse('free', 'packet'));
  check('free does not include reminders', !canUse('free', 'reminders'));
  check('premium includes letters', canUse('premium', 'letters'));
  check('premium includes reminders', canUse('premium', 'reminders'));
}

// ── What a reminder actually carries ───────────────────────────────────────
{
  const profile = {
    currentName: { first: 'Sarah', middle: '', last: 'Johnson' },
    newName: { first: 'Sarah', middle: '', last: 'Smith' },
    nameChangeKind: 'spouse-last-name',
    nameChangeKindOther: '',
    dateOfBirth: '1996-03-22',
    address: { line1: '412 Maple Avenue', line2: '', city: 'Montclair', state: 'NJ', zip: '07042' },
    phone: '9735550142',
    email: 'sarah@example.com',
    marriage: { spouseName: 'Michael Smith', date: '2026-06-14', state: 'NJ', county: 'Essex', certifiedCopies: 3 },
    circumstances: [],
  } as never;

  const soon = new Date(Date.now() + 3600_000).toISOString();
  const past = new Date(Date.now() - 3600_000).toISOString();
  const task = (id: string, remindAt: string | undefined, status: string) =>
    ({ id, title: `Task ${id}`, summary: 'Summary', state: { remindAt, status } }) as never;

  const payloads = buildReminderPayloads(profile, [
    task('a', soon, 'not-started'),
    task('b', past, 'not-started'),
    task('c', soon, 'complete'),
    task('d', undefined, 'not-started'),
  ]);

  check('only future reminders are queued', payloads.length === 1);
  check('a completed task is not queued', !payloads.some((p) => p.subject.includes('Task c')));

  // The privacy promise, enforced rather than asserted: a reminder email must
  // carry a date and a task title and nothing about her.
  const serialised = JSON.stringify(payloads);
  for (const secret of ['Sarah', 'Johnson', 'Smith', 'Maple', 'Montclair', '07042', '9735550142', '1996']) {
    check(`a reminder leaks no "${secret}"`, !serialised.includes(secret));
  }
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
