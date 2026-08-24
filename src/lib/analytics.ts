/**
 * Product analytics.
 *
 * No third-party script, no cookie, no device fingerprint, no identifier of
 * any kind — a POST to our own endpoint with an event name and, at most, a
 * category or a step number. The server keeps a daily count and throws the
 * rest away.
 *
 * What can be answered: how many people reached the landing page today, how
 * many finished onboarding, how many started checkout, how many bought. What
 * cannot: who any of them were.
 *
 * Never pass anything the user typed. The server allow-lists property keys as
 * a second line of defence, but the first line is this file.
 */

export type AnalyticsEvent =
  | 'landing_viewed'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'account_created'
  | 'premium_viewed'
  | 'checkout_started'
  | 'purchase_completed'
  | 'task_completed'
  | 'packet_printed'
  | 'letter_copied';

type Props = Partial<Record<'category' | 'step' | 'plan' | 'state', string | number>>;

/** Fire-and-forget. Analytics failing must never be visible to the user. */
export function track(name: AnalyticsEvent, props?: Props): void {
  if (typeof window === 'undefined') return;

  const body = JSON.stringify({ name, props: props ?? {} });

  // sendBeacon survives the page being closed, which matters for the events
  // fired on the way out of a screen.
  if (navigator.sendBeacon) {
    try {
      navigator.sendBeacon('/api/events', new Blob([body], { type: 'application/json' }));
      return;
    } catch {
      /* fall through to fetch */
    }
  }

  void fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    /* no analytics is better than a broken app */
  });
}
