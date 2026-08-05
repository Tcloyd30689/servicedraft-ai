/**
 * qa-shot.mjs — vision-QA screenshot helper for the sprint QA-VISION VERIFIER tier.
 *
 * Captures a full-page PNG of a route (optionally logged in) so a verifier
 * subagent can READ the image and visually inspect the result against the
 * sprint's definition of done.
 *
 * Usage:
 *   node scripts/qa-shot.mjs <url-or-path> <output-filename> [--login] [--wait=ms] [--width=px] [--height=px]
 *
 * Examples:
 *   node scripts/qa-shot.mjs login login.png
 *   node scripts/qa-shot.mjs dashboard dashboard.png --login
 *   node scripts/qa-shot.mjs http://localhost:3011/admin admin.png --login --wait=3000
 *
 * Notes:
 *   - Bare paths are resolved against BASE_URL (default http://localhost:3011).
 *     Prefer "login" over "/login" — Git Bash rewrites leading-slash arguments
 *     into Windows paths. (The script detects and undoes that, but the bare
 *     form is cleaner.)
 *   - Screenshots are written to qa-screens/ (created if missing, gitignored).
 *   - --login requires TEST_ACCOUNT_EMAIL and TEST_ACCOUNT_PASSWORD in .env.local.
 *   - Every failure mode exits non-zero with a plain-English console message so
 *     the verifier can fall back to non-visual checks instead of guessing.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');
const OUT_DIR = path.join(ROOT, 'qa-screens');
const DEFAULT_BASE_URL = 'http://localhost:3011';

/** Minimal .env.local parser — no dotenv dependency. */
function loadEnvLocal() {
  const env = {};
  if (!fs.existsSync(ENV_PATH)) {
    console.warn('[qa-shot] No .env.local found — continuing without it.');
    return env;
  }
  const raw = fs.readFileSync(ENV_PATH, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) env[key] = value;
  }
  return env;
}

function parseArgs(argv) {
  const positional = [];
  const flags = { login: false, wait: 1500, width: 1440, height: 900 };

  for (const arg of argv) {
    if (arg === '--login') {
      flags.login = true;
    } else if (arg.startsWith('--wait=')) {
      flags.wait = Number(arg.slice(7)) || 0;
    } else if (arg.startsWith('--width=')) {
      flags.width = Number(arg.slice(8)) || flags.width;
    } else if (arg.startsWith('--height=')) {
      flags.height = Number(arg.slice(9)) || flags.height;
    } else if (arg.startsWith('--')) {
      console.warn(`[qa-shot] Ignoring unknown flag: ${arg}`);
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

/**
 * Git Bash (MSYS) on Windows rewrites a leading-slash argument like "/login"
 * into an absolute path such as "C:/Program Files/Git/login" before Node ever
 * sees it. Undo that so both `/login` and `login` work from any shell.
 */
function demangleMsysPath(input) {
  const msys = /^[A-Za-z]:[\\/].*?[\\/]Git[\\/](.+)$/.exec(input);
  if (!msys) return input;
  const recovered = `/${msys[1].replace(/\\/g, '/')}`;
  console.warn(
    `[qa-shot] Detected Git Bash path mangling — treating "${input}" as "${recovered}". ` +
      'Tip: pass routes without the leading slash (e.g. "login") to avoid this.',
  );
  return recovered;
}

function resolveUrl(input, baseUrl) {
  if (/^https?:\/\//i.test(input)) return input;
  const cleaned = demangleMsysPath(String(input));
  return `${baseUrl.replace(/\/+$/, '')}/${cleaned.replace(/^\/+/, '')}`;
}

function fail(message) {
  console.error(`[qa-shot] FAILED — ${message}`);
  process.exit(1);
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const [targetArg, outputArg] = positional;

  if (!targetArg || !outputArg) {
    fail(
      'missing arguments. Usage: node scripts/qa-shot.mjs <url-or-path> <output-filename> [--login] [--wait=ms]',
    );
  }

  const env = loadEnvLocal();
  const baseUrl = env.QA_BASE_URL || DEFAULT_BASE_URL;
  const targetUrl = resolveUrl(targetArg, baseUrl);
  const fileName = outputArg.toLowerCase().endsWith('.png')
    ? outputArg
    : `${outputArg}.png`;
  const outPath = path.join(OUT_DIR, fileName);

  // Playwright is a dev dependency and its browser binary is a separate
  // download — either can be missing on a fresh machine. Report clearly.
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    fail(
      'the "playwright" package is not installed. Run: npm install -D playwright && npx playwright install chromium',
    );
  }

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    fail(
      `could not launch headless chromium (${err.message}). Run: npx playwright install chromium`,
    );
  }

  try {
    const context = await browser.newContext({
      viewport: { width: flags.width, height: flags.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    if (flags.login) {
      const email = env.TEST_ACCOUNT_EMAIL;
      const password = env.TEST_ACCOUNT_PASSWORD;

      if (!email || !password) {
        console.warn(
          '[qa-shot] --login requested but TEST_ACCOUNT_EMAIL / TEST_ACCOUNT_PASSWORD are missing from .env.local. Capturing logged-out instead.',
        );
      } else {
        const loginUrl = resolveUrl('/login', baseUrl);
        console.log(`[qa-shot] Logging in at ${loginUrl} as ${email}`);
        try {
          await page.goto(loginUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          });
          // The login page renders a "checking auth" spinner before the form.
          await page.waitForSelector('#email', { timeout: 20000 });
          await page.fill('#email', email);
          await page.fill('#password', password);
          await Promise.all([
            page.waitForURL((url) => !url.pathname.startsWith('/login'), {
              timeout: 30000,
            }),
            page.click('form button[type="submit"]'),
          ]);
          console.log(`[qa-shot] Login OK — landed on ${page.url()}`);
        } catch (err) {
          fail(
            `login failed (${err.message}). Check that the dev server is running on ${baseUrl} and the test credentials are valid.`,
          );
        }
      }
    }

    console.log(`[qa-shot] Capturing ${targetUrl}`);
    try {
      await page.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
    } catch (err) {
      fail(
        `could not load ${targetUrl} (${err.message}). Is the dev server running? Start it with: npm run dev -- -p 3011`,
      );
    }

    // Let fonts, animations, and client-side data fetches settle.
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch {
      console.warn('[qa-shot] Network did not go idle — capturing anyway.');
    }
    if (flags.wait > 0) await page.waitForTimeout(flags.wait);

    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`[qa-shot] Saved ${path.relative(ROOT, outPath)}`);
  } catch (err) {
    fail(`unexpected error — ${err.stack || err.message}`);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

main().catch((err) => fail(err.stack || err.message));
