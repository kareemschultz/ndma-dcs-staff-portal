/**
 * Screenshot script — capture all pages in light + dark mode.
 * Run with: bun run scripts/take-screenshots.ts
 *
 * Requires: dev server on 3001 + API on 3000 + auth session saved at e2e/.auth/user.json
 * Produces: docs/screenshots/<slug>-light.png and docs/screenshots/<slug>-dark.png
 */

import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

const BASE_URL = "http://localhost:8090";
const AUTH_FILE = path.join(import.meta.dirname, "../e2e/.auth/user.json");
const OUT_DIR = path.join(import.meta.dirname, "../docs/screenshots");

// Ensure output directory exists
fs.mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
  { path: "/", slug: "dashboard" },
  { path: "/ops-readiness", slug: "ops-readiness" },
  { path: "/work", slug: "work" },
  { path: "/work/workload", slug: "workload" },
  { path: "/incidents", slug: "incidents" },
  { path: "/rota", slug: "rota" },
  { path: "/changes", slug: "changes" },
  { path: "/procurement", slug: "procurement" },
  { path: "/staff", slug: "staff" },
  { path: "/leave", slug: "leave" },
  { path: "/leave/calendar", slug: "leave-calendar" },
  { path: "/contracts", slug: "contracts" },
  { path: "/appraisals", slug: "appraisals" },
  { path: "/services", slug: "services" },
  { path: "/access", slug: "access" },
  { path: "/compliance/training", slug: "compliance-training" },
  { path: "/compliance/ppe", slug: "compliance-ppe" },
  { path: "/compliance/items", slug: "compliance-items" },
  { path: "/analytics", slug: "analytics" },
  { path: "/reports", slug: "reports" },
  { path: "/audit", slug: "audit" },
  { path: "/notifications", slug: "notifications" },
  { path: "/settings/general", slug: "settings-general" },
  { path: "/settings/departments", slug: "settings-departments" },
  { path: "/settings/leave-types", slug: "settings-leave-types" },
  { path: "/settings/roles", slug: "settings-roles" },
  { path: "/settings/escalation", slug: "settings-escalation" },
  { path: "/import", slug: "import" },
  { path: "/login", slug: "login" },
];

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });

  for (const theme of ["light", "dark"] as const) {
    console.log(`\n=== Theme: ${theme} ===`);

    for (const page of PAGES) {
      let context;

      if (page.slug === "login") {
        // Login page — no auth, clear storageState
        context = await browser.newContext({
          viewport: { width: 1920, height: 1080 },
          colorScheme: theme,
        });
      } else {
        // Authenticated pages — reuse saved session
        context = await browser.newContext({
          viewport: { width: 1920, height: 1080 },
          storageState: AUTH_FILE,
          colorScheme: theme,
        });
      }

      const pw = await context.newPage();

      // Suppress console noise
      pw.on("console", () => {});
      pw.on("pageerror", () => {});

      try {
        await pw.goto(`${BASE_URL}${page.path}`, { waitUntil: "networkidle", timeout: 30_000 });

        // Set theme via the HTML class (next-themes stores in localStorage + html class)
        if (page.slug !== "login") {
          await pw.evaluate((t) => {
            document.documentElement.classList.remove("light", "dark");
            document.documentElement.classList.add(t);
            document.documentElement.style.colorScheme = t;
          }, theme);
          await pw.waitForTimeout(400);
        }

        const outPath = path.join(OUT_DIR, `${page.slug}-${theme}.png`);
        await pw.screenshot({ path: outPath, fullPage: false });
        console.log(`  ✓ ${page.slug}-${theme}.png`);
      } catch (err) {
        console.error(`  ✗ ${page.slug}-${theme}: ${(err as Error).message}`);
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();
  console.log("\nDone! Screenshots saved to docs/screenshots/");
}

takeScreenshots().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
