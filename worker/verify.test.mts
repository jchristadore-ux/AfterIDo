/**
 * The security tests.
 *
 * These cover the two pieces of maths the whole business model rests on: the
 * session signature, which decides who you are, and the Stripe webhook
 * signature, which decides whether you have paid. Both are hand-rolled over
 * WebCrypto rather than taken from a library, so they are worth proving rather
 * than assuming — and the interesting cases here are the failures. A forged
 * user id, a tampered webhook body and a replayed old event must all be
 * rejected; if any of these ever passes, somebody gets Premium for free or
 * gets into somebody else's account.
 *
 *     npm test
 *
 * No test framework and no dependency: Node strips the types and runs it.
 */
import { signSession, verifySession, hmacSha256Hex, timingSafeEqual } from './crypto.ts';
import { verifyWebhook } from './stripe.ts';
import { metaForPath, stateSlug } from '../shared/seo.ts';

let failures = 0;
function check(label: string, ok: boolean) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) failures++;
}

const SECRET = 'a'.repeat(48);

// ── Sessions ───────────────────────────────────────────────────────────────
const good = await signSession(SECRET, { sub: 'usr_1', exp: Math.floor(Date.now() / 1000) + 60 });
check('valid session verifies', (await verifySession(SECRET, good))?.sub === 'usr_1');
check('wrong secret rejected', (await verifySession('b'.repeat(48), good)) === null);
check('tampered payload rejected', (await verifySession(SECRET, 'x' + good)) === null);

const expired = await signSession(SECRET, { sub: 'usr_1', exp: Math.floor(Date.now() / 1000) - 1 });
check('expired session rejected', (await verifySession(SECRET, expired)) === null);

// The forgery that matters: swap the user id but keep a valid-looking shape.
const [payload] = good.split('.');
const claims = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
claims.sub = 'usr_victim';
const forgedPayload = Buffer.from(JSON.stringify(claims))
  .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const forged = `${forgedPayload}.${good.split('.')[1]}`;
check('forged user id rejected', (await verifySession(SECRET, forged)) === null);

// ── Stripe webhook ─────────────────────────────────────────────────────────
const WH = 'whsec_test_secret';
const body = JSON.stringify({
  id: 'evt_1', type: 'checkout.session.completed', livemode: false,
  data: { object: { id: 'cs_1', payment_status: 'paid', client_reference_id: 'usr_1' } },
});
const ts = Math.floor(Date.now() / 1000);
const sig = await hmacSha256Hex(WH, `${ts}.${body}`);

check('valid signature accepted', (await verifyWebhook(body, `t=${ts},v1=${sig}`, WH))?.id === 'evt_1');
check('bad signature rejected', (await verifyWebhook(body, `t=${ts},v1=${'0'.repeat(64)}`, WH)) === null);
check('missing header rejected', (await verifyWebhook(body, null, WH)) === null);
check('wrong secret rejected', (await verifyWebhook(body, `t=${ts},v1=${sig}`, 'whsec_other')) === null);

const oldTs = ts - 1000;
const oldSig = await hmacSha256Hex(WH, `${oldTs}.${body}`);
check('replayed old event rejected', (await verifyWebhook(body, `t=${oldTs},v1=${oldSig}`, WH)) === null);

// A modified body with the original signature — the whole point of signing.
const tampered = body.replace('usr_1', 'usr_attacker');
check('tampered body rejected', (await verifyWebhook(tampered, `t=${ts},v1=${sig}`, WH)) === null);

// Stripe rotates secrets by sending two v1 signatures; either may match.
check(
  'multiple v1 signatures, one valid',
  (await verifyWebhook(body, `t=${ts},v1=${'0'.repeat(64)},v1=${sig}`, WH))?.id === 'evt_1',
);

check('timingSafeEqual same', timingSafeEqual('abc', 'abc'));
check('timingSafeEqual diff', !timingSafeEqual('abc', 'abd'));
check('timingSafeEqual length', !timingSafeEqual('abc', 'abcd'));

// ── SEO table ──────────────────────────────────────────────────────────────
const named = (slug: string) => (slug === 'new-jersey' ? 'New Jersey' : null);
check('state slug', stateSlug('District of Columbia') === 'district-of-columbia');
check('home meta', metaForPath('/', named).title.includes('Without the headache'));
check('app noindex', metaForPath('/app/checklist', named).noindex === true);
check('start noindex', metaForPath('/start', named).noindex === true);
check('premium indexed', !metaForPath('/premium', named).noindex);
check('state page meta', metaForPath('/name-change-after-marriage/new-jersey', named).title.includes('New Jersey'));
check('trailing slash', metaForPath('/premium/', named).title === metaForPath('/premium', named).title);
check('unknown path falls back', metaForPath('/nope', named).title.includes('AfterIDo'));

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
