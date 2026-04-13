/**
 * On-Call Roster E2E tests.
 */
import { test, expect } from "@playwright/test";

test.describe("On-Call Roster", () => {
  test("loads the roster page", async ({ page }) => {
    await page.goto("/rota");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading").filter({ hasText: /roster|rota|on.call/i }).first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test("no console errors on roster page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/rota");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);

    const critical = errors.filter((e) => !e.includes("favicon"));
    expect(critical, `Roster page errors: ${critical.join("\n")}`).toHaveLength(0);
  });

  test("displays schedule content or empty state", async ({ page }) => {
    await page.goto("/rota");
    await page.waitForLoadState("networkidle");

    // Either schedule cards / rows or an empty state
    const schedule = page.locator("table, [data-testid='schedule'], .schedule").first();
    const empty = page.getByText(/no schedule|no rota|not assigned/i).first();

    const hasSchedule = await schedule.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasEmpty = await empty.isVisible({ timeout: 2_000 }).catch(() => false);
    expect(hasSchedule || hasEmpty, "Expected schedule content or empty state").toBe(true);
  });
});
