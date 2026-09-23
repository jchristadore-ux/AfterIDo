/**
 * Transactional email.
 *
 * One provider is wired up — Resend, whose free tier covers a launch at no
 * cost — behind a shape narrow enough that swapping it for Postmark, SES or
 * anything else is this file and nothing else.
 *
 * With no API key configured, `sendEmail` logs the subject and recipient and
 * reports failure (so reminder retries / dead-letter still work). That keeps
 * local development honest: we never claim delivery we did not attempt.
 */
import type { Env } from './env.ts';
import { emailEnabled } from './env.ts';

export interface OutgoingEmail {
  to: string;
  subject: string;
  /** Plain text. We do not send HTML mail — nothing here needs it. */
  text: string;
}

export interface SendEmailResult {
  ok: boolean;
  /**
   * Short, provider-side reason suitable for dead-letter `last_error`.
   * Never includes the outbound body (sign-in links live there) or the
   * recipient address.
   */
  error?: string;
}

/** Cap Resend error bodies so logs / dead-letter rows cannot become a dump. */
const ERROR_BODY_MAX = 240;

export async function sendEmail(env: Env, message: OutgoingEmail): Promise<SendEmailResult> {
  if (!emailEnabled(env)) {
    // Subject and recipient only. Never the body — sign-in links live there.
    console.log(`[email:not-configured] to=${redactEmail(message.to)} subject=${message.subject}`);
    return { ok: false, error: 'email_not_configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [message.to],
        subject: message.subject,
        text: message.text,
      }),
    });
    if (!response.ok) {
      const detail = await truncateResponseBody(response);
      const error = `resend_http_${response.status}${detail ? `: ${detail}` : ''}`;
      console.log(`[email:failed] status=${response.status} subject=${message.subject}`);
      return { ok: false, error };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.log(`[email:error] subject=${message.subject}`);
    return { ok: false, error: `resend_fetch: ${msg.slice(0, 120)}` };
  }
}

async function truncateResponseBody(response: Response): Promise<string> {
  try {
    const text = await response.text();
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (!cleaned) return '';
    return cleaned.length > ERROR_BODY_MAX ? `${cleaned.slice(0, ERROR_BODY_MAX)}…` : cleaned;
  } catch {
    return '';
  }
}

/** `sarah@example.com` → `s***@example.com`, so logs are useful but not a mailing list. */
export function redactEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return '***';
  return `${email[0]}***${email.slice(at)}`;
}

/**
 * One operator alert when a reminder is dead-lettered. Summarises id + subject
 * + redacted address only — never the reminder body or a magic link.
 */
export function deadLetterAlertEmail(args: {
  reminderId: string;
  subject: string;
  redactedTo: string;
  attempts: number;
  lastError?: string;
}): Omit<OutgoingEmail, 'to'> {
  return {
    subject: `[AfterIDo] Reminder dead-lettered (${args.reminderId})`,
    text: [
      'A Premium reminder exhausted its send retries and was dead-lettered.',
      '',
      `Reminder id: ${args.reminderId}`,
      `Subject: ${args.subject}`,
      `Recipient (redacted): ${args.redactedTo}`,
      `Attempts: ${args.attempts}`,
      args.lastError ? `Last error: ${args.lastError}` : null,
      '',
      'Inspect D1 table email_dead_letters. The customer was not emailed again.',
      'Do not forward this alert; it is for operators only.',
    ]
      .filter((line) => line !== null)
      .join('\n'),
  };
}

export function signInEmail(link: string, supportEmail: string): Omit<OutgoingEmail, 'to'> {
  return {
    subject: 'Your AfterIDo sign-in link',
    text: [
      'Here is your sign-in link for AfterIDo:',
      '',
      link,
      '',
      'It works once and expires in 20 minutes.',
      '',
      "If you didn't ask to sign in, you can ignore this email — nothing has changed.",
      '',
      supportEmail ? `Questions? ${supportEmail}` : '',
      'AfterIDo is not a government agency or a law firm.',
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

export function receiptEmail(
  priceLabel: string,
  appUrl: string,
  supportEmail: string,
): Omit<OutgoingEmail, 'to'> {
  return {
    subject: 'AfterIDo Premium is unlocked',
    text: [
      'Thank you — your AfterIDo Premium purchase went through.',
      '',
      `That is ${priceLabel}, once. There is no subscription and nothing to cancel.`,
      '',
      `Everything is unlocked here: ${appUrl}`,
      '',
      'Sign in with this email address on any device and your Premium features come with you.',
      '',
      'Stripe has emailed you a separate payment receipt.',
      '',
      supportEmail ? `Questions? ${supportEmail}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  };
}
