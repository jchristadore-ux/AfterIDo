/**
 * Email / reminder verification.
 *
 * Default (CI-safe): runs the mocked worker suite that exercises Resend success,
 * failure retries → dead-letter → a single operator alert. Never needs a real
 * Resend key and never sends mail.
 *
 * Optional live smoke (explicit opt-in only):
 *   VERIFY_EMAIL_LIVE=1
 *   RESEND_API_KEY=re_…
 *   EMAIL_FROM='AfterIDo <hello@after-i-do.com>'
 *   VERIFY_EMAIL_TO=you@your-domain.com   # safe inbox you control
 *   npm run check:email
 *
 * The live path sends exactly ONE message to VERIFY_EMAIL_TO and exits. It
 * refuses to run without VERIFY_EMAIL_LIVE=1 so CI cannot accidentally mail.
 *
 * Related: ALLOW_DEV_SIGNIN_LINKS=true lets local sign-in skip Resend entirely;
 * that is separate from this script and must never be set in production.
 *
 * Usage: npm run check:email
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LIVE = process.env.VERIFY_EMAIL_LIVE === '1';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(message: string): never {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function ok(message: string) {
  console.log(`ok  ${message}`);
}

function runUnitSuite() {
  const script = path.join(ROOT, 'worker', 'email.test.mts');
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--experimental-sqlite', script],
    { stdio: 'inherit', cwd: ROOT },
  );
  if (result.status !== 0) {
    fail(`email unit suite exited ${result.status ?? 'signal'}`);
  }
  ok('mocked Resend / dead-letter suite passed');
}

async function runLiveSmoke() {
  const apiKey = process.env.RESEND_API_KEY ?? '';
  const from = process.env.EMAIL_FROM ?? '';
  const to = process.env.VERIFY_EMAIL_TO ?? '';

  if (!apiKey.startsWith('re_')) fail('RESEND_API_KEY must be a re_… key for live smoke');
  if (!from.includes('@')) fail('EMAIL_FROM is required for live smoke');
  if (!to.includes('@')) fail('VERIFY_EMAIL_TO is required (safe inbox you control)');
  if (/@(after-i-do\.com)$/i.test(to) && !to.toLowerCase().startsWith('hello@')) {
    // Allow hello@ or any non-customer test inbox; still require explicit flag.
  }

  console.log(`Live smoke: sending ONE message to ${to} (VERIFY_EMAIL_LIVE=1)…`);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: '[AfterIDo] verify-email live smoke',
      text: [
        'This is the optional AfterIDo email live smoke.',
        'If you received this, Resend sending works for this from-address.',
        '',
        'Note: verifying a sending domain in Resend does not create a receive',
        'inbox for hello@ — use Cloudflare Email Routing or Google Workspace.',
      ].join('\n'),
    }),
  });
  const body = await response.text();
  if (!response.ok) {
    fail(`Resend live smoke HTTP ${response.status}: ${body.slice(0, 300)}`);
  }
  ok(`live smoke accepted by Resend (${response.status})`);
}

async function main() {
  runUnitSuite();
  if (LIVE) {
    await runLiveSmoke();
  } else {
    ok('skipped live Resend smoke (set VERIFY_EMAIL_LIVE=1 to send one test message)');
  }
  console.log('\nPASS: email verification completed.');
}

main().catch((err) => {
  fail(err instanceof Error ? err.message : String(err));
});
