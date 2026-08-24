/**
 * Reminders.
 *
 * ── Where each channel actually runs ──────────────────────────────────────
 * In-app is the default and needs nothing: a task carries a `remindAt` and the
 * dashboard surfaces anything due.
 *
 * Email is real, but it does not run here. The browser cannot send mail
 * without shipping an API key to the client, so the reminders a Premium user
 * sets are handed to the server (`PUT /api/reminders`) and an hourly cron in
 * the Worker sends the ones that have come due. This file describes the
 * channels; `src/lib/reminderSchedule.ts` decides what gets sent, and it sends
 * a date and a task title — nothing else about her.
 *
 * Push is still a stub, and says so rather than failing quietly.
 */

export type ReminderChannelId = 'in-app' | 'email' | 'push';

export interface ScheduledReminder {
  taskId: string;
  taskTitle: string;
  remindAt: string;
}

export interface ReminderChannel {
  id: ReminderChannelId;
  label: string;
  /** False channels render as "coming soon" instead of being silently broken. */
  available: boolean;
  send(reminder: ScheduledReminder): Promise<void>;
}

const inAppChannel: ReminderChannel = {
  id: 'in-app',
  label: 'In the app',
  available: true,
  async send() {
    // Nothing to do: the dashboard reads `remindAt` directly and renders
    // anything due. Kept as a channel so the dispatcher has one shape.
  },
};

const emailChannel: ReminderChannel = {
  id: 'email',
  label: 'Email',
  available: true,
  async send() {
    // Deliberately a no-op on this side. Email is sent by the Worker's cron
    // sweep from the queue the client registers via `PUT /api/reminders`; a
    // browser cannot send mail without holding a mail-provider key, and it
    // must never hold one.
  },
};

const pushChannel: ReminderChannel = {
  id: 'push',
  label: 'Push notification',
  available: false,
  async send() {
    // INTEGRATION POINT — requires a service worker, a Web Push subscription
    // stored per device, and VAPID keys held server-side.
    throw new Error('Push notifications are not enabled in this build.');
  },
};

export const REMINDER_CHANNELS: ReminderChannel[] = [inAppChannel, emailChannel, pushChannel];

export interface ReminderPreset {
  id: string;
  label: string;
  days: number;
}

export const REMINDER_PRESETS: ReminderPreset[] = [
  { id: 'tomorrow', label: 'Tomorrow', days: 1 },
  { id: 'three-days', label: 'In 3 days', days: 3 },
  { id: 'week', label: 'In a week', days: 7 },
  { id: 'two-weeks', label: 'In 2 weeks', days: 14 },
  { id: 'month', label: 'In a month', days: 30 },
];

export function remindInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

export function isDue(remindAt: string | undefined): boolean {
  if (!remindAt) return false;
  return new Date(remindAt).getTime() <= Date.now();
}
