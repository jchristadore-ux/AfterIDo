/**
 * Stripe mode classification — absent vs test vs live.
 * Run via: node --experimental-strip-types worker/env.test.mts
 */
import { stripeModeOf, publicConfig, type Env } from './env.ts';

let failures = 0;
function check(label: string, ok: boolean) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) failures++;
}

function envWithKey(key?: string): Env {
  // ASSETS is unused by these helpers; stub for typing.
  return { ASSETS: null as unknown as Fetcher, STRIPE_SECRET_KEY: key };
}

check('undefined → absent', stripeModeOf(envWithKey(undefined)) === 'absent');
check('empty → absent', stripeModeOf(envWithKey('')) === 'absent');
check('sk_test_ → test', stripeModeOf(envWithKey('sk_test_abc')) === 'test');
check('sk_live_ → live', stripeModeOf(envWithKey('sk_live_abc')) === 'live');
check('garbage → absent', stripeModeOf(envWithKey('pk_test_x')) === 'absent');

const pubTest = publicConfig(envWithKey('sk_test_abc'));
check('publicConfig testMode true for sk_test_', pubTest.testMode === true && pubTest.stripeMode === 'test');

const pubAbsent = publicConfig(envWithKey(undefined));
check('publicConfig absent is not testMode', pubAbsent.testMode === false && pubAbsent.stripeMode === 'absent');

const pubLive = publicConfig(envWithKey('sk_live_abc'));
check('publicConfig live is not testMode', pubLive.testMode === false && pubLive.stripeMode === 'live');

if (failures) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('\nAll env checks passed.');
