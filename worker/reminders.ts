/**
 * Hourly reminder sweep + dead-letter alerts.
 *
 * Kept out of index.ts so the unit tests can drive the same path the cron uses
 * without booting the whole Worker fetch router.
 */
import type { Env } from './env.ts';
import { accountsEnabled, emailEnabled } from './env.ts';
import {
  MAX_REMINDER_ATTEMPTS,
  dueReminders,
  findUserById,
  markReminderFailed,
  markReminderSent,
  purgeExpiredLoginTokens,
  purgeOldEvents,
  purgeRateLimits,
  recordEmailDeadLetter,
} from './db.ts';
import { deadLetterAlertEmail, redactEmail, sendEmail } from './email.ts';

/**
 * The hourly sweep: send what has come due, dead-letter permanent failures,
 * then tidy up.
 *
 * Every step is isolated. One customer's undeliverable address used to be able
 * to throw and take the rest of the hour's reminders down with it — along with
 * the cleanup at the end, which then never ran at all. Now a failure is
 * recorded against the one reminder that caused it and the sweep carries on.
 *
 * Crossing `MAX_REMINDER_ATTEMPTS` inserts exactly one `email_dead_letters` row
 * and sends exactly one operator alert to `SUPPORT_EMAIL` (or logs loudly when
 * mail is disabled). Re-sweeps cannot alert-spam: the insert is idempotent.
 */
export async function runReminderSweep(env: Env): Promise<void> {
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

      const result = await sendEmail(env, {
        to: user.email,
        subject: reminder.subject,
        text: `${reminder.body}\n\nYou set this reminder in AfterIDo. Turn reminders off any time in your profile.`,
      });

      // Only a confirmed send retires the row. Marking it sent regardless is
      // what used to turn a transient mail failure into a reminder she asked
      // for and never received, with nothing anywhere to say so.
      if (result.ok) {
        await markReminderSent(db, reminder.id);
        continue;
      }

      const attempts = await markReminderFailed(db, reminder.id);
      if (attempts >= MAX_REMINDER_ATTEMPTS) {
        await deadLetterAndAlert(env, {
          reminderId: reminder.id,
          userId: user.id,
          userEmail: user.email,
          subject: reminder.subject,
          attempts,
          lastError: result.error ?? null,
        });
      }
    } catch (error) {
      console.log(
        `[reminders] ${reminder.id} failed: ${(error as Error)?.message ?? 'unknown'}`,
      );
      try {
        const attempts = await markReminderFailed(db, reminder.id);
        if (attempts >= MAX_REMINDER_ATTEMPTS) {
          const user = await findUserById(db, reminder.user_id);
          if (user) {
            await deadLetterAndAlert(env, {
              reminderId: reminder.id,
              userId: user.id,
              userEmail: user.email,
              subject: reminder.subject,
              attempts,
              lastError: (error as Error)?.message?.slice(0, 200) ?? 'unknown',
            });
          }
        }
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

async function deadLetterAndAlert(
  env: Env,
  args: {
    reminderId: string;
    userId: string;
    userEmail: string;
    subject: string;
    attempts: number;
    lastError: string | null;
  },
): Promise<void> {
  const db = env.DB as D1Database;
  const inserted = await recordEmailDeadLetter(db, {
    reminderId: args.reminderId,
    userId: args.userId,
    subject: args.subject,
    lastError: args.lastError,
    attempts: args.attempts,
  });
  if (!inserted) return; // already dead-lettered — do not alert again

  const redacted = redactEmail(args.userEmail);
  const alert = deadLetterAlertEmail({
    reminderId: args.reminderId,
    subject: args.subject,
    redactedTo: redacted,
    attempts: args.attempts,
    lastError: args.lastError ?? undefined,
  });

  const support = env.SUPPORT_EMAIL?.trim();
  if (!support) {
    console.log(
      `[email:dead-letter] NO SUPPORT_EMAIL — reminder=${args.reminderId} to=${redacted} subject=${args.subject} attempts=${args.attempts} error=${args.lastError ?? ''}`,
    );
    return;
  }

  if (!emailEnabled(env)) {
    console.log(
      `[email:dead-letter] email disabled — would alert ${redactEmail(support)} reminder=${args.reminderId} to=${redacted} subject=${args.subject}`,
    );
    return;
  }

  const sent = await sendEmail(env, { to: support, ...alert });
  if (!sent.ok) {
    console.log(
      `[email:dead-letter] alert failed reminder=${args.reminderId} error=${sent.error ?? 'unknown'}`,
    );
  }
}
