/**
 * The browser's side of the API.
 *
 * ── Two deployments, one build ────────────────────────────────────────────
 * AfterIDo runs in two shapes. On Cloudflare it is served by a Worker that
 * also answers /api/*, so accounts and payments work. On a purely static host
 * (GitHub Pages, a preview link) there is no /api at all.
 *
 * Rather than guess, the app asks: `loadConfig()` calls /api/config once at
 * startup. If that fails, `accounts` and `payments` are false, and the UI says
 * plainly that Premium can't be bought here instead of pretending otherwise.
 *
 * ── What is never sent ────────────────────────────────────────────────────
 * Nothing from the profile. Her name, address, date of birth, marriage details
 * and progress stay in this browser. The only personal thing that crosses the
 * wire is the email address she types to create an account.
 */

export interface ServerConfig {
  accounts: boolean;
  payments: boolean;
  testMode: boolean;
  email: boolean;
  priceLabel: string;
  supportEmail: string;
}

export interface Account {
  email: string;
  plan: 'free' | 'premium';
  remindersOptIn: boolean;
  premiumSince: number | null;
}

export const OFFLINE_CONFIG: ServerConfig = {
  accounts: false,
  payments: false,
  testMode: true,
  email: false,
  priceLabel: '$19.99',
  supportEmail: '',
};

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** The API lives at the same origin as the app, under /api. */
function endpoint(path: string): string {
  return `/api${path}`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method ?? 'GET';
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (init.body) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(endpoint(path), {
      ...init,
      method,
      headers,
      // The session is an HttpOnly cookie, so it must be sent explicitly.
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(0, 'network', 'We could not reach AfterIDo. Check your connection.');
  }

  const text = await response.text();
  const payload = text ? safeParse(text) : {};

  if (!response.ok) {
    const body = payload as { error?: string; message?: string };
    throw new ApiError(
      response.status,
      body.error ?? 'error',
      body.message ?? 'Something went wrong.',
    );
  }
  return payload as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export async function loadConfig(): Promise<ServerConfig> {
  try {
    return await request<ServerConfig>('/config');
  } catch {
    return OFFLINE_CONFIG;
  }
}

export async function fetchAccount(): Promise<Account | null> {
  try {
    return await request<Account>('/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export function requestSignInLink(email: string, next?: string) {
  return request<{ ok: true; delivery: 'email' | 'not-configured'; devLink?: string }>(
    '/auth/request-link',
    { method: 'POST', body: JSON.stringify({ email, next }) },
  );
}

export function signOut() {
  return request<{ ok: true }>('/auth/signout', { method: 'POST' });
}

export function startCheckout() {
  return request<{ url: string }>('/checkout', { method: 'POST' });
}

export function confirmCheckout(sessionId: string) {
  return request<Account>('/checkout/confirm', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
}

export interface ReminderPayload {
  sendAt: number;
  subject: string;
  body: string;
}

export function saveReminders(optIn: boolean, reminders: ReminderPayload[]) {
  return request<{ ok: true; scheduled: number }>('/reminders', {
    method: 'PUT',
    body: JSON.stringify({ optIn, reminders }),
  });
}

export function deleteAccount() {
  return request<{ ok: true }>('/account', { method: 'DELETE' });
}
