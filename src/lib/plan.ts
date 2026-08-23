import type { Plan } from '@/types';

/**
 * Plans and entitlements.
 *
 * There is no payment processing in this build and no code path that takes
 * money. What exists is the seam: features ask `canUse(plan, feature)`, so
 * wiring Stripe later means implementing `startCheckout` and setting the plan
 * from a verified webhook rather than touching feature code.
 */

export type FeatureId =
  | 'full-checklist'
  | 'state-guidance'
  | 'prefill'
  | 'packet'
  | 'letters'
  | 'documents'
  | 'reminders'
  | 'household';

const ENTITLEMENTS: Record<Plan, FeatureId[]> = {
  free: ['full-checklist', 'prefill'],
  premium: [
    'full-checklist',
    'prefill',
    'state-guidance',
    'packet',
    'letters',
    'documents',
    'reminders',
  ],
};

export function canUse(plan: Plan, feature: FeatureId): boolean {
  return ENTITLEMENTS[plan].includes(feature);
}

export interface PlanTier {
  id: Plan | 'premium-plus';
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  available: boolean;
  highlight?: boolean;
}

export const PLAN_TIERS: PlanTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    cadence: 'always',
    tagline: 'The full checklist, in the right order, with official links.',
    features: [
      'Your complete personalized checklist',
      'Recommended order of operations',
      'Official agency links for every step',
      'Your information filled in once and reused',
      'Progress tracking',
    ],
    available: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$19.99',
    cadence: 'one time',
    tagline: 'Everything prepared for you, and somewhere to keep it.',
    features: [
      'Everything in Free',
      'State-specific guidance for your state',
      'Printable name-change packet',
      'Ready-to-send notification letters',
      'Document vault',
      'Reminders',
    ],
    available: true,
    highlight: true,
  },
  {
    id: 'premium-plus',
    name: 'Premium Plus',
    price: 'Coming later',
    cadence: '',
    tagline: 'For the whole household, past the wedding.',
    features: [
      'Manage name changes for your whole household',
      'Ongoing document management',
      'Address-change assistance',
      'Future life events — a move, a baby, a new job',
    ],
    available: false,
  },
];

/**
 * INTEGRATION POINT — payments.
 *
 * Production: create a Checkout Session server-side, redirect here, and grant
 * the entitlement only from a signed `checkout.session.completed` webhook.
 * Never from the browser's success redirect — that is trivially forged.
 */
export async function startCheckout(): Promise<{ ok: false; reason: string }> {
  return { ok: false, reason: 'Payments are not enabled in this build.' };
}
