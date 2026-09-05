/**
 * Cryptographic primitives, all from the Workers runtime's WebCrypto — no
 * dependencies, nothing to keep patched.
 */

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(message));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(message: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(message));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Constant-time string comparison. `a === b` leaks how many leading characters
 * matched through timing, which is enough to forge a signature one character
 * at a time given enough attempts.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function randomToken(bytes = 32): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export function randomId(prefix: string): string {
  return `${prefix}_${randomToken(12)}`;
}

// ---------------------------------------------------------------------------
// Signed, expiring tokens (used for the session cookie)
// ---------------------------------------------------------------------------

export interface SessionClaims {
  /** User id. */
  sub: string;
  /** Expiry, epoch seconds. */
  exp: number;
  /**
   * The account's session version when this cookie was issued.
   *
   * Checked against the stored value on every request, so "sign out
   * everywhere" is a single increment rather than a list of tokens to hunt
   * down. Absent on cookies issued before this existed; those are treated as
   * version 0, which is what every existing account already has.
   */
  v?: number;
}

export async function signSession(secret: string, claims: SessionClaims): Promise<string> {
  const payload = toBase64Url(encoder.encode(JSON.stringify(claims)));
  const signature = await hmacSha256Hex(secret, payload);
  return `${payload}.${signature}`;
}

/**
 * Verifies signature first, then expiry. A token that fails either check is
 * indistinguishable to the caller — `null` both times.
 */
export async function verifySession(secret: string, token: string): Promise<SessionClaims | null> {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const expected = await hmacSha256Hex(secret, payload);
  if (!timingSafeEqual(signature, expected)) return null;

  try {
    const claims = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as SessionClaims;
    if (typeof claims.sub !== 'string' || typeof claims.exp !== 'number') return null;
    if (claims.v !== undefined && typeof claims.v !== 'number') return null;
    if (claims.exp <= Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}
