/**
 * Post-deploy payment smoke test (Stripe TEST MODE only).
 *
 * Encodes the LAUNCH_GUIDE rule: if a full refund does not remove Premium,
 * do not go live. This script fails hard when revoke does not stick.
 *
 * Required env (never commit secrets):
 *   AFTERIDO_ORIGIN          e.g. https://after-i-do.com
 *   STRIPE_SECRET_KEY        sk_test_… (refuses sk_live_)
 *   STRIPE_WEBHOOK_SECRET    whsec_… for this deployment
 *   VERIFY_USER_ID           existing D1 user id (uuid) to grant/revoke
 *   AFTERIDO_SESSION_COOKIE  optional but recommended: full Cookie header
 *                            value for that user so /api/me can be checked
 *
 * Flow:
 *   1. GET /api/config → require payments + stripeMode/testMode test
 *   2. Build + POST signed checkout.session.completed webhook
 *   3. Confirm entitlement (via /api/me when cookie present)
 *   4. Build + POST signed charge.refunded webhook
 *   5. Confirm Premium is gone — FAIL if still premium
 *
 * Usage: npm run verify:payments
 */
import { createHmac, randomUUID } from 'node:crypto';

const ORIGIN = (process.env.AFTERIDO_ORIGIN ?? '').replace(/\/$/, '');
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? '';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';
const USER_ID = process.env.VERIFY_USER_ID ?? '';
const SESSION_COOKIE = process.env.AFTERIDO_SESSION_COOKIE ?? '';

function fail(message: string): never {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function ok(message: string) {
  console.log(`ok  ${message}`);
}

function requireEnv() {
  if (!ORIGIN) fail('AFTERIDO_ORIGIN is required');
  if (!STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    fail('STRIPE_SECRET_KEY must be a sk_test_ key (refusing live keys)');
  }
  if (!WEBHOOK_SECRET.startsWith('whsec_')) fail('STRIPE_WEBHOOK_SECRET must start with whsec_');
  if (!USER_ID) fail('VERIFY_USER_ID is required (existing D1 user id)');
}

function signWebhook(rawBody: string): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const expected = createHmac('sha256', WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  return `t=${timestamp},v1=${expected}`;
}

async function getConfig(): Promise<{
  payments: boolean;
  testMode: boolean;
  stripeMode?: string;
}> {
  const res = await fetch(`${ORIGIN}/api/config`);
  if (!res.ok) fail(`/api/config HTTP ${res.status}`);
  return (await res.json()) as { payments: boolean; testMode: boolean; stripeMode?: string };
}

async function postWebhook(event: Record<string, unknown>) {
  const rawBody = JSON.stringify(event);
  const res = await fetch(`${ORIGIN}/api/stripe/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Stripe-Signature': signWebhook(rawBody),
    },
    body: rawBody,
  });
  const text = await res.text();
  if (!res.ok) fail(`webhook ${String(event.type)} HTTP ${res.status}: ${text}`);
  ok(`webhook ${String(event.type)} accepted`);
}

async function readPlan(): Promise<'free' | 'premium' | 'unknown'> {
  if (!SESSION_COOKIE) return 'unknown';
  const res = await fetch(`${ORIGIN}/api/me`, {
    headers: { Cookie: SESSION_COOKIE },
  });
  if (res.status === 401) fail('/api/me returned 401 — AFTERIDO_SESSION_COOKIE is invalid');
  if (!res.ok) fail(`/api/me HTTP ${res.status}`);
  const body = (await res.json()) as { plan?: string };
  if (body.plan === 'premium' || body.plan === 'free') return body.plan;
  return 'unknown';
}

async function main() {
  requireEnv();

  const config = await getConfig();
  const mode = config.stripeMode ?? (config.testMode ? 'test' : 'absent');
  if (mode === 'live') {
    fail(`Deployment stripeMode=live. Refusing to run against live Stripe.`);
  }
  if (mode !== 'test') {
    fail(`Expected stripeMode=test (got ${mode}). Install sk_test_ on this deployment first.`);
  }
  if (!config.payments) fail('/api/config payments=false — enable test payments first');
  ok(`config payments=true stripeMode=${mode}`);

  const sessionId = `cs_test_verify_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
  const paymentIntentId = `pi_test_verify_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
  const chargeId = `ch_test_verify_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
  const customerId = `cus_test_verify_${randomUUID().replace(/-/g, '').slice(0, 14)}`;

  await postWebhook({
    id: `evt_verify_complete_${randomUUID()}`,
    type: 'checkout.session.completed',
    livemode: false,
    data: {
      object: {
        id: sessionId,
        object: 'checkout.session',
        client_reference_id: USER_ID,
        customer: customerId,
        customer_email: 'verify-payments@example.com',
        payment_intent: paymentIntentId,
        payment_status: 'paid',
        status: 'complete',
        amount_total: 1999,
        currency: 'usd',
        metadata: { user_id: USER_ID },
      },
    },
  });

  let plan = await readPlan();
  if (SESSION_COOKIE) {
    if (plan !== 'premium') fail(`Expected premium after checkout webhook (got ${plan})`);
    ok('entitlement granted (plan=premium)');
  } else {
    ok('checkout webhook posted (no SESSION_COOKIE — skip /api/me grant check)');
  }

  await postWebhook({
    id: `evt_verify_refund_${randomUUID()}`,
    type: 'charge.refunded',
    livemode: false,
    data: {
      object: {
        id: chargeId,
        object: 'charge',
        customer: customerId,
        payment_intent: paymentIntentId,
        refunded: true,
        amount_refunded: 1999,
        amount: 1999,
        currency: 'usd',
        metadata: { user_id: USER_ID },
      },
    },
  });

  plan = await readPlan();
  if (SESSION_COOKIE) {
    if (plan === 'premium') {
      fail(
        'LAUNCH RULE: full refund did NOT remove Premium. Do not go live. ' +
          'Fix revoke (charge.refunded / payment_intent matching) before accepting real customers.',
      );
    }
    if (plan !== 'free') fail(`Expected free after refund (got ${plan})`);
    ok('entitlement revoked after refund (plan=free)');
  } else {
    ok(
      'refund webhook posted (set AFTERIDO_SESSION_COOKIE to assert revoke via /api/me — required before go-live)',
    );
    console.warn(
      'WARN: without AFTERIDO_SESSION_COOKIE this script cannot prove revoke. ' +
        'Re-run with a session cookie before going live.',
    );
  }

  // Touch Stripe so a dead key fails early (does not create a real Checkout for a human).
  const stripeRes = await fetch('https://api.stripe.com/v1/balance', {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  });
  if (!stripeRes.ok) fail(`Stripe test key rejected HTTP ${stripeRes.status}`);
  ok('Stripe test key accepted by api.stripe.com');

  console.log('\nPASS: payment smoke completed.');
  if (!SESSION_COOKIE) {
    console.log('Note: re-run with AFTERIDO_SESSION_COOKIE to satisfy the full grant→revoke proof.');
    process.exitCode = 2; // soft fail: incomplete proof
  }
}

main().catch((err) => {
  fail(err instanceof Error ? err.message : String(err));
});
