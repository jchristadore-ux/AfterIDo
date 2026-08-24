/**
 * Page metadata, in one table, shared by the browser and the server.
 *
 * ── Why it is shared ──────────────────────────────────────────────────────
 * A single-page app has one index.html, so every route would otherwise carry
 * the same title and the same link preview. Google runs JavaScript and sees
 * what React renders, but the crawlers behind a link preview — iMessage,
 * WhatsApp, Slack, Facebook — do not. They read the HTML as served and stop.
 *
 * So this table is used twice. `src/components/Seo.tsx` renders it into the
 * document for real browsers and for Google; `worker/seo.ts` rewrites the same
 * values into the served HTML for everyone else. One source, so the two can't
 * drift apart.
 *
 * This file must stay free of imports — the Worker and the app bundle it from
 * opposite sides of the codebase.
 */

export interface PageMeta {
  title: string;
  description: string;
  /** Keep out of search results. Anything behind onboarding, and every form. */
  noindex?: boolean;
}

export const SITE_NAME = 'AfterIDo';
export const DEFAULT_TITLE = 'Change your name everywhere. Without the headache. | AfterIDo';
export const DEFAULT_DESCRIPTION =
  'One personalized checklist for everything you need to update after getting married — from Social Security and your driver’s license to banks, insurance, work, travel and more.';

/** Titles are ~60 characters and descriptions ~155, which is what search results show. */
export const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  '/how-it-works': {
    title: 'How the name change process works, in order | AfterIDo',
    description:
      'Marriage certificate, then Social Security, then your driver’s license, then your passport, then everything else. Why the order matters and what each step needs.',
  },
  '/premium': {
    title: 'AfterIDo Premium — $19.99 once, no subscription',
    description:
      'Unlock the complete roadmap: state guidance, notification letters, document checklists, a printable packet, reminders and custom tasks. One payment, not a subscription.',
  },
  '/checklist-preview': {
    title: 'The complete name change checklist after marriage | AfterIDo',
    description:
      'Every agency, account and policy that needs your new name, grouped by category and sequenced so you are never turned away for missing a step.',
  },
  '/trust': {
    title: 'Privacy and trust — what AfterIDo does with your details',
    description:
      'What we collect, what we refuse to collect, and where every fact in the app comes from. We never ask for your Social Security number or account numbers.',
  },
  '/privacy': {
    title: 'Privacy Policy | AfterIDo',
    description:
      'What personal information AfterIDo collects, how it is used, who it is shared with, and how to delete it.',
  },
  '/terms': {
    title: 'Terms of Service | AfterIDo',
    description: 'The terms you agree to when you use AfterIDo, including limits and refunds.',
  },
  '/disclaimer': {
    title: 'Disclaimer | AfterIDo',
    description:
      'AfterIDo is not a government agency, not a law firm, and does not provide legal advice or guarantee that any organization will accept your name change.',
  },
  '/contact': {
    title: 'Contact AfterIDo',
    description: 'How to reach us about your account, a purchase, or something that looks wrong.',
  },
  '/sign-in': { title: 'Sign in | AfterIDo', description: DEFAULT_DESCRIPTION, noindex: true },
  '/create-account': {
    title: 'Save your plan | AfterIDo',
    description: DEFAULT_DESCRIPTION,
    noindex: true,
  },
  '/start': {
    title: 'Start your name change | AfterIDo',
    description: DEFAULT_DESCRIPTION,
    noindex: true,
  },
};

/** The slug half of /name-change-after-marriage/<slug>. */
export function stateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function stateGuideMeta(stateName: string): PageMeta {
  return {
    title: `Name change after marriage in ${stateName} — step by step`,
    description: `How to change your name after getting married in ${stateName}: the order to do it in, which agency handles each step, what to bring, and the official links for each one.`,
  };
}

const STATE_GUIDE_PREFIX = '/name-change-after-marriage/';

/**
 * Resolves a path to its metadata.
 *
 * Anything under /app is a signed-in screen containing the user's own details;
 * it is never indexed and never gets a link preview beyond the default.
 */
export function metaForPath(path: string, stateNameForSlug: (slug: string) => string | null): PageMeta {
  const clean = path.replace(/\/+$/, '') || '/';

  if (clean.startsWith(STATE_GUIDE_PREFIX)) {
    const name = stateNameForSlug(clean.slice(STATE_GUIDE_PREFIX.length));
    if (name) return stateGuideMeta(name);
  }

  if (clean.startsWith('/app')) {
    return { title: `Your name change plan | ${SITE_NAME}`, description: DEFAULT_DESCRIPTION, noindex: true };
  }

  return PAGE_META[clean] ?? { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
}

export function canonicalUrl(origin: string, path: string): string {
  const clean = path.replace(/\/+$/, '') || '/';
  return `${origin.replace(/\/$/, '')}${clean === '/' ? '/' : clean}`;
}
