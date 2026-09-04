/**
 * Every database access in the app goes through this file, and every one uses
 * a bound parameter (`?`). There is no string interpolation into SQL anywhere
 * in the Worker, which is what makes SQL injection a non-issue rather than a
 * thing to remember.
 */
import { nowSeconds } from './http.ts';
import { randomId, sha256Hex } from './crypto.ts';

export interface UserRow {
  id: string;
  email: string;
  created_at: number;
  plan: 'free' | 'premium';
  plan_granted_at: number | null;
  stripe_customer_id: string | null;
  reminders_opt_in: number;
  last_seen_at: number | null;
  /** Bumped by "sign out everywhere"; every older session cookie stops working. */
  session_version: number;
}

/** Lowercase and trim, so "Sarah@Example.com " and "sarah@example.com" are one account. */
export function normaliseEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Deliberately permissive: the definitive test of an address is whether the
 * sign-in link arrives. This only rejects shapes that cannot be an address at
 * all, and caps the length so the column can't be used as free storage.
 */
export function isPlausibleEmail(email: string): boolean {
  return email.length >= 5 && email.length <= 254 && /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/.test(email);
}

export async function findUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  return db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>();
}

export async function findUserById(db: D1Database, id: string): Promise<UserRow | null> {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
}

export async function findOrCreateUser(db: D1Database, email: string): Promise<UserRow> {
  const existing = await findUserByEmail(db, email);
  if (existing) return existing;

  const id = randomId('usr');
  await db
    .prepare('INSERT INTO users (id, email, created_at, plan) VALUES (?, ?, ?, ?)')
    .bind(id, email, nowSeconds(), 'free')
    .run();

  // Re-read rather than construct: another request may have created the row
  // between the SELECT and the INSERT, in which case the UNIQUE constraint
  // means ours is the one that lost.
  const user = await findUserByEmail(db, email);
  if (!user) throw new Error('user_create_failed');
  return user;
}

export async function touchUser(db: D1Database, id: string): Promise<void> {
  await db.prepare('UPDATE users SET last_seen_at = ? WHERE id = ?').bind(nowSeconds(), id).run();
}

export async function setRemindersOptIn(
  db: D1Database,
  userId: string,
  optIn: boolean,
): Promise<void> {
  await db
    .prepare('UPDATE users SET reminders_opt_in = ? WHERE id = ?')
    .bind(optIn ? 1 : 0, userId)
    .run();
}

/**
 * Invalidates every session cookie this account has ever been issued.
 *
 * Signing out clears the cookie in the browser doing the signing out, which is
 * no help at all to someone who has just realised their email inbox was
 * compromised — the attacker's cookie is in a browser we cannot reach. The
 * session's version number is checked on every request, so bumping it here is
 * the one action that reaches all of them at once. Returns the new version.
 */
export async function bumpSessionVersion(db: D1Database, userId: string): Promise<number> {
  // Two statements rather than one with RETURNING: this is the only write in
  // the app that would need it, and it is not worth betting a security control
  // on whether the D1 driver supports it.
  await db
    .prepare('UPDATE users SET session_version = session_version + 1 WHERE id = ?')
    .bind(userId)
    .run();

  const row = await db
    .prepare('SELECT session_version FROM users WHERE id = ?')
    .bind(userId)
    .first<{ session_version: number }>();
  return row?.session_version ?? 0;
}

// ---------------------------------------------------------------------------
// Sign-in links
// ---------------------------------------------------------------------------

const LOGIN_TOKEN_TTL_SECONDS = 20 * 60;

