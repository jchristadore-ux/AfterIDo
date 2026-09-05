import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { PAGE_META, canonicalUrl, stateSlug } from './shared/seo.ts';

/**
 * `VITE_BASE` lets the same source deploy to a subpath without a code change —
 * a static host that serves the app from /<repo>/ rather than the domain root.
 * Locally, and on Cloudflare, it stays '/'.
 *
 * Nothing sets it any more. The GitHub Pages deployment that used to was
 * removed before launch: it published a second, fully crawlable copy of the
 * site that could not take payment, on a URL that competed with the real one
 * for search results and stored a visitor's plan somewhere she would never find
 * it again. The support is kept because it costs nothing and a preview build is
 * occasionally useful; the automatic deploy is what was the problem.
 *
 * `VITE_ROUTER=hash` switches the app to a hash router for single-file builds
 * hosted somewhere that can't rewrite unknown paths back to index.html.
 *
 * `VITE_SITE_ORIGIN` is the public URL the site will live at, e.g.
 * https://afterido.com. It is only used to write absolute URLs into the
 * generated sitemap.
 */

/** The state names the sitemap enumerates. Fixed since 1959. */
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

/**
 * Writes robots.txt and sitemap.xml into the build.
 *
 * On Cloudflare the Worker serves both dynamically, using the origin the
 * request actually arrived on, and those take precedence. These static copies
 * exist so a plain static host — GitHub Pages, a preview — still has them.
 * Both are generated from the same `shared/seo.ts` table the app renders from,
 * so a page can't be in the sitemap and missing from the site.
 */
function seoFiles(): Plugin {
  return {
    name: 'afterido-seo-files',
    apply: 'build',
    generateBundle() {
      const origin = (process.env.VITE_SITE_ORIGIN || '').replace(/\/$/, '');

      const paths = [
        ...Object.entries(PAGE_META)
          .filter(([, meta]) => !meta.noindex)
          .map(([p]) => p),
        ...STATE_NAMES.map((name) => `/name-change-after-marriage/${stateSlug(name)}`),
      ];

      const urls = paths
        .map((p) => {
          const priority = p === '/' ? '1.0' : p.startsWith('/name-change') ? '0.8' : '0.4';
          const loc = canonicalUrl(origin, p).replace(/&/g, '&amp;');
          return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
        })
        .join('\n');

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: [
          'User-agent: *',
          'Allow: /',
          'Disallow: /app',
          'Disallow: /start',
          'Disallow: /sign-in',
          'Disallow: /create-account',
          'Disallow: /premium/success',
          'Disallow: /api/',
          '',
          origin ? `Sitemap: ${origin}/sitemap.xml` : '# Set VITE_SITE_ORIGIN to emit a Sitemap line.',
          '',
        ].join('\n'),
      });
    },
  };
}

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  build: {
    // VITE_INLINE_ASSETS=1 emits assets as data URIs instead of separate
    // files, for building a single self-contained HTML page.
    assetsInlineLimit: process.env.VITE_INLINE_ASSETS ? 8 * 1024 * 1024 : undefined,
  },
  plugins: [react(), tailwindcss(), seoFiles()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@shared': path.resolve(import.meta.dirname, './shared'),
    },
  },
  server: { port: 5173 },
});
