-- Three gaps found in the pre-launch audit, each of which needed a column.
--
-- 1. `purchases.payment_intent` — refunds could not find the customer.
--    Revocation matched on `users.stripe_customer_id`, but Stripe's one-time
--    Checkout does not create a Customer unless asked, so that column was
--    usually NULL and a refunded customer silently kept Premium. Checkout now
--    asks for a Customer, and the payment intent is stored as a second, always
--    present way to get from a `charge.refunded` event back to the account.
--
-- 2. `reminders.attempts` — a reminder email that failed to send was marked
--    sent anyway and disappeared. Failures are now counted and retried on the
--    next hourly sweep, and only given up on after several tries.
--
-- 3. `users.session_version` — signing out cleared the cookie in one browser
--    and nothing else. Session cookies now carry this number and are rejected
--    when it no longer matches, which is what makes "sign out everywhere"
--    possible for someone whose email inbox has been compromised.
--
-- All three are additive with constant defaults, so applying this to a live
-- database rewrites nothing and cannot fail partway.

ALTER TABLE purchases ADD COLUMN payment_intent TEXT;
CREATE INDEX IF NOT EXISTS purchases_payment_intent ON purchases (payment_intent);

ALTER TABLE reminders ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;

ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0;
