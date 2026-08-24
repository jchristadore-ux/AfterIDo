import { useLocation } from 'react-router-dom';
import { DEFAULT_DESCRIPTION, SITE_NAME, canonicalUrl } from '@shared/seo';

/**
 * Per-route document metadata.
 *
 * React 19 hoists `<title>`, `<meta>` and `<link>` rendered anywhere in the
 * tree into `<head>`, so this is a plain component rather than a pile of
 * `document.head` mutations — and it unmounts cleanly when the route changes.
 *
 * The Worker rewrites the same values into the served HTML for crawlers that
 * don't run JavaScript. Both read `shared/seo.ts`. If you change what a page
 * is called, change it there.
 */
export function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  noindex,
  image,
  jsonLd,
}: {
  /** Page title without the site name — that is appended here. */
  title: string;
  description?: string;
  noindex?: boolean;
  image?: string;
  /** Structured data for this page, e.g. an FAQPage or a HowTo. */
  jsonLd?: Record<string, unknown>;
}) {
  const { pathname } = useLocation();
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const url = canonicalUrl(origin, pathname);
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const ogImage = origin ? `${origin}${image ?? '/og-image.png'}` : '';

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large" />
      )}
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {jsonLd && (
        <script
          type="application/ld+json"
          // The object is built from our own constants, never from anything a
          // user typed. The `<` escape is belt-and-braces: inside a <script>
          // block the browser's HTML parser, not the JSON parser, decides where
          // the script ends, so a literal `</script>` in any string would close
          // it early. `\u003c` is valid JSON and parses back identically.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
    </>
  );
}
