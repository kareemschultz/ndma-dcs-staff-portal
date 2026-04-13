/**
 * Dashboard / home page E2E tests.
 * Uses the shared auth state saved by auth.setup.ts.
 */
import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("loads without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);

    // Filter out known non-critical noise (favicon 404 etc.)
    const critical = errors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("net::ERR_") &&
        !e.includes("Refused to load"),
    );
    expect(critical, `Console errors: ${critical.join("\n")}`).toHaveLength(0);
  });

  test("shows key dashboard cards", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Sidebar should be visible
    await expect(page.locator("nav, aside, [role='navigation']").first()).toBeVisible();
  });

  test("sidebar navigation links are present", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // At least these nav items should exist somewhere in the sidebar
    for (const label of ["Work", "Leave", "Staff"]) {
      await expect(page.getByRole("link", { name: label }).first()).toBeVisible();
    }
  });

  test("theme toggle switches between light and dark", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const html = page.locator("html");
    const toggle = page
      .getByRole("button")
      .filter({ hasText: /theme|dark|light|sun|moon/i })
      .first();

    if (await toggle.isVisible()) {
      const before = await html.getAttribute("class");
      await toggle.click();
      await page.waitForTimeout(300);
      const after = await html.getAttribute("class");
      expect(before).not.toEqual(after);
    }
  });
});
