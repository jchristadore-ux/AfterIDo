/**
 * Server-rendered page metadata, robots.txt and the sitemap.
 *
 * ── Why the Worker does this at all ───────────────────────────────────────
 * The app is a single-page app: one index.html for every route. Google runs
 * JavaScript and sees what React renders, but the crawlers behind a link
 * preview — iMessage, WhatsApp, Slack, Facebook, LinkedIn — do not. They fetch
 * the HTML, read the `og:` tags, and stop. Without this, every link anyone
 * shares, of any page, would preview as the homepage.
 *
 * So HTMLRewriter streams the served HTML and swaps in the right title and
 * description for the path being requested. It costs a Worker invocation on
 * HTML requests only; static assets still come straight off the edge.
 *
 * The values come from `shared/seo.ts`, the same table the React `<Seo>`
 * component reads, so the two cannot drift.
 */
import { PAGE_META, canonicalUrl, metaForPath, stateSlug } from '../shared/seo.ts';

/**
 * State names, duplicated here on purpose.
 *
 * The alternative is importing `src/data/states.ts`, which drags the whole app
 * type graph into the Worker bundle for fifty-one strings. The list is fixed —
 * it last changed in 1959 — so the duplication costs nothing.
 */
const STATE_NAMES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois',
  'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
  'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
  'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming',
];

const NAME_BY_SLUG = new Map(STATE_NAMES.map((name) => [stateSlug(name), name]));

function stateNameForSlug(slug: string): string | null {
  return NAME_BY_SLUG.get(slug) ?? null;
}

/**
 * Rewrites the SPA shell's head for the path being served.
 *
 * `html` is a streaming transform, so this adds no measurable latency and
 * never buffers the document.
 */
export function withPageMeta(response: Response, url: URL, origin: string): Response {
  const meta = metaForPath(url.pathname, stateNameForSlug);
  const canonical = canonicalUrl(origin, url.pathname);
  const ogImage = `${origin}/og-image.png`;
  const robotsValue = meta.noindex
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large';

  // Headers must be copied onto a mutable Response before HTMLRewriter
  // streams it; the one that comes back from ASSETS is immutable.
  const withHeaders = new Response(response.body, response);
  for (const [key, value] of Object.entries(securityHeaders())) {
    withHeaders.headers.set(key, value);
  }

  /** `content="…"` on a named or property-matched meta tag. */
  const setContent = (value: string) => ({
    element(el: Element) {
      el.setAttribute('content', value);
    },
  });

  return new HTMLRewriter()
    .on('title', {
      element(el) {
        el.setInnerContent(meta.title);
      },
    })
    .on('meta[name="description"]', setContent(meta.description))
    .on('meta[name="robots"]', setContent(robotsValue))
    .on('meta[property="og:title"]', setContent(meta.title))
    .on('meta[property="og:description"]', setContent(meta.description))
    .on('meta[property="og:url"]', setContent(canonical))
    .on('meta[property="og:image"]', setContent(ogImage))
    .on('meta[name="twitter:title"]', setContent(meta.title))
    .on('meta[name="twitter:description"]', setContent(meta.description))
    .on('meta[name="twitter:image"]', setContent(ogImage))
    // Appended rather than rewritten: index.html deliberately ships without a
    // canonical URL, because a build-time value would be wrong on every host
    // but one. The browser bundle adds the same pair once React mounts.
    .on('head', {
      element(el) {
        el.append(
          `<link rel="canonical" href="${escapeAttr(canonical)}">` +
            `<meta property="og:url" content="${escapeAttr(canonical)}">`,
          { html: true },
        );
      },
    })
    .transform(withHeaders);
}

/**
 * Which paths belong in the sitemap.
 *
 * Only pages a stranger can usefully land on. Onboarding, the signed-in app
 * and the sign-in form are excluded — they need context a search visitor
 * doesn't have, and indexing them would put a form at the top of a results
 * page instead of an answer.
 */
export function sitemap(origin: string): string {
  const publicPaths = Object.entries(PAGE_META)
    .filter(([, meta]) => !meta.noindex)
    .map(([path]) => path);

  const statePaths = STATE_NAMES.map((name) => `/name-change-after-marriage/${stateSlug(name)}`);

  const urls = [...publicPaths, ...statePaths].map((path) => {
    // The homepage and the state guides are what we want found; the legal
    // pages exist to be reachable, not to rank.
    const priority = path === '/' ? '1.0' : path.startsWith('/name-change') ? '0.8' : '0.4';
    return `  <url>\n    <loc>${escapeXml(canonicalUrl(origin, path))}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

/**
 * Security headers for the HTML document.
 *
 * ── About `script-src 'unsafe-inline'` ────────────────────────────────────
 * It is there for one thing: the `application/ld+json` block React renders for
 * structured data. A nonce would be stricter, but React adds that script after
 * hydration, on the client, where a server-issued nonce cannot reach it — so a
 * nonce policy would silently drop the SEO markup and give us a strict-looking
 * header that broke a feature. Better an honest, slightly weaker policy than a
 * strict one nobody can keep.
 *
 * The rest still does real work. `frame-ancestors 'none'` stops clickjacking,
 * `base-uri 'self'` stops a `<base>` injection redirecting every relative URL,
 * `object-src 'none'` removes the plugin surface, and `connect-src 'self'`
 * means script that does get in cannot exfiltrate to another host.
 *
 * `form-action` includes Stripe because that is where checkout goes.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

export function securityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': CSP,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // Nothing in the app needs any of these, so nothing embedded in it gets
    // to ask for them either.
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

export function robots(origin: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    // Nothing secret lives behind these — they are excluded because a form or
    // somebody's half-finished checklist is a bad search result, not because
    // hiding them protects anything.
    'Disallow: /app',
    'Disallow: /start',
    'Disallow: /sign-in',
    'Disallow: /create-account',
    'Disallow: /premium/success',
    'Disallow: /api/',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
}

/** Canonical URLs are built from our own origin and path, but never trust that. */
function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
