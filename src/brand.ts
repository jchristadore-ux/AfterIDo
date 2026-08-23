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
 * The brand palette specifies white text on the primary, success and
 * destructive fills, and brand-colored text on white for the outline variants.
 * Measured against WCAG 2.1 (AA wants 4.5:1 for normal text):
 *
 *   white on #D4A5A5 (primary fill)        2.16:1   fails
 *   white on #7A9E9F (success fill)        2.91:1   fails
 *   white on #C97B7B (destructive fill)    3.18:1   fails
 *   #D4A5A5 text on white (outline btn)    2.16:1   fails
 *   #C97B7B text on white (destructive)    3.18:1   fails
 *   #2C3E50 on #D4A5A5                     5.09:1   passes
 *   #2C3E50 on #E8D5C4 (champagne)         7.71:1   passes
 *   #2C3E50 on #FFFFFF                    10.98:1   passes
 *
 * The brand spec is implemented exactly as written — the values above are what
 * ships. All body copy, headings and labels sit in charcoal on white or
 * champagne, which pass comfortably; the failures are confined to text inside
 * or on brand-colored buttons.
 *
 * `ACCESSIBLE_ALTERNATES` holds the lightest shade of each hue that clears
 * 4.5:1 against white, computed rather than eyeballed. Swapping a token in
 * index.css is a one-line change if the brand owner decides readability should
 * win. Nothing references these yet.
 */
export const ACCESSIBLE_ALTERNATES = {
  /** 4.51:1 with white text. */
  primary: '#8E6F6F',
  /** 4.55:1 with white text. */
  success: '#5F7B7C',
  /** 4.52:1 with white text. */
  destructive: '#A56565',
} as const;

/** Shown on the About screen. */
export const APP_VERSION = '1.0.0';

export type BrandColor = keyof typeof AfterIDoBrand.colors;
