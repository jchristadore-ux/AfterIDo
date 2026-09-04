import type { Plan } from '@/types';

/**
 * Plans and entitlements.
 *
 * ── One rule ──────────────────────────────────────────────────────────────
 * No feature checks a plan directly. Everything asks `canUse(plan, feature)`,
 * which means moving a feature between tiers is one line in the table below
 * and nothing else — no hunting through components for `plan === 'premium'`.
 *
 * ── Where `plan` comes from ───────────────────────────────────────────────
 * The server, via AccountContext. Not from here, and not from localStorage.
 * This file decides what a plan *entitles* you to; it never decides which plan
 * you have. Buying happens in worker/index.ts, where Stripe can be asked.
 */

export type FeatureId =
  | 'full-checklist'
  | 'state-guidance'
  | 'prefill'
  | 'packet'
  | 'letters'
  | 'documents'
  | 'reminders'
  | 'custom-tasks'
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
    'custom-tasks',
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
      // The complete checklist really is free — every category of it. Premium
      // used to claim "the complete roadmap — financial, insurance, travel and
      // personal" as something it added, which was not true of anything: the
      // free plan has never filtered the checklist. Saying so here is what
      // stops that bullet from being invented again.
      'Your complete personalized checklist — every category',
      'Government, work, financial, insurance, travel and personal',
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
      'Ready-to-send notification letters, filled in from your details',
      'A printable packet for the counter',
      'A document checklist and a vault to track what you have',
      'Email reminders for the steps that need a follow-up',
      'Your own custom tasks',
      'A dated completion record when you finish',
      // Deliberately last and deliberately qualified. In-depth, hand-verified
      // guidance exists for one state so far; every other state gets the
      // official agency links and a banner saying we have not checked the
      // local specifics. Selling it as "guidance for your state" promised
      // something most buyers would not receive.
      'In-depth guidance where we have verified it — see coverage below',
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
