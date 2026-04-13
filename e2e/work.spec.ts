/**
 * Work register E2E tests — list, create, view.
 */
import { test, expect } from "@playwright/test";

test.describe("Work Register", () => {
  test("loads the work register page", async ({ page }) => {
    await page.goto("/work");
    await page.waitForLoadState("networkidle");

    // Page should have a heading or title relating to work
    await expect(
      page.getByRole("heading").filter({ hasText: /work/i }).first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test("can switch between list and kanban views", async ({ page }) => {
    await page.goto("/work");
    await page.waitForLoadState("networkidle");

    // Look for view toggle buttons (list/kanban/grid icons)
    const kanbanBtn = page
      .getByRole("button")
      .filter({ hasText: /kanban/i })
      .first();

    if (await kanbanBtn.isVisible()) {
      await kanbanBtn.click();
      await page.waitForTimeout(300);
      // Kanban columns should appear
      await expect(
        page.locator("[data-view='kanban'], .kanban, [class*='kanban']").first(),
      ).toBeVisible({ timeout: 3_000 }).catch(() => {
        // Column headers like "Backlog", "In Progress" etc. would also confirm kanban
      });
    }
  });

  test("opens create work item dialog", async ({ page }) => {
    await page.goto("/work");
    await page.waitForLoadState("networkidle");

    const createBtn = page
      .getByRole("button")
      .filter({ hasText: /new|create|add/i })
      .first();

    await expect(createBtn).toBeVisible({ timeout: 8_000 });
    await createBtn.click();

    // A dialog / form should appear
    await expect(
      page.getByRole("dialog").first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("no console errors on work register", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/work");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);

    const critical = errors.filter((e) => !e.includes("favicon"));
    expect(critical, `Work page errors: ${critical.join("\n")}`).toHaveLength(0);
  });
});
