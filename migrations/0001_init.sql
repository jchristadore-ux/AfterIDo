-- AfterIDo — initial schema.
--
-- What this database deliberately does NOT hold: names, addresses, dates of
-- birth, marriage details, documents, Social Security numbers, driver's
-- licence numbers, account numbers or passwords. The user's plan lives in her
-- own browser. The server knows only who bought Premium, so the entitlement
-- can be verified server-side and restored on a new device.

CREATE TABLE IF NOT EXISTS users (
  id                 TEXT PRIMARY KEY,
  email              TEXT NOT NULL UNIQUE,          -- normalised to lowercase
  created_at         INTEGER NOT NULL,              -- epoch seconds
  plan               TEXT NOT NULL DEFAULT 'free',  -- 'free' | 'premium'
  plan_granted_at    INTEGER,
  stripe_customer_id TEXT,
  reminders_opt_in   INTEGER NOT NULL DEFAULT 0,
  last_seen_at       INTEGER
);

-- Single-use, short-lived sign-in links. Only the hash is stored, so a leaked
-- database row cannot be replayed as a login.
CREATE TABLE IF NOT EXISTS login_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at    INTEGER,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS login_tokens_expires ON login_tokens (expires_at);

-- One row per completed Stripe Checkout session. The primary key is Stripe's
-- own session id, which makes webhook replay a no-op rather than a bug.
-- `user_id` is nullable and detaches rather than cascading: deleting an
-- account must remove the person, not the record that money changed hands.
-- A cascade here would quietly destroy the financial record the Privacy
-- Policy promises to keep (unlinked) and that a chargeback needs.
CREATE TABLE IF NOT EXISTS purchases (
  id             TEXT PRIMARY KEY,
  user_id        TEXT,
  amount_total   INTEGER,
  currency       TEXT,
  livemode       INTEGER NOT NULL DEFAULT 0,
  created_at     INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS purchases_user ON purchases (user_id);

-- Product analytics. Counts only: an allow-listed event name, the day, and a
-- couple of non-identifying properties. No user id, no IP, no personal data.
CREATE TABLE IF NOT EXISTS events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  day        TEXT NOT NULL,
  props      TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS events_day_name ON events (day, name);

-- Queued reminder emails. The subject and body are composed by the client from
-- task titles the user chose to be reminded about; nothing else is stored.
CREATE TABLE IF NOT EXISTS reminders (
  id       TEXT PRIMARY KEY,
  user_id  TEXT NOT NULL,
  send_at  INTEGER NOT NULL,
  subject  TEXT NOT NULL,
  body     TEXT NOT NULL,
  sent_at  INTEGER,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS reminders_due ON reminders (sent_at, send_at);

-- Fixed-window rate limiting for the endpoints that send email or cost money.
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket       TEXT PRIMARY KEY,
  count        INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);
