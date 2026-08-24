import type { Profile, TaskView } from '@/types';
import type { ReminderPayload } from './api';

/**
 * Turns the reminders she set on individual tasks into the queue the server
 * sends from.
 *
 * ── What crosses the wire ─────────────────────────────────────────────────
 * A date and a sentence naming the task. Not her name, not her address, not
 * her marriage details, not her progress on anything else. The subject line is
 * built from the task catalog — which is public — rather than from anything
 * she typed, so a reminder email leaks nothing even if it lands in the wrong
 * inbox.
 *
 * The whole set is replaced each time, so removing a reminder in the app
 * removes it from the queue rather than leaving a ghost that still sends.
 */
export function buildReminderPayloads(profile: Profile, tasks: TaskView[]): ReminderPayload[] {
  void profile; // Deliberately unused — see the note above about what we send.

  const now = Math.floor(Date.now() / 1000);

  return tasks
    .filter((task) => task.state.remindAt && task.state.status !== 'complete')
    .map((task) => {
      const sendAt = Math.floor(new Date(task.state.remindAt as string).getTime() / 1000);
      return {
        sendAt,
        subject: `Reminder: ${task.title}`,
        body: [
          `You asked AfterIDo to remind you about this step:`,
          '',
          `  ${task.title}`,
          `  ${task.summary}`,
          '',
          'Open your plan to pick it up where you left off.',
        ].join('\n'),
      };
    })
    .filter((reminder) => Number.isFinite(reminder.sendAt) && reminder.sendAt > now)
    .slice(0, 50);
}
