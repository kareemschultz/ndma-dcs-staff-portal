/**
 * Auth setup — logs in once and saves browser storage state.
 * All other tests reuse this session (no repeated login calls).
 */
import { test as setup, expect } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join(import.meta.dirname, ".auth/user.json");

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  // Fill credentials
  await page.fill('input[type="email"]', "admin@ndma.gov");
  await page.fill('input[type="password"]', "admin1234");
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL("/", { timeout: 15_000 });

  // Verify we are actually logged in
  await expect(page).toHaveURL("/");

  // Save the auth state for reuse
  await page.context().storageState({ path: AUTH_FILE });
});
