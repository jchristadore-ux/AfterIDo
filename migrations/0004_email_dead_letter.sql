-- Reminder emails that exhausted their retry allowance.
--
-- `reminders.attempts` (migration 0002) already stops the hourly sweep from
-- retrying forever. This table is the operator-visible trail: one row per
-- reminder the first time it crosses the max-attempt threshold, so a dead
-- address cannot fill the batch every hour and so support gets a single alert
-- rather than one per sweep. The row holds a redacted-friendly summary only —
-- never the reminder body (which can contain task notes) and never a magic
-- link.

CREATE TABLE IF NOT EXISTS email_dead_letters (
  reminder_id TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  subject     TEXT NOT NULL,
  last_error  TEXT,
  attempts    INTEGER NOT NULL,
  created_at  INTEGER NOT NULL,
  FOREIGN KEY (reminder_id) REFERENCES reminders (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS email_dead_letters_created ON email_dead_letters (created_at);
