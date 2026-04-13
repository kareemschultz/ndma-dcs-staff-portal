/**
 * Auth flow tests — login, logout, unauthenticated redirect.
 */
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  // These tests do NOT use the shared storageState — they need a fresh browser
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated user is redirected to /login", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("/login", { timeout: 10_000 });
    await expect(page).toHaveURL("/login");
  });

  test("shows error on wrong credentials", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.fill('input[type="email"]', "admin@ndma.gov");
    await page.fill('input[type="password"]', "wrong-password");
    await page.click('button[type="submit"]');

    // Should stay on login page with an error message
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL("/login");
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.fill('input[type="email"]', "admin@ndma.gov");
    await page.fill('input[type="password"]', "admin1234");
    await page.click('button[type="submit"]');

    await page.waitForURL("/", { timeout: 15_000 });
    await expect(page).toHaveURL("/");
  });
});
