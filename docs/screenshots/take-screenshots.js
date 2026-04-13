import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = '/home/karetech/projects/ndma-dcs-staff-portal/docs/screenshots';
const BASE_URL = 'http://localhost:3001';

const routes = [
  { slug: 'dashboard',            path: '/' },
  { slug: 'ops-readiness',        path: '/ops-readiness' },
  { slug: 'work',                 path: '/work' },
  { slug: 'cycles',               path: '/cycles' },
  { slug: 'incidents',            path: '/incidents' },
  { slug: 'rota',                 path: '/rota' },
  { slug: 'changes',              path: '/changes' },
  { slug: 'procurement',          path: '/procurement' },
  { slug: 'services',             path: '/services' },
  { slug: 'access',               path: '/access' },
  { slug: 'staff',                path: '/staff' },
  { slug: 'leave',                path: '/leave' },
  { slug: 'contracts',            path: '/contracts' },
  { slug: 'appraisals',           path: '/appraisals' },
  { slug: 'compliance-training',  path: '/compliance/training' },
  { slug: 'compliance-ppe',       path: '/compliance/ppe' },
  { slug: 'compliance-items',     path: '/compliance/items' },
  { slug: 'analytics',            path: '/analytics' },
  { slug: 'reports',              path: '/reports' },
  { slug: 'audit',                path: '/audit' },
  { slug: 'import',               path: '/import' },
  { slug: 'notifications',        path: '/notifications' },
  { slug: 'settings-general',     path: '/settings/general' },
  { slug: 'settings-departments', path: '/settings/departments' },
  { slug: 'settings-leave-types', path: '/settings/leave-types' },
  { slug: 'settings-escalation',  path: '/settings/escalation' },
  { slug: 'settings-roles',       path: '/settings/roles' },
];

// ── Hide all TanStack devtools overlays ─────────────────────────────────────
// Uses both CSS class targeting AND text-content scanning so it works regardless
// of how the devtools packages render their DOM.
async function hideDevtools(page) {
  await page.evaluate(() => {
    // 1. CSS-class based hiding
    const style = document.getElementById('__hide-devtools__') ?? document.createElement('style');
    style.id = '__hide-devtools__';
    style.textContent = `
      [class^="tsqd-"], [class*=" tsqd-"],
      [class^="tsrd-"], [class*=" tsrd-"],
      #TanStackRouterDevtools,
      [id^="TanStackRouter"],
      [data-testid*="devtools"]
      { display: none !important; }
    `;
    if (!style.parentNode) document.head.appendChild(style);

    // 2. Text-content scan — catches elements where class names aren't predictable
    const walk = (el) => {
      if (!el || el === document.body) return;
      const text = el.textContent?.trim() ?? '';
      const isDevtools =
        text === 'TanStack Router' ||
        text === 'React Query' ||
        el.getAttribute('aria-label')?.toLowerCase().includes('tanstack') ||
        el.getAttribute('title')?.toLowerCase().includes('tanstack');
      if (isDevtools) {
        // Walk up to the top-level body child (the devtools root)
        let root = el;
        while (root.parentElement && root.parentElement !== document.body) {
          root = root.parentElement;
        }
        root.style.setProperty('display', 'none', 'important');
        return;
      }
      for (const child of el.children) walk(child);
    };
    // Only scan direct body children (devtools portals render there)
    for (const child of document.body.children) {
      if (child.id !== 'root' && child.id !== 'app') walk(child);
    }
  });
}

const results = [];
const consoleErrors = {};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  let currentSlug = 'login';
  page.on('console', msg => {
    if (msg.type() === 'error') {
      if (!consoleErrors[currentSlug]) consoleErrors[currentSlug] = [];
      consoleErrors[currentSlug].push(msg.text());
    }
  });

  // ── Login page ────────────────────────────────────────────────────────────
  console.log('Navigating to /login ...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await hideDevtools(page);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'login-light.png') });
  console.log('✓ login-light.png');

  // ── Authenticate ──────────────────────────────────────────────────────────
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });
  await page.fill('input[name="email"]', 'admin@ndma.gov.gh');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // TanStack Router does a client-side redirect — wait for the cookie to be set
  // then navigate explicitly to / (more reliable than waitForURL with CSR)
  await page.waitForTimeout(3500);
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);

  const afterLoginUrl = page.url();
  console.log('After login, current URL:', afterLoginUrl);

  if (afterLoginUrl.includes('/login')) {
    console.error('ERROR: Still on login page — auth may have failed. Aborting.');
    await browser.close();
    process.exit(1);
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  currentSlug = 'dashboard';
  if (!consoleErrors[currentSlug]) consoleErrors[currentSlug] = [];
  await hideDevtools(page);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'dashboard-light.png') });
  results.push({ slug: 'dashboard', url: afterLoginUrl, status: 'ok' });
  console.log('✓ dashboard-light.png');

  // ── All remaining pages ───────────────────────────────────────────────────
  for (const route of routes.slice(1)) {
    currentSlug = route.slug;
    if (!consoleErrors[currentSlug]) consoleErrors[currentSlug] = [];

    const fullUrl = `${BASE_URL}${route.path}`;
    console.log(`Navigating to ${fullUrl} ...`);

    let status = 'ok';
    let httpStatus = 0;

    try {
      const response = await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      await hideDevtools(page);

      httpStatus = response ? response.status() : 0;
      if (httpStatus >= 400) status = `http-${httpStatus}`;

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${route.slug}-light.png`) });
      console.log(`  ✓ ${route.slug}-light.png (HTTP ${httpStatus})`);
      results.push({ slug: route.slug, url: page.url(), status, httpStatus });
    } catch (err) {
      status = `error: ${err.message.substring(0, 100)}`;
      console.error(`  ✗ ${route.slug}: ${err.message.substring(0, 100)}`);
      try {
        await hideDevtools(page);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${route.slug}-light.png`) });
      } catch (_) {}
      results.push({ slug: route.slug, url: page.url(), status, httpStatus });
    }
  }

  await browser.close();

  // ── Report ────────────────────────────────────────────────────────────────
  const report = { timestamp: new Date().toISOString(), results, consoleErrors };
  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'report.json'), JSON.stringify(report, null, 2));

  console.log('\n=== SUMMARY ===');
  for (const r of results) {
    const errors = (consoleErrors[r.slug] || []).filter(e => !e.includes('favicon')).length;
    const errTag = errors ? ` [${errors} JS errors]` : '';
    console.log(`  ${r.status === 'ok' ? '✓' : '✗'} ${r.slug}${errTag}`);
  }

  const pagesWithErrors = Object.entries(consoleErrors)
    .map(([slug, errs]) => [slug, errs.filter(e => !e.includes('favicon'))])
    .filter(([, errs]) => errs.length > 0);

  if (pagesWithErrors.length === 0) {
    console.log('\nZero console errors across all pages.');
  } else {
    console.log('\n=== CONSOLE ERRORS ===');
    for (const [slug, errors] of pagesWithErrors) {
      console.log(`\n  [${slug}]`);
      errors.forEach(e => console.log(`    - ${e}`));
    }
  }
})();
