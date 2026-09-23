/**
 * Server-rendered page metadata, robots.txt, the sitemap, and crawlable
 * bodies for detailed state landings.
 *
 * ── Why the Worker does this at all ───────────────────────────────────────
 * The app is a single-page app: one index.html for every route. Google runs
 * JavaScript and sees what React renders, but the crawlers behind a link
 * preview — iMessage, WhatsApp, Slack, Facebook, LinkedIn — do not. They fetch
 * the HTML, read the `og:` tags, and stop. Without this, every link anyone
 * shares, of any page, would preview as the homepage.
 *
 * So HTMLRewriter streams the served HTML and swaps in the right title and
 * description for the path being requested. For detailed state guides it also
 * injects a real `<main id="seo-landing">` into `#root` so non-JS crawlers see
 * verified steps and official .gov links instead of an empty SPA shell.
 *
 * Hydration approach: the landing HTML is prepended inside `#root`. React's
 * `createRoot(#root).render(...)` replaces those children on mount, so the SPA
 * is unchanged for real browsers while crawlers that never run JS still get
 * the static content. Do not invent a second URL for these landings.
 *
 * The meta values come from `shared/seo.ts`, the same table the React `<Seo>`
 * component reads. Landing bodies come from `shared/stateLandings.ts`, derived
 * from detailed profiles only.
 */
import { PAGE_META, canonicalUrl, metaForPath, stateSlug } from '../shared/seo.ts';
import {
  ALL_STATE_NAMES,
  DETAILED_STATE_LANDINGS,
  getDetailedLanding,
  isDetailedStateSlug,
  type StateLanding,
} from '../shared/stateLandings.ts';

const NAME_BY_SLUG = new Map(ALL_STATE_NAMES.map((name) => [stateSlug(name), name]));

function stateNameForSlug(slug: string): string | null {
  return NAME_BY_SLUG.get(slug) ?? null;
}

const STATE_GUIDE_PREFIX = '/name-change-after-marriage/';

/**
 * Rewrites the SPA shell's head for the path being served, and for detailed
 * state landings injects a crawlable body into `#root`.
 *
 * `html` is a streaming transform, so this adds no measurable latency and
 * never buffers the document.
 */
export function withPageMeta(response: Response, url: URL, origin: string): Response {
  const meta = metaForPath(url.pathname, stateNameForSlug, isDetailedStateSlug);
  const canonical = canonicalUrl(origin, url.pathname);
  const ogImage = `${origin}/og-image.png`;
  const robotsValue = meta.noindex
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large';

  const landingHtml = stateLandingBodyHtml(url.pathname);

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

  let rewriter = new HTMLRewriter()
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
    });

  if (landingHtml) {
    rewriter = rewriter.on('#root', {
      element(el) {
        // Prepend so crawlers see content; React createRoot replaces #root kids.
        el.prepend(landingHtml, { html: true });
      },
    });
  }

  return rewriter.transform(withHeaders);
}

/**
 * Crawlable HTML for `/name-change-after-marriage/<slug>`.
 *
 * Detailed: verified banner + ordered backbone with official links + CTA.
 * Basic: short honesty blurb only — no invented local requirements.
 * Unknown slug: nothing (SPA / NotFound handles it).
 */
export function stateLandingBodyHtml(pathname: string): string | null {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (!clean.startsWith(STATE_GUIDE_PREFIX)) return null;
  const slug = clean.slice(STATE_GUIDE_PREFIX.length);
  if (!slug) return null;

  const detailed = getDetailedLanding(slug);
  if (detailed) return renderDetailedLanding(detailed);

  const name = stateNameForSlug(slug);
  if (!name) return null;
  return renderBasicLanding(name);
}

function renderDetailedLanding(landing: StateLanding): string {
  const { name, lastReviewed, sourceNote, backbone } = landing;
  const stepsHtml = backbone
    .map((step, index) => {
      const links = step.links
        .map(
          (link) =>
            `<li><a href="${escapeAttr(link.url)}" rel="noopener noreferrer">${escapeHtml(link.label)}</a></li>`,
        )
        .join('');
      const ordered = step.steps
        .map((s) => `<li>${escapeHtml(s)}</li>`)
        .join('');
      return (
        `<section>` +
        `<h2>${index + 1}. ${escapeHtml(step.title)}</h2>` +
        `<p><strong>${escapeHtml(step.agencyName)}:</strong> ${escapeHtml(step.headline)}</p>` +
        (ordered ? `<ol>${ordered}</ol>` : '') +
        (links ? `<p>Official links:</p><ul>${links}</ul>` : '') +
        `</section>`
      );
    })
    .join('');

  return (
    `<main id="seo-landing">` +
    `<h1>Changing your name after marriage in ${escapeHtml(name)}</h1>` +
    `<p><strong>We've verified the ${escapeHtml(name)} specifics.</strong> ` +
    `Checked against official ${escapeHtml(name)} agency pages on ${escapeHtml(formatReviewed(lastReviewed))}. ` +
    `Requirements do change — the official links are always the final word. ` +
    `AfterIDo organizes the checklist; it does not submit forms to any agency.</p>` +
    `<p>${escapeHtml(sourceNote)}</p>` +
    stepsHtml +
    `<p><a href="/start">Start My Name Change</a> — free. Five minutes of questions ` +
    `and you get the whole list, filtered to what applies to you.</p>` +
    `</main>`
  );
}

function renderBasicLanding(name: string): string {
  return (
    `<main id="seo-landing">` +
    `<h1>Changing your name after marriage in ${escapeHtml(name)}</h1>` +
    `<p>We haven't verified ${escapeHtml(name)}'s local specifics yet. ` +
    `The federal order (marriage certificate → Social Security → state ID → passport) ` +
    `applies everywhere. Open this page in a browser for national lookups and official ` +
    `starting links — we do not invent ${escapeHtml(name)} requirements here.</p>` +
    `<p><a href="/start">Start My Name Change</a></p>` +
    `</main>`
  );
}

function formatReviewed(iso: string): string {
  // Keep Worker-safe: no locale deps. ISO date is already clear for crawlers.
  return iso;
}

/**
 * Which paths belong in the sitemap.
 *
 * Only pages a stranger can usefully land on. Onboarding, the signed-in app
 * and the sign-in form are excluded. State guides are included **only** for
 * detailed coverage — basic pages stay noindex and out of the sitemap so we
 * do not market thin content to Google.
 */
export function sitemap(origin: string): string {
  const publicPaths = Object.entries(PAGE_META)
    .filter(([, meta]) => !meta.noindex)
    .map(([path]) => path);

  const statePaths = DETAILED_STATE_LANDINGS.map(
    (s) => `/name-change-after-marriage/${s.slug}`,
  );

  const urls = [...publicPaths, ...statePaths].map((path) => {
    // The homepage and the detailed state guides are what we want found; the
    // legal pages exist to be reachable, not to rank.
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
