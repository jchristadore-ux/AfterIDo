/**
 * Stripe, over plain `fetch`.
 *
 * The official SDK is a large dependency for two calls and a signature check,
 * and Stripe's REST API is stable and form-encoded. Doing it directly keeps
 * the Worker dependency-free.
 *
 * Card details never reach this application. The browser is redirected to
 * Stripe's own hosted Checkout page, enters the card there, and comes back
 * with nothing but a session id.
 */
import { hmacSha256Hex, timingSafeEqual } from './crypto.ts';

const API = 'https://api.stripe.com/v1';

async function stripeRequest(
  secretKey: string,
  path: string,
  body: URLSearchParams,
  idempotencyKey?: string,
): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  const response = await fetch(`${API}${path}`, { method: 'POST', headers, body });
  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    const error = payload.error as { message?: string; code?: string } | undefined;
    throw new StripeError(error?.message ?? 'Stripe request failed', error?.code);
  }
  return payload;
}

/**
 * Reads a Checkout Session back from Stripe.
 *
 * Used to settle the success redirect while the webhook is still in flight.
 * Note what is and is not trusted here: the browser supplies a session id, but
 * the payment status and the owning user come from Stripe's own response, so a
 * forged id simply fails to match.
 */
export async function retrieveCheckoutSession(
  secretKey: string,
  sessionId: string,
): Promise<Record<string, unknown> | null> {
  const response = await fetch(`${API}/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!response.ok) return null;
  return (await response.json()) as Record<string, unknown>;
}

export class StripeError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

/**
 * One-time payment, hosted Checkout.
 *
 * `client_reference_id` carries our own user id through Stripe and back in the
 * webhook, which is how the payment is tied to an account without trusting
 * anything the browser says on the way back.
 */
export async function createCheckoutSession(args: {
  secretKey: string;
  priceId: string;
  userId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; url: string }> {
  const body = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price]': args.priceId,
    'line_items[0][quantity]': '1',
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    client_reference_id: args.userId,
    customer_email: args.email,
    'metadata[user_id]': args.userId,
    allow_promotion_codes: 'true',

    // Stripe's default for a one-time payment is `if_required`, which for this
    // checkout means "never" — no Customer is created, `session.customer` comes
    // back null, and the column a refund later searches on is empty. The result
    // was a refund that took the money back and left the entitlement in place.
    // Asking for the Customer explicitly is what makes `charge.refunded`
    // resolvable; the payment intent recorded alongside it is the belt to this
    // brace, and covers purchases made before this line existed.
    customer_creation: 'always',
  });

  // Same user, same price → same session, even if she double-taps the button.
  const session = await stripeRequest(
    args.secretKey,
    '/checkout/sessions',
    body,
    `checkout_${args.userId}_${args.priceId}`,
  );

  const url = session.url;
  const id = session.id;
  if (typeof url !== 'string' || typeof id !== 'string') {
    throw new StripeError('Stripe did not return a checkout URL');
  }
  return { id, url };
}

// ---------------------------------------------------------------------------
// Webhook verification
// ---------------------------------------------------------------------------

export interface StripeEvent {
  id: string;
  type: string;
  livemode: boolean;
  data: { object: Record<string, unknown> };
}

/**
 * Verifies a `Stripe-Signature` header against the raw request body.
 *
 * This is the single most security-critical function in the app: it is the
 * only thing standing between "anyone on the internet can POST to our webhook"
 * and "premium is granted". Three things have to hold — the header parses, the
 * HMAC over `timestamp.body` matches a `v1` signature using a constant-time
 * comparison, and the timestamp is recent enough that a captured request can't
 * be replayed later.
 *
 * The body must be the exact bytes Stripe sent. Parsing and re-serialising the
 * JSON first would change the signature and break this.
 */
export async function verifyWebhook(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string,
  toleranceSeconds = 300,
): Promise<StripeEvent | null> {
  if (!signatureHeader) return null;

  let timestamp = '';
  const signatures: string[] = [];
  for (const part of signatureHeader.split(',')) {
    const [key, value] = part.split('=', 2);
    if (key?.trim() === 't') timestamp = value?.trim() ?? '';
    if (key?.trim() === 'v1' && value) signatures.push(value.trim());
  }
  if (!timestamp || signatures.length === 0) return null;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSeconds) return null;

  const expected = await hmacSha256Hex(webhookSecret, `${timestamp}.${rawBody}`);
  if (!signatures.some((candidate) => timingSafeEqual(candidate, expected))) return null;

  try {
    const event = JSON.parse(rawBody) as StripeEvent;
    if (typeof event.type !== 'string' || !event.data?.object) return null;
    return event;
  } catch {
    return null;
  }
}
