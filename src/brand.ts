/**
 * AfterIDo brand system.
 *
 * This is the source of truth for brand values in TypeScript. The same values
 * are mirrored as CSS custom properties in `src/index.css` under `@theme`,
 * which is what the Tailwind utility classes compile against — change a color
 * here and you must change it there. Components should reach for the Tailwind
 * token (`bg-primary`, `text-charcoal`) rather than importing hex from this
 * file; the object exists for the places CSS can't reach (canvas, meta tags,
 * generated documents) and as the documented brand reference.
 */

export const AfterIDoBrand = {
  name: 'AfterIDo',
  tagline: 'Your new name, everywhere it matters.',

  colors: {
    primary: '#D4A5A5', // rose-gold — CTAs, brand accents
    secondary: '#E8D5C4', // champagne — soft fills, tinted surfaces
    success: '#7A9E9F', // sage — completed states
    text: '#2C3E50', // charcoal — all body and heading text
    background: '#FFFFFF',
    disabled: '#E0E0E0',
    destructive: '#C97B7B',
    white: '#FFFFFF',
  },

  fonts: {
    heading: "'Playfair Display', 'Iowan Old Style', Georgia, serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif",
  },
} as const;

/**
 * Contrast note — read before changing button colors.
 *
 * The brand palette as written specifies white text on the primary, success and
 * destructive fills, and brand-colored text on white for the outline variants.
 * Measured against WCAG 2.1 (AA wants 4.5:1 for normal text), that spec was:
 *
 *   white on #D4A5A5 (primary fill)        2.16:1   fails
 *   white on #7A9E9F (success fill)        2.91:1   fails
 *   #D4A5A5 text on white (outline btn)    2.16:1   fails
 *   #C97B7B text on white (destructive)    3.18:1   fails
 *   #2C3E50 on #D4A5A5                     5.09:1   passes
 *   #2C3E50 on #E8D5C4 (champagne)         7.71:1   passes
 *   #2C3E50 on #FFFFFF                    10.98:1   passes
 *
 * ── What ships now, and why it changed ────────────────────────────────────
 * Readability won, at the smallest cost to the brand that could be found. The
 * split is between *surfaces* and *lettering*:
 *
 *   • Every fill still uses the exact brand hex. The primary button is still
 *     #D4A5A5, the sage tick is still sage, the champagne panels are unchanged.
 *   • The primary button's lettering is charcoal rather than white — the same
 *     fill at 5.09:1 instead of 2.16:1 — and its hover/active states lighten
 *     rather than darken so that stays true.
 *   • Brand-coloured *text* uses the darker steps of the same hue
 *     (primary-600/700/800, sage-600/700, destructive-600/700 in index.css),
 *     each computed to clear 4.5:1 on white rather than eyeballed.
 *
 * Contrast is symmetric, which is what makes one value serve both jobs: a hue
 * dark enough to read as text on white is also dark enough to carry white text.
 *
 * If the brand owner ever wants the original white-on-rose-gold back, the
 * change is `VARIANT.primary` in components/ui.tsx — and it reintroduces a
 * 2.16:1 label on the app's most-pressed button, on a phone, one-handed.
 */
export const ACCESSIBLE_ALTERNATES = {
  /** 4.51:1 with white text. Ships as `--color-primary-800`. */
  primary: '#8E6F6F',
  /** 4.55:1 with white text. Near-identical to the shipped `--color-sage-600`. */
  success: '#5F7B7C',
  /** 4.52:1 with white text. Ships as `--color-destructive-600`. */
  destructive: '#A56565',
} as const;

/** Shown on the About screen. */
export const APP_VERSION = '1.0.0';

export type BrandColor = keyof typeof AfterIDoBrand.colors;
