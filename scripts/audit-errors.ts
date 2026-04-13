/**
 * Audit script — visits every page, collects console errors and warnings.
 * Run: xvfb-run bun run scripts/audit-errors.ts
 */
import { chromium } from "playwright";

const BASE_URL = "http://localhost:3002";
const EMAIL = "admin@ndma.gov";
const PASSWORD = "admin1234";

const PAGES = [
  "/", "/ops-readiness", "/work", "/work/workload", "/cycles",
  "/incidents", "/rota", "/changes", "/procurement", "/staff",
  "/leave", "/contracts", "/appraisals", "/services", "/access",
  "/compliance/training", "/compliance/ppe", "/compliance/items",
  "/reports", "/audit", "/notifications",
  "/settings/general", "/settings/departments", "/settings/leave-types",
  "/settings/escalation", "/settings/roles", "/settings/automation",
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const allErrors: { page: string; type: string; text: string }[] = [];

  // Collect console messages
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      allErrors.push({ page: page.url(), type: msg.type(), text: msg.text() });
    }
  });

  // Collect page errors (unhandled exceptions)
  page.on("pageerror", (err) => {
    allErrors.push({ page: page.url(), type: "pageerror", text: err.message });
  });

  // Login
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/`, { timeout: 15_000 });

  // Visit each page
  for (const path of PAGES) {
    await page.goto(`${BASE_URL}${path}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);
    console.log(`✓ ${path}`);
  }

  await browser.close();

  // Report
  if (allErrors.length === 0) {
    console.log("\n✅ No console errors or warnings found.");
  } else {
    console.log(`\n❌ Found ${allErrors.length} issues:\n`);
    const seen = new Set<string>();
    for (const e of allErrors) {
      const key = `${e.type}::${e.text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const shortPage = e.page.replace(BASE_URL, "");
      console.log(`[${e.type.toUpperCase()}] ${shortPage}\n  ${e.text}\n`);
    }
  }
}

main().catch(console.error).finally(() => process.exit(0));
