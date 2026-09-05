/**
 * AfterIDo's API.
 *
 * ── What lives here and why ───────────────────────────────────────────────
 * The app is a static SPA; the only reason a server exists at all is that two
 * things cannot be done honestly in a browser: taking a payment, and deciding
 * whether somebody has paid. Everything else — her name, her address, her
 * marriage details, her progress — stays in her own browser and never reaches
 * this code.
 *
 * ── The rule that shapes the design ───────────────────────────────────────
 * Premium is granted in exactly two places, and both of them ask Stripe rather
 * than the browser: a signature-verified webhook, and a direct read-back of
 * the Checkout Session. There is no request a client can make that says "I
 * paid" and is believed.
 */
import type { Env } from './env.ts';
import {
  accountsEnabled,
  configWarnings,
  devSignInLinksAllowed,
  emailEnabled,
  originOf,
  paymentsEnabled,
  publicConfig,
} from './env.ts';
import {
  clearCookie,
  fail,
  getCookie,
  json,
  nowSeconds,
  readJson,
  redirect,
  sameOrigin,
  setCookie,
} from './http.ts';
import { randomToken, signSession, verifySession } from './crypto.ts';
import {
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
  purgeExpiredLoginTokens,
  purgeOldEvents,
  purgeRateLimits,
  rateLimit,
  recordEvent,
  redeemLoginToken,
  replaceReminders,
  revokePremium,
  setRemindersOptIn,
  storeLoginToken,
  touchUser,
  type UserRow,
} from './db.ts';
import { createCheckoutSession, retrieveCheckoutSession, verifyWebhook } from './stripe.ts';
import { receiptEmail, sendEmail, signInEmail } from './email.ts';
import { robots, sitemap, withPageMeta } from './seo.ts';

const SESSION_COOKIE = 'afterido_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = originOf(env, request);

    if (!url.pathname.startsWith('/api/')) {
      if (url.pathname === '/robots.txt') {
        return new Response(robots(origin), {
          headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'max-age=3600' },
        });
      }
      if (url.pathname === '/sitemap.xml') {
        return new Response(sitemap(origin), {
          headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'max-age=3600' },
        });
      }

      // Static assets and client-side routes. `not_found_handling` in
      // wrangler.jsonc turns unknown paths into index.html so deep links work;
      // HTML then gets this route's title and link-preview tags swapped in.
      const asset = await env.ASSETS.fetch(request);
      const type = asset.headers.get('content-type') ?? '';
      return type.includes('text/html') ? withPageMeta(asset, url, origin) : asset;
    }

    try {
      return await route(request, env, ctx, url);
    } catch (error) {
      // Log for us, say nothing useful to a prober.
      console.log(`[api:error] ${url.pathname} ${(error as Error)?.message ?? 'unknown'}`);
      return fail(500, 'server_error', 'Something went wrong on our end. Please try again.');
    }
  },

  /** Hourly: send reminder emails that have come due, then tidy up. */
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      runReminderSweep(env).catch((error) => {
        console.log(`[cron:error] ${(error as Error)?.message ?? 'unknown'}`);
      }),
    );
  },
};

