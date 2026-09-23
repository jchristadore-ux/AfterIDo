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
 * Guests keep the profile in the browser only. Signed-in accounts sync
 * checklist/profile JSON via `/api/plan`, and Premium vault bytes via
 * `/api/documents`. We still never send SSN, DL numbers, account numbers, or
 * passwords — those fields are not in the data model.
 */

import type { AppState } from '@/types';

export type StripeMode = 'absent' | 'test' | 'live';

export interface ServerConfig {
  accounts: boolean;
  /** True when R2 document vault is bound and accounts are on. */
  documents: boolean;
  payments: boolean;
  /** True only when a real sk_test_ key is installed (see stripeMode). */
  testMode: boolean;
  /** absent | test | live — readiness signal for operators and the UI. */
  stripeMode: StripeMode;
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
  documents: false,
  payments: false,
  testMode: false,
  stripeMode: 'absent',
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

function normalizeConfig(raw: Partial<ServerConfig>): ServerConfig {
  const stripeMode: StripeMode =
    raw.stripeMode === 'test' || raw.stripeMode === 'live' || raw.stripeMode === 'absent'
      ? raw.stripeMode
      : raw.testMode
        ? 'test'
        : 'absent';
  return {
    accounts: Boolean(raw.accounts),
    documents: Boolean(raw.documents),
    payments: Boolean(raw.payments),
    /** Prefer stripeMode when present; never treat "absent" as test. */
    testMode: stripeMode === 'test',
    stripeMode,
    email: Boolean(raw.email),
    priceLabel: raw.priceLabel || '$19.99',
    supportEmail: raw.supportEmail || '',
  };
}

export async function loadConfig(): Promise<ServerConfig> {
  try {
    const raw = await request<Partial<ServerConfig>>('/config');
    return normalizeConfig(raw);
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
  return request<{ ok: true; delivery: 'email' | 'dev-link'; devLink?: string }>(
    '/auth/request-link',
    { method: 'POST', body: JSON.stringify({ email, next }) },
  );
}

export function signOut() {
  return request<{ ok: true }>('/auth/signout', { method: 'POST' });
}

/** Invalidates every session this account has, on every device. */
export function signOutEverywhere() {
  return request<{ ok: true }>('/auth/signout-all', { method: 'POST' });
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

// ---------------------------------------------------------------------------
// Plan sync + document vault
// ---------------------------------------------------------------------------


export interface PlanResponse {
  state: AppState | null;
  revision: number;
  updatedAt?: number;
}

export function fetchPlan() {
  return request<PlanResponse>('/plan');
}

export function savePlan(state: AppState, revision: number | null) {
  return request<{ ok: true; revision: number; updatedAt: number }>('/plan', {
    method: 'PUT',
    body: JSON.stringify({ state, revision }),
  });
}

export async function uploadDocument(args: {
  id: string;
  kindId: string;
  file: File;
}): Promise<{ ok: true; id: string; fileName: string; contentType: string; byteSize: number; kindId: string }> {
  const form = new FormData();
  form.set('id', args.id);
  form.set('kindId', args.kindId);
  form.set('file', args.file, args.file.name);

  let response: Response;
  try {
    response = await fetch(endpoint('/documents'), {
      method: 'POST',
      body: form,
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(0, 'network', 'We could not reach AfterIDo. Check your connection.');
  }

  const textBody = await response.text();
  const payload = textBody ? safeParse(textBody) : {};
  if (!response.ok) {
    const body = payload as { error?: string; message?: string };
    throw new ApiError(
      response.status,
      body.error ?? 'error',
      body.message ?? 'Something went wrong.',
    );
  }
  return payload as {
    ok: true;
    id: string;
    fileName: string;
    contentType: string;
    byteSize: number;
    kindId: string;
  };
}

export async function fetchDocumentBlob(id: string): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(endpoint(`/documents/${encodeURIComponent(id)}`), {
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(0, 'network', 'We could not reach AfterIDo. Check your connection.');
  }
  if (!response.ok) {
    throw new ApiError(response.status, 'error', 'Could not download that document.');
  }
  return response.blob();
}

export function deleteRemoteDocument(id: string) {
  return request<{ ok: true }>(`/documents/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
