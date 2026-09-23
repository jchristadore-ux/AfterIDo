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
  /** D1: accounts, entitlements, synced plan JSON, document metadata. */
  DB?: D1Database;
  /**
   * R2 bucket for Premium document vault bytes. Keys are `{userId}/{docId}`.
   * Absent → `/api/config` reports `documents: false` and the client keeps
   * session-only storage.
   */
  DOCUMENTS?: R2Bucket;

  // ── Secrets ──────────────────────────────────────────────────────────────
  /** HMAC key for session cookies. Rotating it signs everyone out. */
  SESSION_SECRET?: string;
  /** Stripe API key. `sk_test_…` in test mode, `sk_live_…` in production. */
  STRIPE_SECRET_KEY?: string;
  /** `whsec_…` — the signing secret for the checkout webhook endpoint. */
  STRIPE_WEBHOOK_SECRET?: string;
  /** Required for accounts. Without it a sign-in link cannot be delivered. */
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

  /**
   * Local development only. `"true"` lets the sign-in endpoint hand the link
   * straight back in its response instead of emailing it.
   *
   * ── Why this needs a switch of its own ────────────────────────────────────
   * Returning the link is the same thing as returning a password. Anyone who
   * can POST an email address gets a working session for that account. It was
   * previously inferred from "no mail provider configured", which meant a
   * production deployment that had not finished its email setup handed out
   * other people's accounts to anyone who asked. Inferring a development
   * environment from a missing secret is not safe; this has to be deliberate.
   *
   * Never set this in production. `accountsEnabled` treats it as an
   * alternative to real mail *only* so the flow can be exercised locally.
   */
  ALLOW_DEV_SIGNIN_LINKS?: string;
}

/** How Stripe is configured on this deployment — never guess from a missing key. */
export type StripeMode = 'absent' | 'test' | 'live';

export interface PublicConfig {
  /** True when accounts can be created (database + session secret present). */
  accounts: boolean;
  /**
   * True when signed-in Premium users can upload vault files to R2.
   * Requires accounts plus the DOCUMENTS R2 binding.
   */
  documents: boolean;
  /** True when a real Stripe Checkout session can be created and verified. */
  payments: boolean;
  /**
   * True only when a real `sk_test_…` key is installed.
   * Absent or malformed keys are NOT test mode — see `stripeMode`.
   */
  testMode: boolean;
  /**
   * Distinguishes "no Stripe key", "test key", and "live key".
   * Use this for operator readiness; use `testMode` for the customer-facing banner.
   */
  stripeMode: StripeMode;
  /** True when reminder emails can actually be delivered. */
  email: boolean;
  priceLabel: string;
  supportEmail: string;
}

export function emailEnabled(env: Env): boolean {
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
}

/** See `Env.ALLOW_DEV_SIGNIN_LINKS`. Deliberately an exact string match. */
export function devSignInLinksAllowed(env: Env): boolean {
  return env.ALLOW_DEV_SIGNIN_LINKS === 'true';
}

/**
 * Can a sign-in link actually reach the person who asked for it?
 *
 * Either real mail is configured, or somebody has explicitly opted into the
 * development shortcut. If neither is true there is no safe way to sign anyone
 * in, and accounts stay switched off rather than half-working.
 */
export function signInDeliverable(env: Env): boolean {
  return emailEnabled(env) || devSignInLinksAllowed(env);
}

/**
 * Accounts need a place to store them, a key to sign sessions with, and a way
 * to deliver the sign-in link.
 *
 * The third condition is the one that is easy to leave out and expensive to
 * get wrong: an account system that cannot email you is an account system
 * whose only remaining way to let you in is to tell the caller the secret. The
 * app is honest about being unable to do accounts here, which the UI already
 * renders properly, rather than opening a door it cannot close.
 */
export function accountsEnabled(env: Env): boolean {
  return Boolean(
    env.DB && env.SESSION_SECRET && env.SESSION_SECRET.length >= 32 && signInDeliverable(env),
  );
}

/**
 * Stripe has two ids that look alike and are easy to confuse in the dashboard:
 * a **Product** (`prod_…`) is the thing you sell, a **Price** (`price_…`) is
 * what it costs. Checkout needs the Price. A Product id here gets as far as
 * Stripe and comes back as an error, which surfaces to a customer as a broken
 * Buy button — so it is treated as "not configured" instead, and the UI says
 * Premium isn't for sale rather than offering something that cannot work.
 */
