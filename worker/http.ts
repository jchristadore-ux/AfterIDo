/** Small HTTP helpers shared by every route. */

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cache-Control': 'no-store',
};

export function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...SECURITY_HEADERS,
      ...(init.headers as Record<string, string> | undefined),
    },
  });
}

/**
 * Error responses carry a stable machine code and a sentence the UI can show.
 * They never echo internal detail — a stack trace or a database message in a
 * response body is a gift to whoever is probing the endpoint.
 */
export function fail(status: number, code: string, message: string): Response {
  return json({ error: code, message }, { status });
}

export function redirect(location: string, extraHeaders: Record<string, string> = {}): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: location, 'Cache-Control': 'no-store', ...extraHeaders },
  });
}

/** Parses a JSON body, capping the size so a huge payload can't be used to burn CPU. */
export async function readJson<T>(request: Request, maxBytes = 16 * 1024): Promise<T | null> {
  const type = request.headers.get('content-type') || '';
  if (!type.includes('application/json')) return null;

  // Check the declared length before reading, so an oversized body is refused
  // rather than buffered. The post-read check still stands for the case where
  // Content-Length is absent or lies.
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) return null;

  const raw = await request.text();
  if (raw.length > maxBytes) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Cross-site request forgery defence for cookie-authenticated POSTs.
 *
 * Session cookies are SameSite=Lax, which already blocks cross-site form
 * posts, but browsers differ and Lax is not a guarantee. Requiring the Origin
 * header to match our own is the belt to that suspenders. The Stripe webhook
 * is exempt — it is authenticated by signature, not by cookie, and has no
 * Origin.
 */
export function sameOrigin(request: Request, expectedOrigin: string): boolean {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(expectedOrigin).origin;
  } catch {
    return false;
  }
}

export function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}

export function setCookie(
  name: string,
  value: string,
  opts: { maxAge: number; secure: boolean },
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${opts.maxAge}`,
  ];
  if (opts.secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearCookie(name: string, secure: boolean): string {
  return setCookie(name, '', { maxAge: 0, secure });
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
