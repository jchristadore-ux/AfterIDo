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
      'The complete roadmap — financial, insurance, travel and personal',
      'State-specific guidance for your state',
      'Ready-to-send notification letters',
      'Document checklists and a vault to track them',
      'A printable packet for the counter',
      'Email reminders',
      'Your own custom tasks',
      'A dated completion record when you finish',
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
