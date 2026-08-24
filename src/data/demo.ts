import type { AppState, TaskState } from '@/types';
import { EMPTY_STATE } from '@/lib/storage';

/**
 * Demo mode: Sarah Johnson → Sarah Smith, married in New Jersey.
 *
 * Deliberately mid-journey rather than empty — the marriage certificate and
 * Social Security are done, her license is in progress, and a few things are
 * waiting on the mail. That is what makes the dashboard legible in one glance
 * without an account.
 */

const done = (daysAgo: number): TaskState => ({
  status: 'complete',
  notes: '',
  instances: [],
  completedAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
});

const inDays = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
};

export const DEMO_STATE: AppState = {
  ...EMPTY_STATE,
  onboarded: true,
  demoMode: true,
  profile: {
    currentName: { first: 'Sarah', middle: 'Elizabeth', last: 'Johnson' },
    newName: { first: 'Sarah', middle: 'Elizabeth', last: 'Smith' },
    nameChangeKind: 'spouse-last-name',
    nameChangeKindOther: '',
    dateOfBirth: '1996-03-22',
    address: {
      line1: '412 Maple Avenue',
      line2: 'Apt 3B',
      city: 'Montclair',
      state: 'NJ',
      zip: '07042',
    },
    phone: '9735550142',
    email: 'sarah.johnson@example.com',
    marriage: {
      spouseName: 'Michael Smith',
      date: '2026-06-14',
      state: 'NJ',
      county: 'Essex',
      certifiedCopies: 3,
    },
    circumstances: [
      'employed',
      'has-passport',
      'has-tsa-precheck',
      'has-auto-loan',
      'has-student-loans',
      'has-investments',
      'has-pets',
    ],
  },
  tasks: {
    'marriage-certificate': done(38),
    'social-security': done(24),
    'drivers-license': {
      status: 'in-progress',
      notes:
        'Have my 6 Points documents in a folder by the door. Going to the Montclair MVC before work on Thursday.',
      instances: [],
      remindAt: inDays(2),
    },
    'employer-hr': {
      status: 'waiting',
      notes: 'Emailed Dana in HR on Monday — she said payroll updates on the next cycle.',
      instances: [],
      remindAt: inDays(5),
    },
    'health-insurance': done(12),
    passport: {
      status: 'not-started',
      notes: 'Iceland trip in March — do not leave this until the winter.',
      instances: [],
      remindAt: inDays(9),
    },
    'bank-accounts': {
      status: 'in-progress',
      notes: '',
      instances: [
        { id: 'i1', label: 'Chase — checking & savings', done: true },
        { id: 'i2', label: 'Ally — high-yield savings', done: false },
        { id: 'i3', label: 'Montclair Credit Union — joint account', done: false },
      ],
    },
    'credit-cards': {
      status: 'not-started',
      notes: '',
      instances: [
        { id: 'i4', label: 'Chase Sapphire', done: false },
        { id: 'i5', label: 'Amex Blue Cash', done: false },
        { id: 'i6', label: 'Target RedCard', done: false },
      ],
    },
    'auto-insurance': done(9),
    'home-renters-insurance': done(9),
    'life-insurance': done(7),
    'medical-providers': done(6),
    'utilities': done(5),
    'phone-internet': done(5),
    'landlord-lease': done(4),
    'memberships': done(3),
    'digital-accounts': done(2),
    'social-media': done(1),
    'disability-insurance': { status: 'not-applicable', notes: '', instances: [] },
    'estate-documents': {
      status: 'not-started',
      notes: 'Ask Michael’s cousin — she does estate work.',
      instances: [],
    },
    'pet-records': {
      status: 'not-started',
      notes: 'Biscuit’s microchip is registered under my old number too.',
      instances: [],
    },
  },
  documents: [
    {
      id: 'demo_doc_1',
      kindId: 'marriage-certificate',
      fileName: 'marriage-certificate-essex-county.pdf',
      sizeBytes: 842_113,
      mimeType: 'application/pdf',
      uploadedAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
      availableInSession: false,
    },
    {
      id: 'demo_doc_2',
      kindId: 'ss5-confirmation',
      fileName: 'ssa-confirmation-receipt.pdf',
      sizeBytes: 121_004,
      mimeType: 'application/pdf',
      uploadedAt: new Date(Date.now() - 24 * 86_400_000).toISOString(),
      availableInSession: false,
    },
    {
      id: 'demo_doc_3',
      kindId: 'drivers-license',
      fileName: 'current-license-front.jpg',
      sizeBytes: 2_310_552,
      mimeType: 'image/jpeg',
      uploadedAt: new Date(Date.now() - 20 * 86_400_000).toISOString(),
      availableInSession: false,
    },
  ],
  customTasks: [],
};
