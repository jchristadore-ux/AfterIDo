-- Plan sync + document vault metadata.
--
-- Deliberate change from migrations/0001_init.sql:
-- That migration said D1 does NOT hold names, addresses, or documents, because
-- the plan lived only in the browser. Once an account exists, checklist and
-- profile JSON now sync to `user_plans` so Premium and progress restore on a
-- new device. Uploaded file *bytes* never land in D1 — only metadata here, with
-- bytes in the R2 DOCUMENTS bucket under a key scoped to the account.
--
-- Still never collected or stored, anywhere: Social Security numbers, driver's
-- licence numbers, bank/card account numbers, or passwords.

CREATE TABLE IF NOT EXISTS user_plans (
  user_id    TEXT PRIMARY KEY,
  state_json TEXT NOT NULL,
  revision   INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_documents (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  r2_key       TEXT NOT NULL UNIQUE,
  file_name    TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_size    INTEGER NOT NULL,
  kind_id      TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS user_documents_user ON user_documents (user_id);
