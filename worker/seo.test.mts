/**
 * Sitemap / meta / SSR landing tests for detailed-only SEO (WS5).
 *
 *     node --experimental-strip-types worker/seo.test.mts
 */
import { metaForPath, stateSlug } from '../shared/seo.ts';
import {
  DETAILED_STATE_LANDINGS,
  detailedStateSlugs,
  isDetailedStateSlug,
} from '../shared/stateLandings.ts';
import { sitemap, stateLandingBodyHtml } from './seo.ts';

let failures = 0;
function check(label: string, ok: boolean) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) failures++;
}

const DETAILED_EXPECTED = [
  'california',
  'texas',
  'florida',
  'new-york',
  'pennsylvania',
  'illinois',
  'ohio',
  'georgia',
  'north-carolina',
  'michigan',
  'new-jersey',
  'virginia',
].sort();

const named = (slug: string) => {
  const hit = DETAILED_STATE_LANDINGS.find((s) => s.slug === slug);
  if (hit) return hit.name;
  if (slug === 'wyoming') return 'Wyoming';
  return null;
};

// ── detailed list ──────────────────────────────────────────────────────────
const slugs = detailedStateSlugs().slice().sort();
check('12 detailed landings', DETAILED_STATE_LANDINGS.length === 12);
check('detailed slugs match expected set', JSON.stringify(slugs) === JSON.stringify(DETAILED_EXPECTED));
check('NJ is detailed', isDetailedStateSlug('new-jersey'));
check('Wyoming is not detailed', !isDetailedStateSlug('wyoming'));

// ── sitemap ────────────────────────────────────────────────────────────────
const sm = sitemap('https://after-i-do.com');
for (const slug of DETAILED_EXPECTED) {
  check(`sitemap has ${slug}`, sm.includes(`/name-change-after-marriage/${slug}`));
}
check('sitemap omits Wyoming', !sm.includes('/name-change-after-marriage/wyoming'));
check('sitemap omits Alabama', !sm.includes('/name-change-after-marriage/alabama'));
check('sitemap still has home', sm.includes('<loc>https://after-i-do.com/</loc>'));

// ── meta / noindex ─────────────────────────────────────────────────────────
const njMeta = metaForPath('/name-change-after-marriage/new-jersey', named, isDetailedStateSlug);
check('detailed NJ indexed', !njMeta.noindex);
check('detailed NJ title', njMeta.title.includes('New Jersey'));

const wyMeta = metaForPath('/name-change-after-marriage/wyoming', named, isDetailedStateSlug);
check('basic Wyoming noindex', wyMeta.noindex === true);
check('basic Wyoming title still names state', wyMeta.title.includes('Wyoming'));

// Without the detailed callback, unknown behaviour defaults to indexable
// (legacy callers); Worker always passes isDetailedStateSlug.
const legacy = metaForPath('/name-change-after-marriage/new-jersey', named);
check('legacy metaForPath without callback stays indexable', !legacy.noindex);

// ── SSR body ───────────────────────────────────────────────────────────────
const njHtml = stateLandingBodyHtml('/name-change-after-marriage/new-jersey');
check('NJ SSR present', typeof njHtml === 'string' && njHtml!.includes('seo-landing'));
check(
  'NJ SSR has official vital-record link',
  !!njHtml && njHtml.includes('https://www.nj.gov/health/vital/order-vital/'),
);
check(
  'NJ SSR has MVC name-change link',
  !!njHtml && njHtml.includes('https://www.nj.gov/mvc/drivertopics/namechange.htm'),
);
check('NJ SSR does not claim we submit forms', !!njHtml && njHtml.includes('does not submit forms'));

const caHtml = stateLandingBodyHtml('/name-change-after-marriage/california');
check(
  'CA SSR has DMV official link',
  !!caHtml &&
    caHtml.includes(
      'https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/updating-information-on-your-driver-license-or-identification-dl-id-card/',
    ),
);

const wyHtml = stateLandingBodyHtml('/name-change-after-marriage/wyoming');
check('Wyoming SSR honesty blurb', !!wyHtml && wyHtml.includes("haven't verified"));
check('Wyoming SSR invents nothing local', !!wyHtml && !wyHtml.includes('Wyoming DMV requires'));

check('unknown slug SSR null', stateLandingBodyHtml('/name-change-after-marriage/atlantis') === null);
check('non-state path SSR null', stateLandingBodyHtml('/premium') === null);
check('stateSlug DC', stateSlug('District of Columbia') === 'district-of-columbia');

console.log(failures === 0 ? '\nAll SEO checks passed.' : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
