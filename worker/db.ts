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
  },
): Promise<void> {
  const now = nowSeconds();
  await db.batch([
    db
      .prepare(
        'INSERT OR IGNORE INTO purchases (id, user_id, amount_total, currency, livemode, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .bind(
        args.sessionId,
        args.userId,
        args.amountTotal,
        args.currency,
        args.livemode ? 1 : 0,
        now,
      ),
    db
      .prepare(
        "UPDATE users SET plan = 'premium', plan_granted_at = COALESCE(plan_granted_at, ?), stripe_customer_id = COALESCE(?, stripe_customer_id) WHERE id = ?",
      )
      .bind(now, args.stripeCustomerId, args.userId),
  ]);
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
}

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

export async function dueReminders(db: D1Database, limit = 50): Promise<ReminderRow[]> {
  const result = await db
    .prepare(
      'SELECT r.* FROM reminders r JOIN users u ON u.id = r.user_id WHERE r.sent_at IS NULL AND r.send_at <= ? AND u.reminders_opt_in = 1 LIMIT ?',
    )
    .bind(nowSeconds(), limit)
    .all<ReminderRow>();
  return result.results ?? [];
}

export async function markReminderSent(db: D1Database, id: string): Promise<void> {
  await db.prepare('UPDATE reminders SET sent_at = ? WHERE id = ?').bind(nowSeconds(), id).run();
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