export async function storeLoginToken(
  db: D1Database,
  userId: string,
  token: string,
): Promise<void> {
  await db
    .prepare('INSERT INTO login_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(await sha256Hex(token), userId, nowSeconds() + LOGIN_TOKEN_TTL_SECONDS)
    .run();
}

/**
 * Redeems a sign-in link. The UPDATE carries the "not already used, not
 * expired" test in its WHERE clause, so two clicks on the same link race
 * against the database rather than against each other — exactly one wins.
 */
export async function redeemLoginToken(db: D1Database, token: string): Promise<string | null> {
  const hash = await sha256Hex(token);
  const now = nowSeconds();
  const result = await db
    .prepare('UPDATE login_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?')
    .bind(now, hash, now)
    .run();

  if (!result.meta.changes) return null;

  const row = await db
    .prepare('SELECT user_id FROM login_tokens WHERE token_hash = ?')
    .bind(hash)
    .first<{ user_id: string }>();
  return row?.user_id ?? null;
}

export async function purgeExpiredLoginTokens(db: D1Database): Promise<void> {
  await db.prepare('DELETE FROM login_tokens WHERE expires_at < ?').bind(nowSeconds() - 86400).run();
}

// ---------------------------------------------------------------------------
// Purchases and entitlement
// ---------------------------------------------------------------------------

/**
 * Grants Premium from a verified Stripe event.
 *
 * The purchase row's primary key is Stripe's checkout session id, so a
 * redelivered webhook — which Stripe does routinely — inserts nothing the
 * second time and the grant stays idempotent.
 */
export async function grantPremium(
  db: D1Database,
  args: {
    userId: string;
    sessionId: string;
    amountTotal: number | null;
    currency: string | null;
    livemode: boolean;
    stripeCustomerId: string | null;
    paymentIntentId: string | null;
  },
): Promise<void> {
  const now = nowSeconds();
  await db.batch([
    db
      .prepare(
        'INSERT OR IGNORE INTO purchases (id, user_id, amount_total, currency, livemode, created_at, payment_intent) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        args.sessionId,
        args.userId,
        args.amountTotal,
        args.currency,
        args.livemode ? 1 : 0,
        now,
        args.paymentIntentId,
      ),
    // A redelivered webhook takes the INSERT OR IGNORE path above and writes
    // nothing, so the payment intent has to be backfilled separately for the
    // case where the first write of this session had not learned it yet.
    db
      .prepare(
        'UPDATE purchases SET payment_intent = COALESCE(payment_intent, ?) WHERE id = ?',
      )
      .bind(args.paymentIntentId, args.sessionId),
    db
      .prepare(
        "UPDATE users SET plan = 'premium', plan_granted_at = COALESCE(plan_granted_at, ?), stripe_customer_id = COALESCE(?, stripe_customer_id) WHERE id = ?",
      )
      .bind(now, args.stripeCustomerId, args.userId),
  ]);
}

/**
 * Finds the account behind a refunded or disputed charge.
 *
 * Two routes, because neither is reliable alone. `stripe_customer_id` is only
 * populated when Stripe made a Customer for the purchase — it now always does,
 * since Checkout asks for one, but purchases made before that change have the
 * column empty. The payment intent is carried on the purchase row and is
 * present on every Charge object Stripe sends, which makes it the one that
 * works for both. Tried in that order; either hit is definitive.
 */
export async function findUserForCharge(
  db: D1Database,
  args: { customerId: string | null; paymentIntentId: string | null },
): Promise<UserRow | null> {
  if (args.customerId) {
    const row = await db
      .prepare('SELECT * FROM users WHERE stripe_customer_id = ?')
      .bind(args.customerId)
      .first<UserRow>();
    if (row) return row;
  }

  if (args.paymentIntentId) {
    const purchase = await db
      .prepare('SELECT user_id FROM purchases WHERE payment_intent = ?')
      .bind(args.paymentIntentId)
      .first<{ user_id: string | null }>();
    if (purchase?.user_id) return findUserById(db, purchase.user_id);
  }

  return null;
}

/** Used when Stripe reports a refund or dispute. */
export async function revokePremium(db: D1Database, userId: string): Promise<void> {
  await db
    .prepare("UPDATE users SET plan = 'free', plan_granted_at = NULL WHERE id = ?")
    .bind(userId)
    .run();
}

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------

export interface ReminderRow {
  id: string;
  user_id: string;
  send_at: number;
  subject: string;
  body: string;
  sent_at: number | null;
  attempts: number;
}

/** How many times a reminder is retried before it is given up on. */
export const MAX_REMINDER_ATTEMPTS = 4;

export async function replaceReminders(
  db: D1Database,
  userId: string,
  reminders: { sendAt: number; subject: string; body: string }[],
): Promise<void> {
  const statements: D1PreparedStatement[] = [
    db.prepare('DELETE FROM reminders WHERE user_id = ? AND sent_at IS NULL').bind(userId),
  ];
  for (const reminder of reminders.slice(0, 50)) {
    statements.push(
      db
        .prepare('INSERT INTO reminders (id, user_id, send_at, subject, body) VALUES (?, ?, ?, ?, ?)')
        .bind(randomId('rem'), userId, reminder.sendAt, reminder.subject, reminder.body),
    );
  }
  await db.batch(statements);
}

/**
 * Reminders that have come due, oldest first.
 *
 * The ordering matters because the sweep takes a bounded number per run: without
 * it, a backlog larger than the batch size would keep re-reading whichever rows
 * the database happened to return and starve the rest indefinitely. Rows that
 * have already failed their allowance of attempts are excluded so a permanently
 * undeliverable address cannot fill the batch every hour forever.
 */
export async function dueReminders(db: D1Database, limit = 50): Promise<ReminderRow[]> {
  const result = await db
    .prepare(
      `SELECT r.* FROM reminders r
         JOIN users u ON u.id = r.user_id
        WHERE r.sent_at IS NULL
          AND r.send_at <= ?
          AND r.attempts < ?
          AND u.reminders_opt_in = 1
        ORDER BY r.send_at ASC
        LIMIT ?`,
    )
    .bind(nowSeconds(), MAX_REMINDER_ATTEMPTS, limit)
    .all<ReminderRow>();
  return result.results ?? [];
}

export async function markReminderSent(db: D1Database, id: string): Promise<void> {
  await db.prepare('UPDATE reminders SET sent_at = ? WHERE id = ?').bind(nowSeconds(), id).run();
}

/**
 * A send that did not succeed.
 *
 * The row is deliberately *not* marked sent — that is what used to happen, and
 * it turned a transient mail-provider failure into a reminder the customer had
 * asked for and silently never received. Counting the attempt instead means the
 * next hourly sweep picks it up again, and `dueReminders` stops trying once the
 * count says this one is not going to work.
 */
export async function markReminderFailed(db: D1Database, id: string): Promise<void> {
  await db.prepare('UPDATE reminders SET attempts = attempts + 1 WHERE id = ?').bind(id).run();
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

/**
 * Fixed-window counter. Not perfectly fair at window edges, but it is one
 * round-trip and it is enough to stop somebody using the sign-in endpoint to
 * mail-bomb a stranger or to run up a Stripe bill.
 */
export async function rateLimit(
  db: D1Database,
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const now = nowSeconds();
  const windowStart = now - (now % windowSeconds);
  await db
    .prepare(
      `INSERT INTO rate_limits (bucket, count, window_start) VALUES (?, 1, ?)
       ON CONFLICT (bucket) DO UPDATE SET
         count = CASE WHEN rate_limits.window_start = excluded.window_start THEN rate_limits.count + 1 ELSE 1 END,
         window_start = excluded.window_start`,
    )
    .bind(bucket, windowStart)
    .run();

  const row = await db
    .prepare('SELECT count FROM rate_limits WHERE bucket = ?')
    .bind(bucket)
    .first<{ count: number }>();
  return (row?.count ?? 0) <= limit;
}

export async function purgeRateLimits(db: D1Database): Promise<void> {
  await db.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(nowSeconds() - 86400).run();
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export async function recordEvent(
  db: D1Database,
  name: string,
  props: Record<string, string> | null,
): Promise<void> {
  const now = nowSeconds();
  await db
    .prepare('INSERT INTO events (name, day, props, created_at) VALUES (?, ?, ?, ?)')
    .bind(name, new Date(now * 1000).toISOString().slice(0, 10), props ? JSON.stringify(props) : null, now)
    .run();
}

/**
 * Analytics answer "how is this doing lately", and lately is at most a year.
 * Without this the table is the only thing in the database that grows without
 * bound; a row per page view is small, but "small forever" is still forever.
 */
export async function purgeOldEvents(db: D1Database): Promise<void> {
  await db
    .prepare('DELETE FROM events WHERE created_at < ?')
    .bind(nowSeconds() - 400 * 86400)
    .run();
}
