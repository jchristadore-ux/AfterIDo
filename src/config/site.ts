/**
 * The handful of facts about the business, rather than the product.
 *
 * These are the things a lawyer, a customer or a search engine needs and that
 * only you can supply. They live in one file so launching does not mean
 * hunting through components. LAUNCH_GUIDE.md lists which of them must be set
 * before you take real money.
 *
 * The support email is deliberately *not* here: it comes from the server's
 * SUPPORT_EMAIL variable via /api/config, so it can be changed without a
 * redeploy. Use `useAccount().config.supportEmail`, with SUPPORT_EMAIL_FALLBACK
 * below for the pages that render before that arrives.
 */

export const SITE = {
  /**
   * Who operates AfterIDo, as it should appear in the Terms and Privacy
   * Policy. If you trade as yourself rather than a company, your own name is
   * the correct answer.
   */
  legalEntity: 'AfterIDo',

  /**
   * The state or country whose law governs the Terms. Use where you actually
   * live or are incorporated — not where your customers are.
   */
  governingLaw: 'the State of New Jersey, United States',

  /** Shown on the legal pages so a reader can see how current they are. */
  legalLastUpdated: 'August 24, 2026',

  /** Days within which a Premium purchase can be refunded, no questions asked. */
  refundWindowDays: 30,

  /** Used only when the server has not been given a SUPPORT_EMAIL. */
  supportEmailFallback: '',

  /**
   * The canonical origin, used for sitemap URLs and link previews. Leave empty
   * to use whatever origin the app is being served from, which is correct for
   * everything except the generated sitemap.
   */
  canonicalOrigin: '',
} as const;
