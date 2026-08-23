import type { DocumentKind } from '@/types';

/**
 * The documents a name change actually runs on. `usedFor` is what powers the
 * "Used for" column in the vault and the document checklist in the packet — it
 * points back at task ids so the two stay in sync automatically.
 */
export const DOCUMENT_KINDS: DocumentKind[] = [
  {
    id: 'marriage-certificate',
    label: 'Certified marriage certificate',
    usedFor: ['social-security', 'drivers-license', 'passport', 'bank-accounts', 'health-insurance'],
    guidance:
      'Must be a certified copy with an official seal. Keep track of how many you have — several agencies will want to hold one temporarily.',
  },
  {
    id: 'drivers-license',
    label: 'Driver’s license or state ID',
    usedFor: ['social-security', 'drivers-license', 'bank-accounts', 'credit-cards'],
    guidance: 'Your everyday proof of identity. Photograph both sides before you hand it in anywhere.',
  },
  {
    id: 'passport',
    label: 'Passport',
    usedFor: ['passport', 'drivers-license', 'tsa-precheck'],
    guidance: 'Also counts as a primary identity document at most motor vehicle agencies.',
  },
  {
    id: 'birth-certificate',
    label: 'Birth certificate',
    usedFor: ['drivers-license', 'passport'],
    guidance: 'Certified copy. Often required as a primary identity document.',
  },
  {
    id: 'social-security-card',
    label: 'Social Security card',
    usedFor: ['drivers-license', 'employer-hr'],
    guidance:
      'Store the card itself somewhere safe and offline. Note the card here only so you can track that you have it.',
  },
  {
    id: 'ss5-confirmation',
    label: 'Social Security confirmation or receipt',
    usedFor: ['drivers-license', 'taxes'],
    guidance: 'Proof your SSA request went through — useful if the motor vehicle agency questions it.',
  },
  {
    id: 'insurance-card',
    label: 'Insurance card',
    usedFor: ['health-insurance', 'medical-providers'],
    guidance: 'Replace this once your new card arrives so your providers see the current one.',
  },
  {
    id: 'other',
    label: 'Other supporting document',
    usedFor: [],
    guidance: 'Anything else an agency asked you for.',
  },
];

export const DOCUMENT_KIND_BY_ID: Record<string, DocumentKind> = Object.fromEntries(
  DOCUMENT_KINDS.map((d) => [d.id, d]),
);
