/**
 * Transactional email.
 *
 * One provider is wired up — Resend, whose free tier covers a launch at no
 * cost — behind a shape narrow enough that swapping it for Postmark, SES or
 * anything else is this file and nothing else.
 *
 * With no API key configured, `sendEmail` logs the subject and recipient and
 * reports success. That keeps local development and a pre-domain launch
 * working without a mail account, and it is why the sign-in flow always tells
 * the user to check her inbox rather than claiming delivery.
 */
import type { Env } from './env.ts';
import { emailEnabled } from './env.ts';

export interface OutgoingEmail {
  to: string;
  subject: string;
  /** Plain text. We do not send HTML mail — nothing here needs it. */
  text: string;
}

export async function sendEmail(env: Env, message: OutgoingEmail): Promise<boolean> {
  if (!emailEnabled(env)) {
    // Subject and recipient only. Never the body — sign-in links live there.
    console.log(`[email:not-configured] to=${redact(message.to)} subject=${message.subject}`);
    return false;
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
      console.log(`[email:failed] status=${response.status} subject=${message.subject}`);
      return false;
    }
    return true;
  } catch {
    console.log(`[email:error] subject=${message.subject}`);
    return false;
  }
}

/** `sarah@example.com` → `s***@example.com`, so logs are useful but not a mailing list. */
function redact(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return '***';
  return `${email[0]}***${email.slice(at)}`;
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
