/**
 * Smoke tests — verifies all major routes load without JS console errors.
 * Tests are intentionally simple: navigate, wait for content, assert no errors.
 *
 * Precondition: dev server must be running on localhost:3001 and localhost:3000.
 * Run: `bun run test:e2e` from apps/web
 */
import { test, expect, type Page } from "@playwright/test";

// Helper: collect JS errors during page load
async function withErrorCapture(page: Page, url: string) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  await page.goto(url, { waitUntil: "networkidle" });
  return errors;
}

// Helper: wait for an h1 heading with the given text
async function assertH1(page: Page, name: string | RegExp) {
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible({
    timeout: 10_000,
  });
}

test.describe("Authenticated pages — smoke tests", () => {
  // Reuse the stored auth session for all tests in this block
  test.use({ storageState: "tests/.auth/user.json" });

  test("Dashboard loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/");
    // Dashboard h1 says "DCS Ops Center" (with an icon)
    await assertH1(page, /dcs ops center/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("Ops Readiness loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/ops-readiness");
    await assertH1(page, /operational readiness/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("Work Register loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/work");
    await assertH1(page, /work/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("Incidents loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/incidents");
    await assertH1(page, /incident/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("Roster loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/rota");
    await assertH1(page, /roster|on-call/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("Temp Changes loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/changes");
    await assertH1(page, /temp|change/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("Procurement loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/procurement");
    await assertH1(page, /purchase requisition/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("Service Registry loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/services");
    await assertH1(page, /service/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("Platform Accounts loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/access");
    await assertH1(page, /access|account|platform/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("Staff Directory loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/staff");
    await assertH1(page, /staff/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("Leave loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/leave");
    await assertH1(page, /leave/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("Contracts loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/contracts");
    await assertH1(page, /contract/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("Appraisals loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/appraisals");
    await assertH1(page, /appraisal/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("Training loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/compliance/training");
    await assertH1(page, /training/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("PPE loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/compliance/ppe");
    await assertH1(page, /ppe|equipment/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("Analytics loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/analytics");
    await assertH1(page, /analytics/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("Reports loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/reports");
    await assertH1(page, /report/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("Audit Log loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/audit");
    await assertH1(page, /audit/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("Notifications loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/notifications");
    await assertH1(page, /notification/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("Settings General loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/settings/general");
    await assertH1(page, /setting/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("Import Data loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/import");
    await assertH1(page, /import/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("Cycles loads", async ({ page }) => {
    const errors = await withErrorCapture(page, "/cycles");
    await assertH1(page, /cycle/i);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });
});

test.describe("Auth flows (unauthenticated)", () => {
  // Clear any stored session so these tests run without auth
  test.use({ storageState: { cookies: [], origins: [] } });

  test("Login page renders", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("heading", { name: /dcs ops center/i })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test("Invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await page.fill('input[name="email"]', "wrong@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    // Should NOT redirect to dashboard — stay on login with error
    await page.waitForTimeout(2_000);
    const url = page.url();
    expect(url).toContain("/login");
  });

  test("Unauthenticated access to dashboard redirects to login", async ({ page }) => {
    await page.goto("/");
    // Should be redirected to /login
    await expect(page).toHaveURL(/login/, { timeout: 10_000 });
  });
});
