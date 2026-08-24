/**
 * The Worker's environment.
 *
 * Every secret arrives here from Cloudflare's secret store (`wrangler secret
 * put`) or from the dashboard. Nothing secret is committed, and nothing secret
 * is ever sent to the browser — `publicConfig()` below is the only thing the
 * client sees, and it reports capabilities rather than values.
 */
export interface Env {
  /** The built SPA in ./dist, served straight from the edge. */
  ASSETS: Fetcher;
  /** D1: accounts and entitlements only. See migrations/0001_init.sql. */
  DB?: D1Database;

  // ── Secrets ──────────────────────────────────────────────────────────────
  /** HMAC key for session cookies. Rotating it signs everyone out. */
  SESSION_SECRET?: string;
  /** Stripe API key. `sk_test_…` in test mode, `sk_live_…` in production. */
  STRIPE_SECRET_KEY?: string;
  /** `whsec_…` — the signing secret for the checkout webhook endpoint. */
  STRIPE_WEBHOOK_SECRET?: string;
  /** Optional. Without it, emails are logged instead of sent. */
  RESEND_API_KEY?: string;

  // ── Public vars ──────────────────────────────────────────────────────────
  /** e.g. https://afterido.com — used to build absolute links in emails. */
  PUBLIC_ORIGIN?: string;
  /** The Stripe Price for the one-time Premium purchase. */
  STRIPE_PRICE_ID?: string;
  /** From-address for transactional mail, e.g. "AfterIDo <hello@afterido.com>". */
  EMAIL_FROM?: string;
  SUPPORT_EMAIL?: string;
  PRICE_LABEL?: string;
}

export interface PublicConfig {
  /** True when accounts can be created (database + session secret present). */
  accounts: boolean;
  /** True when a real Stripe Checkout session can be created and verified. */
  payments: boolean;
  /** True when Stripe is in test mode — the UI says so, out loud. */
  testMode: boolean;
  /** True when reminder emails can actually be delivered. */
  email: boolean;
  priceLabel: string;
  supportEmail: string;
}

export function accountsEnabled(env: Env): boolean {
  return Boolean(env.DB && env.SESSION_SECRET && env.SESSION_SECRET.length >= 32);
}

/**
 * Payments require all three: a key to create the session, a price to charge,
 * and a webhook secret to verify the result. Two out of three would let us
 * take money we could not verify, so the feature stays off.
 */
export function paymentsEnabled(env: Env): boolean {
  return Boolean(
    accountsEnabled(env) &&
      env.STRIPE_SECRET_KEY &&
      env.STRIPE_PRICE_ID &&
      env.STRIPE_WEBHOOK_SECRET,
  );
}

export function emailEnabled(env: Env): boolean {
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
}

export function publicConfig(env: Env): PublicConfig {
  return {
    accounts: accountsEnabled(env),
    payments: paymentsEnabled(env),
    testMode: !env.STRIPE_SECRET_KEY?.startsWith('sk_live_'),
    email: emailEnabled(env),
    priceLabel: env.PRICE_LABEL || '$19.99',
    supportEmail: env.SUPPORT_EMAIL || '',
  };
}

export function originOf(env: Env, request: Request): string {
  if (env.PUBLIC_ORIGIN) return env.PUBLIC_ORIGIN.replace(/\/$/, '');
  return new URL(request.url).origin;
}
