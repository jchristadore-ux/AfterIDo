/**
 * Extract https URLs from state guidance data and fetch each one.
 *
 * Exit 0 when every URL returns 2xx/3xx, or a 401/403 WAF challenge (warned).
 * 404 and 5xx fail the run. Network / TLS failures also fail — fix or remove
 * the URL rather than shipping a broken official link.
 *
 * Usage: npm run check:state-links
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const TIMEOUT_MS = 15_000;

const SCAN_PATHS = ['src/data/states.ts'];

/** Also scan related state guidance files if present later. */
function relatedGuidanceFiles(): string[] {
  const dir = join(ROOT, 'src/data');
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.ts') && !name.endsWith('.tsx')) continue;
    if (name === 'states.ts') continue;
    if (/state/i.test(name)) out.push(join('src/data', name));
  }
  return out;
}

function collectFiles(): string[] {
  const files = [...SCAN_PATHS, ...relatedGuidanceFiles()];
  return [...new Set(files)].filter((rel) => {
    try {
      return statSync(join(ROOT, rel)).isFile();
    } catch {
      return false;
    }
  });
}

function extractUrls(source: string): string[] {
  const found = new Set<string>();
  const re = /https:\/\/[^\s"'`<>)\\]+/g;
  for (const match of source.matchAll(re)) {
    let url = match[0];
    url = url.replace(/[.,;:]+$/g, '');
    if (url.startsWith('https://')) found.add(url);
  }
  return [...found].sort();
}

type Result =
  | { url: string; ok: true; status: number; finalUrl: string; warn?: string }
  | { url: string; ok: false; status?: number; error: string };

async function checkUrl(url: string): Promise<Result> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ac.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    const status = res.status;
    await res.arrayBuffer().catch(() => undefined);
    if (status >= 200 && status < 400) {
      return { url, ok: true, status, finalUrl: res.url };
    }
    // Many .gov WAFs answer automated clients with 401/403 while the URL is
    // valid for browsers. Treat those as warnings (non-fatal). 404 and 5xx
    // still fail the run.
    if (status === 401 || status === 403) {
      return {
        url,
        ok: true,
        status,
        finalUrl: res.url,
        warn: `HTTP ${status} (WAF/bot challenge — verify manually in a browser)`,
      };
    }
    return { url, ok: false, status, error: `HTTP ${status}` };
  } catch (err) {
    const message =
      err instanceof Error
        ? (err as Error & { cause?: { code?: string } }).cause?.code || err.message
        : String(err);
    return { url, ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}

async function main(): Promise<void> {
  const files = collectFiles();
  const urls = new Set<string>();
  for (const rel of files) {
    const abs = join(ROOT, rel);
    const text = readFileSync(abs, 'utf8');
    for (const url of extractUrls(text)) urls.add(url);
  }

  const list = [...urls].sort();
  console.log(`Checking ${list.length} unique https URL(s) from:`);
  for (const rel of files) console.log(`  - ${relative(ROOT, join(ROOT, rel)) || rel}`);
  console.log('');

  const results: Result[] = [];
  const concurrency = 6;
  let index = 0;
  async function worker() {
    while (index < list.length) {
      const i = index++;
      const url = list[i]!;
      const result = await checkUrl(url);
      results[i] = result;
      const mark = !result.ok ? 'FAIL' : result.ok && result.warn ? 'WARN' : 'OK ';
      console.log(`${mark}  ${url}`);
      if (!result.ok) {
        console.log(`      ${result.status ? `HTTP ${result.status}` : result.error}`);
      } else if (result.warn) {
        console.log(`      ${result.warn}`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const failed = results.filter((r) => !r.ok);
  const warned = results.filter((r): r is Extract<Result, { ok: true }> => r.ok && !!r.warn);
  const passed = results.filter((r) => r.ok && !('warn' in r && r.warn));

  console.log('');
  console.log('── Summary ─────────────────────────────────────────────');
  console.log(`Passed: ${passed.length}`);
  console.log(`Warned: ${warned.length} (401/403 WAF — not treated as broken)`);
  console.log(`Failed: ${failed.length}`);
  if (warned.length) {
    console.log('');
    console.log('WAF-challenged URLs (confirm in a browser if unsure):');
    for (const w of warned) {
      console.log(`  - ${w.url}`);
      console.log(`    ${w.warn}`);
    }
  }
  if (failed.length) {
    console.log('');
    console.log('Broken or unreachable links:');
    for (const f of failed) {
      console.log(`  - ${f.url}`);
      console.log(`    ${f.status ? `HTTP ${f.status}` : f.error}`);
    }
    process.exitCode = 1;
    return;
  }
  console.log('All state guidance links look healthy.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