export function hasValidPriceId(env: Env): boolean {
  return Boolean(env.STRIPE_PRICE_ID?.startsWith('price_'));
}

/**
 * Payments require all three: a key to create the session, a valid price to
 * charge, and a webhook secret to verify the result. Two out of three would let
 * us take money we could not verify, so the feature stays off.
 *
 * `accountsEnabled` is a precondition, which now also means mail must work —
 * correctly so. Selling a purchase that has to survive a new phone, to someone
 * we cannot send a sign-in link or a receipt to, is selling something we cannot
 * deliver.
 */
export function paymentsEnabled(env: Env): boolean {
  return Boolean(
    accountsEnabled(env) &&
      env.STRIPE_SECRET_KEY &&
      hasValidPriceId(env) &&
      env.STRIPE_WEBHOOK_SECRET,
  );
}

/**
 * Classify the Stripe secret key without treating "missing" as "test".
 *
 * Previously `testMode` was `!key.startsWith('sk_live_')`, so a deployment with
 * no key at all reported testMode true — the same signal as a deliberate test
 * install. Operators and the UI need to tell those apart.
 */
export function stripeModeOf(env: Env): StripeMode {
  const key = env.STRIPE_SECRET_KEY?.trim() ?? '';
  if (!key) return 'absent';
  if (key.startsWith('sk_live_')) return 'live';
  if (key.startsWith('sk_test_')) return 'test';
  return 'absent';
}

/**
 * Document vault needs accounts (so we know whose objects they are) and an R2
 * binding. Without the bucket the feature stays off rather than half-working.
 */
export function documentsEnabled(env: Env): boolean {
  return Boolean(accountsEnabled(env) && env.DOCUMENTS);
}

export function publicConfig(env: Env): PublicConfig {
  const mode = stripeModeOf(env);
  return {
    accounts: accountsEnabled(env),
    documents: documentsEnabled(env),
    payments: paymentsEnabled(env),
    testMode: mode === 'test',
    stripeMode: mode,
    email: emailEnabled(env),
    priceLabel: env.PRICE_LABEL || '$19.99',
    supportEmail: env.SUPPORT_EMAIL || '',
  };
}

/**
 * Why a capability is off, for the logs.
 *
 * The browser gets capabilities; the operator gets the reason. Keeping the two
 * apart means a misconfiguration is diagnosable without describing our own gaps
 * to whoever is probing the endpoint.
 */
export function configWarnings(env: Env): string[] {
  const warnings: string[] = [];
  if (!env.DB) warnings.push('DB binding is missing — accounts and analytics are off.');
  if (accountsEnabled(env) && !env.DOCUMENTS) {
    warnings.push('DOCUMENTS R2 binding is missing — document vault uploads stay session-only.');
  }
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    warnings.push('SESSION_SECRET is missing or shorter than 32 characters — accounts are off.');
  }
  if (!signInDeliverable(env)) {
    warnings.push(
      'RESEND_API_KEY is not set, so a sign-in link cannot be delivered — accounts are off. ' +
        'Set it in Cloudflare (Workers & Pages → afterido → Settings → Variables and Secrets).',
    );
  }
  if (devSignInLinksAllowed(env)) {
    warnings.push(
      'ALLOW_DEV_SIGNIN_LINKS is "true". Sign-in links are returned in the API response. ' +
        'This is for local development only and must never be set on a public deployment.',
    );
  }
  if (env.STRIPE_PRICE_ID && !hasValidPriceId(env)) {
    warnings.push(
      'STRIPE_PRICE_ID is not a Price id (expected "price_…", got a Product id?) — payments are off.',
    );
  }
  const mode = stripeModeOf(env);
  if (mode === 'absent') {
    warnings.push('STRIPE_SECRET_KEY is missing or not sk_test_/sk_live_ — Stripe is absent.');
  } else if (mode === 'test') {
    warnings.push('STRIPE_SECRET_KEY is a test key — real customers must not pay on this deployment.');
  }
  if (!env.STRIPE_WEBHOOK_SECRET) {
    warnings.push('STRIPE_WEBHOOK_SECRET is not set — payments are off.');
  }
  return warnings;
}

export function originOf(env: Env, request: Request): string {
  if (env.PUBLIC_ORIGIN) return env.PUBLIC_ORIGIN.replace(/\/$/, '');
  return new URL(request.url).origin;
}
