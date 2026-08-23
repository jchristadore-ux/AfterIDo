/**
 * Reminders.
 *
 * The MVP delivers reminders in-app: a task carries a `remindAt`, and the
 * dashboard surfaces anything due. That is the whole feature today, and the UI
 * says so rather than implying an email will arrive.
 *
 * The data model and this dispatcher are built for the real thing, though —
 * adding email or push means implementing `ReminderChannel` and registering it.
 * Scheduling would move server-side (a durable queue keyed on `remindAt`), and
 * every channel must respect the per-user preferences in `ReminderPreferences`.
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
  available: false,
  async send() {
    // INTEGRATION POINT — production posts to the transactional email service
    // from a server-side worker. Never from the browser: that would require
    // shipping an API key to the client.
    throw new Error('Email reminders are not enabled in this build.');
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
