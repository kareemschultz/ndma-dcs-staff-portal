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

const THEMES = ['light', 'dark'];

// ── Clean up stale screenshots ────────────────────────────────────────────────
function cleanStale() {
  const stale = ['sign-in-light.png', 'sign-in-dark.png'];
  for (const f of stale) {
    const p = path.join(SCREENSHOT_DIR, f);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`Removed stale: ${f}`);
    }
  }
}

// ── Apply theme via localStorage BEFORE page load ────────────────────────────
async function setTheme(context, theme) {
  await context.addInitScript((t) => {
    localStorage.setItem('ndma-dcs-theme', t);
  }, theme);
}

// ── Force theme class on <html> after navigation (belt + suspenders) ─────────
async function applyThemeClass(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(t);
    localStorage.setItem('ndma-dcs-theme', t);
  }, theme);
  // Give next-themes a tick to reconcile
  await page.waitForTimeout(300);
}

const allResults = {};
const allErrors = {};

(async () => {
  cleanStale();

  const browser = await chromium.launch({ headless: true });

  for (const theme of THEMES) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  THEME: ${theme.toUpperCase()}`);
    console.log('='.repeat(60));

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });

    // Pre-set theme in every new page's localStorage
    await setTheme(context, theme);

    const page = await context.newPage();
    let currentSlug = 'login';
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const key = `${currentSlug}-${theme}`;
        if (!allErrors[key]) allErrors[key] = [];
        allErrors[key].push(msg.text());
      }
    });

    // ── Login page ────────────────────────────────────────────────────────
    console.log(`\nNavigating to /login ...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    await applyThemeClass(page, theme);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `login-${theme}.png`) });
    console.log(`  ✓ login-${theme}.png`);

    // ── Authenticate ──────────────────────────────────────────────────────
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.fill('input[name="email"]', 'admin@ndma.gov.gh');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3500);
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await applyThemeClass(page, theme);

    const afterLoginUrl = page.url();
    if (afterLoginUrl.includes('/login')) {
      console.error('ERROR: Still on login page — auth failed. Aborting theme:', theme);
      await context.close();
      continue;
    }

    // ── Dashboard ─────────────────────────────────────────────────────────
    currentSlug = 'dashboard';
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `dashboard-${theme}.png`) });
    allResults[`dashboard-${theme}`] = { slug: 'dashboard', theme, url: afterLoginUrl, status: 'ok' };
    console.log(`  ✓ dashboard-${theme}.png`);

    // ── All remaining pages ───────────────────────────────────────────────
    for (const route of routes.slice(1)) {
      currentSlug = route.slug;
      const fullUrl = `${BASE_URL}${route.path}`;
      console.log(`  Navigating to ${fullUrl} ...`);

      let status = 'ok';
      let httpStatus = 0;

      try {
        const response = await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1500);
        await applyThemeClass(page, theme);

        httpStatus = response ? response.status() : 0;
        if (httpStatus >= 400) status = `http-${httpStatus}`;

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${route.slug}-${theme}.png`) });
        console.log(`    ✓ ${route.slug}-${theme}.png (HTTP ${httpStatus})`);
        allResults[`${route.slug}-${theme}`] = { slug: route.slug, theme, url: page.url(), status, httpStatus };
      } catch (err) {
        status = `error: ${err.message.substring(0, 100)}`;
        console.error(`    ✗ ${route.slug}: ${err.message.substring(0, 100)}`);
        try {
          await applyThemeClass(page, theme);
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${route.slug}-${theme}.png`) });
        } catch (_) {}
        allResults[`${route.slug}-${theme}`] = { slug: route.slug, theme, url: page.url(), status, httpStatus };
      }
    }

    await context.close();
  }

  await browser.close();

  // ── Report ────────────────────────────────────────────────────────────────
  const results = Object.values(allResults);
  const report = {
    timestamp: new Date().toISOString(),
    themes: THEMES,
    totalPages: routes.length + 1, // +1 for login
    totalScreenshots: results.length,
    results,
    consoleErrors: allErrors,
  };
  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'report.json'), JSON.stringify(report, null, 2));

  console.log('\n=== SUMMARY ===');
  for (const theme of THEMES) {
    const themeResults = results.filter(r => r.theme === theme);
    const ok = themeResults.filter(r => r.status === 'ok').length;
    console.log(`  [${theme}] ${ok}/${themeResults.length} ok`);
  }

  const pagesWithErrors = Object.entries(allErrors)
    .map(([key, errs]) => [key, errs.filter(e => !e.includes('favicon'))])
    .filter(([, errs]) => errs.length > 0);

  if (pagesWithErrors.length === 0) {
    console.log('\nZero console errors across all pages and themes.');
  } else {
    console.log('\n=== CONSOLE ERRORS ===');
    for (const [key, errors] of pagesWithErrors) {
      console.log(`\n  [${key}]`);
      errors.forEach(e => console.log(`    - ${e}`));
    }
  }

  // Final count
  const total = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png')).length;
  console.log(`\nTotal screenshots in directory: ${total} (${routes.length + 1} pages × 2 themes = ${(routes.length + 1) * 2} expected)`);
})();