async function route(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  url: URL,
): Promise<Response> {
  const path = url.pathname;
  const method = request.method;

  // The webhook is authenticated by signature and has no Origin header, so it
  // is checked before the same-origin gate below.
  if (path === '/api/stripe/webhook' && method === 'POST') return handleWebhook(request, env);

  if (path === '/api/config' && method === 'GET') {
    // Says why a capability is off, in the logs rather than the response — the
    // browser gets capabilities, not a description of our misconfiguration.
    for (const warning of configWarnings(env)) console.log(`[config] ${warning}`);
    return json(publicConfig(env));
  }

  if (path === '/api/auth/callback' && method === 'GET') return handleCallback(request, env, url);

  // Analytics is exempt: it carries no session, changes nothing a forged
  // request could exploit, and `navigator.sendBeacon` does not always attach
  // an Origin header. It is rate limited by IP instead.
  if (path === '/api/events' && method === 'POST') return handleEvent(request, env, ctx);

  // Every remaining state-changing request is cookie-authenticated, so it must
  // come from our own origin.
  if (method !== 'GET' && !sameOrigin(request, originOf(env, request))) {
    return fail(403, 'bad_origin', 'This request did not come from AfterIDo.');
  }

  switch (`${method} ${path}`) {
    case 'POST /api/auth/request-link':
      return handleRequestLink(request, env, ctx);
    case 'POST /api/auth/signout':
      return handleSignOut(request);
    case 'POST /api/auth/signout-all':
      return handleSignOutEverywhere(request, env);
    case 'GET /api/me':
      return handleMe(request, env);
    case 'POST /api/checkout':
      return handleCheckout(request, env);
    case 'POST /api/checkout/confirm':
      return handleConfirmCheckout(request, env);
    case 'PUT /api/reminders':
      return handleReminders(request, env);
    case 'DELETE /api/account':
      return handleDeleteAccount(request, env);
    default:
      return fail(404, 'not_found', 'No such endpoint.');
  }
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

function isSecureRequest(request: Request): boolean {
  return new URL(request.url).protocol === 'https:';
}

/**
 * The signed-in account, or null.
 *
 * Three things have to hold, not two: the cookie's signature must verify, it
 * must not have expired, and its session version must still match the account's.
 * That last check is what makes "sign out everywhere" real — without it, a
 * cookie copied off a compromised device stays valid for its full ninety days no
 * matter what the owner does.
 */
async function currentUser(request: Request, env: Env): Promise<UserRow | null> {
  if (!accountsEnabled(env)) return null;
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const claims = await verifySession(env.SESSION_SECRET as string, token);
  if (!claims) return null;

  const user = await findUserById(env.DB as D1Database, claims.sub);
  if (!user) return null;
  if ((claims.v ?? 0) !== (user.session_version ?? 0)) return null;
  return user;
}

function userPayload(user: UserRow) {
  return {
    email: user.email,
    plan: user.plan,
    remindersOptIn: user.reminders_opt_in === 1,
    premiumSince: user.plan_granted_at,
  };
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * Sends a sign-in link, creating the account if this address hasn't been seen.
 *
 * The response is identical whether or not the address already has an account.
 * Telling a caller "no such user" would turn this endpoint into a way to test
 * whether a given person uses AfterIDo, which is not ours to disclose.
 *
 * ── The link is never in the response ─────────────────────────────────────
 * It goes to the inbox and nowhere else. Handing it back to the caller would
 * mean anyone who can type an email address into this endpoint gets a working
 * session for that account, which is the whole of the authentication system.
 * The one exception is a local deployment that has explicitly set
 * ALLOW_DEV_SIGNIN_LINKS, and `accountsEnabled` will not return true in
 * production without real mail configured — so on a public deployment this
 * branch is unreachable rather than merely unused.
 */
async function handleRequestLink(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  if (!accountsEnabled(env)) {
    return fail(503, 'accounts_unavailable', 'Accounts are not enabled on this deployment.');
  }
  const db = env.DB as D1Database;

  const body = await readJson<{ email?: string; next?: string }>(request);
  const email = normaliseEmail(body?.email ?? '');
  if (!isPlausibleEmail(email)) {
    return fail(400, 'invalid_email', 'That does not look like an email address.');
  }

  // Two limits: one so a single address can't be mail-bombed, one so a single
  // network can't spray links at many addresses.
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const withinAddressLimit = await rateLimit(db, `link:email:${email}`, 5, 3600);
  const withinIpLimit = await rateLimit(db, `link:ip:${ip}`, 20, 3600);
  if (!withinAddressLimit || !withinIpLimit) {
    return fail(429, 'rate_limited', 'Too many sign-in links requested. Try again in an hour.');
  }

  const user = await findOrCreateUser(db, email);
  const token = randomToken(32);
  await storeLoginToken(db, user.id, token);

  const origin = originOf(env, request);
  const next = safeNextPath(body?.next);
  const link = `${origin}/api/auth/callback?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`;

  ctx.waitUntil(
    sendEmail(env, { to: email, ...signInEmail(link, env.SUPPORT_EMAIL || '') }).then(() =>
      recordEvent(db, 'account_link_requested', null),
    ),
  );

  // Local development only, and only when someone has deliberately switched it
  // on. `accountsEnabled` already refuses to run an account system that cannot
  // deliver mail, so a public deployment never reaches the true branch.
  const showLinkLocally = devSignInLinksAllowed(env) && !emailEnabled(env);

  return json({
    ok: true,
    delivery: emailEnabled(env) ? 'email' : 'dev-link',
    devLink: showLinkLocally ? link : undefined,
  });
}

/**
 * Only same-site, absolute-path destinations.
 *
 * `//evil.com` is a protocol-relative URL, and several browsers normalise a
 * backslash to a slash — so `/\evil.com` is the same attack wearing a hat.
 * Both are rejected, along with anything that isn't a plain path.
 */
function safeNextPath(next: string | undefined): string {
  if (!next || next.length > 512) return '/app';
  if (!next.startsWith('/')) return '/app';
  if (next[1] === '/' || next[1] === '\\') return '/app';
  return next;
}

async function handleCallback(request: Request, env: Env, url: URL): Promise<Response> {
  if (!accountsEnabled(env)) return redirect('/');
  const db = env.DB as D1Database;

  const token = url.searchParams.get('token');
  const next = safeNextPath(url.searchParams.get('next') ?? undefined);
  if (!token) return redirect('/sign-in?error=missing');

  const userId = await redeemLoginToken(db, token);
  if (!userId) return redirect('/sign-in?error=expired');

  await touchUser(db, userId);
  const user = await findUserById(db, userId);
  const session = await signSession(env.SESSION_SECRET as string, {
    sub: userId,
    exp: nowSeconds() + SESSION_TTL_SECONDS,
    v: user?.session_version ?? 0,
  });

  await recordEvent(db, 'account_signed_in', null);

  return redirect(next, {
    'Set-Cookie': setCookie(SESSION_COOKIE, session, {
      maxAge: SESSION_TTL_SECONDS,
      secure: isSecureRequest(request),
    }),
  });
}

function handleSignOut(request: Request): Response {
  return json(
    { ok: true },
    { headers: { 'Set-Cookie': clearCookie(SESSION_COOKIE, isSecureRequest(request)) } },
  );
}

/**
 * Signs out every device, not just this one.
 *
 * The ordinary sign-out clears a cookie in the browser that asked, which is no
 * use to somebody whose email inbox has been read by someone else — the other
 * session is in a browser we cannot reach. Bumping the account's session
 * version invalidates every cookie ever issued to it, including the one making
 * this request, which is why it clears the local cookie too.
 */
async function handleSignOutEverywhere(request: Request, env: Env): Promise<Response> {
  const user = await currentUser(request, env);
  if (!user) return fail(401, 'signed_out', 'Not signed in.');

  await bumpSessionVersion(env.DB as D1Database, user.id);

  return json(
    { ok: true },
    { headers: { 'Set-Cookie': clearCookie(SESSION_COOKIE, isSecureRequest(request)) } },
  );
}

async function handleMe(request: Request, env: Env): Promise<Response> {
  const user = await currentUser(request, env);
  if (!user) return fail(401, 'signed_out', 'Not signed in.');
  return json(userPayload(user));
}

async function handleDeleteAccount(request: Request, env: Env): Promise<Response> {
  const user = await currentUser(request, env);
  if (!user) return fail(401, 'signed_out', 'Not signed in.');
  const db = env.DB as D1Database;

  // Purchases are kept, unlinked, because payment records have their own
  // retention obligations; everything that identifies her is removed. The
  // detach is explicit rather than left to the FK, so it is visible here that
  // the row survives.
  await db.batch([
    db.prepare('DELETE FROM login_tokens WHERE user_id = ?').bind(user.id),
    db.prepare('DELETE FROM reminders WHERE user_id = ?').bind(user.id),
    db.prepare('UPDATE purchases SET user_id = NULL WHERE user_id = ?').bind(user.id),
    db.prepare('DELETE FROM users WHERE id = ?').bind(user.id),
  ]);

  return json(
    { ok: true },
    { headers: { 'Set-Cookie': clearCookie(SESSION_COOKIE, isSecureRequest(request)) } },
  );
}

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

async function handleCheckout(request: Request, env: Env): Promise<Response> {
  if (!paymentsEnabled(env)) {
    return fail(503, 'payments_unavailable', 'Payments are not enabled on this deployment.');
  }
  const db = env.DB as D1Database;

  const user = await currentUser(request, env);
  if (!user) return fail(401, 'signed_out', 'Sign in before buying Premium.');
  if (user.plan === 'premium') {
    return fail(409, 'already_premium', 'You already have Premium on this account.');
  }

  if (!(await rateLimit(db, `checkout:${user.id}`, 10, 3600))) {
    return fail(429, 'rate_limited', 'Too many checkout attempts. Try again shortly.');
  }

  const origin = originOf(env, request);
  const session = await createCheckoutSession({
    secretKey: env.STRIPE_SECRET_KEY as string,
    priceId: env.STRIPE_PRICE_ID as string,
    userId: user.id,
    email: user.email,
    successUrl: `${origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/premium?checkout=cancelled`,
  });

  await recordEvent(db, 'checkout_started', null);
  return json({ url: session.url });
}

/**
 * Settles the success redirect.
 *
 * Stripe's webhook is the authority, but it can arrive a second or two after
 * the browser does. Rather than show a paid customer a locked app while we
 * wait, we read the session back from Stripe directly. The browser's claim is
 * still not trusted: the session id is only a lookup key, and both the payment
 * status and the owning user come from Stripe's response.
 */
async function handleConfirmCheckout(request: Request, env: Env): Promise<Response> {
  if (!paymentsEnabled(env)) {
    return fail(503, 'payments_unavailable', 'Payments are not enabled on this deployment.');
  }
  const db = env.DB as D1Database;

  const user = await currentUser(request, env);
  if (!user) return fail(401, 'signed_out', 'Sign in to confirm your purchase.');
  if (user.plan === 'premium') return json(userPayload(user));

  const body = await readJson<{ sessionId?: string }>(request);
  const sessionId = body?.sessionId;
  if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    return fail(400, 'invalid_session', 'That is not a valid checkout session.');
  }
  if (!(await rateLimit(db, `confirm:${user.id}`, 30, 3600))) {
    return fail(429, 'rate_limited', 'Too many attempts. Try again shortly.');
  }

  const session = await retrieveCheckoutSession(env.STRIPE_SECRET_KEY as string, sessionId);
  if (!session) return fail(404, 'session_not_found', 'We could not find that checkout session.');

  // The session must be paid AND belong to the signed-in user. Without the
  // second test, anyone could paste somebody else's session id.
  const paid = session.payment_status === 'paid';
  const ownedByCaller = session.client_reference_id === user.id;
  if (!paid || !ownedByCaller) {
    return fail(402, 'not_paid', 'That payment has not completed yet.');
  }

  await grantPremium(db, {
    userId: user.id,
    sessionId,
    amountTotal: typeof session.amount_total === 'number' ? session.amount_total : null,
    currency: typeof session.currency === 'string' ? session.currency : null,
    livemode: session.livemode === true,
    stripeCustomerId: stripeIdOf(session.customer),
    paymentIntentId: stripeIdOf(session.payment_intent),
  });
  await recordEvent(db, 'purchase_completed', null);

  const updated = await findUserById(db, user.id);
  return json(updated ? userPayload(updated) : { email: user.email, plan: 'premium' });
}

/**
 * The Stripe webhook — the authoritative grant.
 *
 * Note the order: the raw body is read first and verified before anything is
 * parsed or acted on. An unverified body is never allowed to reach the
 * database, and a bad signature returns 400 without a hint as to why.
 */
async function handleWebhook(request: Request, env: Env): Promise<Response> {
  if (!paymentsEnabled(env)) return fail(503, 'payments_unavailable', 'Payments are not enabled.');
  const db = env.DB as D1Database;

  const rawBody = await request.text();
  const event = await verifyWebhook(
    rawBody,
    request.headers.get('Stripe-Signature'),
    env.STRIPE_WEBHOOK_SECRET as string,
  );
  if (!event) return fail(400, 'bad_signature', 'Signature verification failed.');

  const object = event.data.object;

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    if (object.payment_status !== 'paid') return json({ received: true });

    const user = await userForStripeObject(db, object);
    if (!user) {
      console.log(`[webhook] no matching user for session ${String(object.id)}`);
      return json({ received: true });
    }

    await grantPremium(db, {
      userId: user.id,
      sessionId: String(object.id),
      amountTotal: typeof object.amount_total === 'number' ? object.amount_total : null,
      currency: typeof object.currency === 'string' ? object.currency : null,
      livemode: event.livemode,
      stripeCustomerId: stripeIdOf(object.customer),
      paymentIntentId: stripeIdOf(object.payment_intent),
    });
    await recordEvent(db, 'purchase_completed', null);

    const origin = originOf(env, request);
    await sendEmail(env, {
      to: user.email,
      ...receiptEmail(env.PRICE_LABEL || '$19.99', `${origin}/app`, env.SUPPORT_EMAIL || ''),
    });
    return json({ received: true });
  }

  // A refund or a won dispute takes the entitlement back. Without this the
  // only way to reverse a purchase would be editing the database by hand.
  if (event.type === 'charge.refunded' || event.type === 'charge.dispute.closed') {
    // Only a full refund or a dispute we lost takes the entitlement back. A
    // partial refund — a goodwill gesture, say — must not silently lock
    // somebody out of what they still paid for.
    const fullyRefunded =
      event.type === 'charge.refunded' &&
      typeof object.amount === 'number' &&
      object.amount_refunded === object.amount;
    const disputeLost = event.type === 'charge.dispute.closed' && object.status === 'lost';

    if (!fullyRefunded && !disputeLost) return json({ received: true });

    // A dispute carries the charge it is about; a refunded charge is the object
    // itself. Either way we want the charge's customer and payment intent,
    // because those are the two things that lead back to an account.
    const charge = (
      event.type === 'charge.dispute.closed' && isRecord(object.charge) ? object.charge : object
    ) as Record<string, unknown>;

    const user = await findUserForCharge(db, {
      customerId: stripeIdOf(charge.customer) ?? stripeIdOf(object.customer),
      paymentIntentId: stripeIdOf(charge.payment_intent) ?? stripeIdOf(object.payment_intent),
    });

    if (user) {
      await revokePremium(db, user.id);
    } else {
      // Worth knowing about: money has gone back and the entitlement has not.
      // Better a line in the log than a silent no-op nobody can explain later.
      console.log(
        `[webhook] ${event.type}: no matching account for charge ${String(charge.id ?? object.id)} — Premium NOT revoked`,
      );
    }
    return json({ received: true });
  }

  return json({ received: true });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Stripe fields hold either an id or, when expanded, the whole object. Both
 * shapes appear across the events we subscribe to, so every read goes through
 * here rather than assuming one of them.
 */
function stripeIdOf(value: unknown): string | null {
  if (typeof value === 'string' && value) return value;
  if (isRecord(value) && typeof value.id === 'string' && value.id) return value.id;
  return null;
}

/**
 * Finds the account a Stripe object belongs to.
 *
 * `client_reference_id` is our own user id, put there when the session was
 * created, and is the reliable link. The email fallback covers a payment made
 * through a Payment Link, where there is no reference id to carry.
 */
async function userForStripeObject(
  db: D1Database,
  object: Record<string, unknown>,
): Promise<UserRow | null> {
  const reference = object.client_reference_id;
  if (typeof reference === 'string' && reference) {
    const byId = await findUserById(db, reference);
    if (byId) return byId;
  }

  const details = object.customer_details as { email?: string } | undefined;
  const email = details?.email ?? (object.customer_email as string | undefined);
  if (typeof email === 'string' && email) {
    return findOrCreateUser(db, normaliseEmail(email));
  }
  return null;
}

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------

interface ReminderInput {
  sendAt?: number;
  subject?: string;
  body?: string;
}

/**
 * Replaces the user's pending reminders with the set the client just computed.
 *
 * Premium-gated server-side, not just in the UI: a free account POSTing here
 * directly gets a 402.
 */
async function handleReminders(request: Request, env: Env): Promise<Response> {
  const user = await currentUser(request, env);
  if (!user) return fail(401, 'signed_out', 'Sign in to set reminders.');
  if (user.plan !== 'premium') {
    return fail(402, 'premium_required', 'Email reminders are a Premium feature.');
  }
  const db = env.DB as D1Database;

  const body = await readJson<{ optIn?: boolean; reminders?: ReminderInput[] }>(request);
  if (!body) return fail(400, 'invalid_body', 'Expected a JSON body.');

  const optIn = body.optIn === true;
  await setRemindersOptIn(db, user.id, optIn);

  const now = nowSeconds();
  const cleaned = (body.reminders ?? [])
    .filter((r): r is Required<ReminderInput> =>
      typeof r.sendAt === 'number' &&
      Number.isFinite(r.sendAt) &&
      r.sendAt > now &&
      r.sendAt < now + 60 * 60 * 24 * 365 &&
      typeof r.subject === 'string' &&
      typeof r.body === 'string',
    )
    .map((r) => ({
      sendAt: Math.floor(r.sendAt),
      subject: r.subject.slice(0, 200),
      body: r.body.slice(0, 2000),
    }));

  await replaceReminders(db, user.id, optIn ? cleaned : []);
  return json({ ok: true, scheduled: optIn ? cleaned.length : 0 });
}

/**
 * The hourly sweep: send what has come due, then tidy up.
 *
 * Every step is isolated. One customer's undeliverable address used to be able
 * to throw and take the rest of the hour's reminders down with it — along with
 * the cleanup at the end, which then never ran at all. Now a failure is
 * recorded against the one reminder that caused it and the sweep carries on.
 */
async function runReminderSweep(env: Env): Promise<void> {
  if (!accountsEnabled(env)) return;
  const db = env.DB as D1Database;

  for (const reminder of await dueReminders(db)) {
    try {
      const user = await findUserById(db, reminder.user_id);
      if (!user || user.reminders_opt_in !== 1) {
        // She turned reminders off between queueing and now. Retire the row
        // rather than retrying it every hour until it ages out.
        await markReminderSent(db, reminder.id);
        continue;
      }

      const sent = await sendEmail(env, {
        to: user.email,
        subject: reminder.subject,
        text: `${reminder.body}\n\nYou set this reminder in AfterIDo. Turn reminders off any time in your profile.`,
      });

      // Only a confirmed send retires the row. Marking it sent regardless is
      // what used to turn a transient mail failure into a reminder she asked
      // for and never received, with nothing anywhere to say so.
      if (sent) await markReminderSent(db, reminder.id);
      else await markReminderFailed(db, reminder.id);
    } catch (error) {
      console.log(
        `[reminders] ${reminder.id} failed: ${(error as Error)?.message ?? 'unknown'}`,
      );
      try {
        await markReminderFailed(db, reminder.id);
      } catch {
        /* the next sweep will find it again */
      }
    }
  }

  for (const [name, task] of [
    ['login-tokens', () => purgeExpiredLoginTokens(db)],
    ['rate-limits', () => purgeRateLimits(db)],
    ['events', () => purgeOldEvents(db)],
  ] as const) {
    try {
      await task();
    } catch (error) {
      console.log(`[sweep] ${name} purge failed: ${(error as Error)?.message ?? 'unknown'}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

/**
 * Product analytics, allow-listed.
 *
 * Only these event names are accepted, and only these property keys, with
 * short values. No user id, no session id, no IP address, nothing typed by the
 * user. It answers "how many people finished onboarding today" and nothing
 * more personal than that.
 */
const ALLOWED_EVENTS = new Set([
  'landing_viewed',
  'onboarding_started',
  'onboarding_completed',
  'account_created',
  'premium_viewed',
  'checkout_started',
  'purchase_completed',
  'task_completed',
  'packet_printed',
  'letter_copied',
]);

const ALLOWED_PROP_KEYS = new Set(['category', 'step', 'plan', 'state']);

async function handleEvent(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (!env.DB) return json({ ok: true });
  const db = env.DB;

  const body = await readJson<{ name?: string; props?: Record<string, unknown> }>(request, 2048);
  const name = body?.name;
  if (typeof name !== 'string' || !ALLOWED_EVENTS.has(name)) {
    // Silently accepted so a stale client can't be made to retry forever.
    return json({ ok: true });
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (!(await rateLimit(db, `events:${ip}`, 300, 3600))) return json({ ok: true });

  const props: Record<string, string> = {};
  for (const [key, value] of Object.entries(body?.props ?? {})) {
    if (!ALLOWED_PROP_KEYS.has(key)) continue;
    if (typeof value !== 'string' && typeof value !== 'number') continue;
    props[key] = String(value).slice(0, 40);
  }

  ctx.waitUntil(recordEvent(db, name, Object.keys(props).length ? props : null));
  return json({ ok: true });
}
