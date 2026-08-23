import type { Category, CategoryId, Circumstance } from '@/types';

export const CATEGORIES: Category[] = [
  {
    id: 'foundation',
    label: 'Start Here',
    blurb: 'The one document everything else depends on.',
    tone: 'rose',
  },
  {
    id: 'government',
    label: 'Government & Legal',
    blurb: 'Social Security, your license, passport, voting and taxes.',
    tone: 'rose',
  },
  {
    id: 'financial',
    label: 'Financial',
    blurb: 'Banks, cards, loans and anywhere your money lives.',
    tone: 'sage',
  },
  {
    id: 'employment',
    label: 'Work',
    blurb: 'HR, payroll, benefits and your work identity.',
    tone: 'amber',
  },
  {
    id: 'insurance',
    label: 'Insurance',
    blurb: 'Health, auto, home, life and disability policies.',
    tone: 'sage',
  },
  {
    id: 'personal',
    label: 'Everyday Life',
    blurb: 'Doctors, utilities, memberships and the small stuff.',
    tone: 'ink',
  },
  {
    id: 'travel-digital',
    label: 'Travel & Digital',
    blurb: 'Airlines, hotels, trusted traveler and your online accounts.',
    tone: 'ink',
  },
];

export const CATEGORY_BY_ID: Record<CategoryId, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, Category>;

/**
 * Asked once during onboarding. Each answer switches optional tasks on, so the
 * checklist she sees is only ever as long as her actual life requires.
 */
export const CIRCUMSTANCES: Circumstance[] = [
  { id: 'employed', label: "I'm employed", hint: 'Adds HR, payroll and benefits steps' },
  { id: 'has-passport', label: 'I have a passport' },
  { id: 'has-tsa-precheck', label: 'I have TSA PreCheck or Global Entry' },
  { id: 'owns-home', label: 'I own a home' },
  { id: 'has-mortgage', label: 'I have a mortgage' },
  { id: 'has-auto-loan', label: 'I have a car loan or lease' },
  { id: 'has-student-loans', label: 'I have student loans' },
  { id: 'has-investments', label: 'I have investment accounts' },
  {
    id: 'has-professional-license',
    label: 'I hold a professional license',
    hint: 'Nursing, teaching, real estate, law, cosmetology…',
  },
  { id: 'is-student', label: "I'm enrolled in school" },
  { id: 'has-children', label: 'I have children' },
  { id: 'has-pets', label: 'I have pets' },
  { id: 'is-veteran', label: "I'm a veteran or service member" },
];
