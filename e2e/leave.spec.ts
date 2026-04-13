/**
 * Leave management E2E tests.
 */
import { test, expect } from "@playwright/test";

test.describe("Leave", () => {
  test("loads the leave page", async ({ page }) => {
    await page.goto("/leave");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading").filter({ hasText: /leave/i }).first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test("no console errors on leave page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/leave");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);

    const critical = errors.filter((e) => !e.includes("favicon"));
    expect(critical, `Leave page errors: ${critical.join("\n")}`).toHaveLength(0);
  });

  test("shows new leave request button", async ({ page }) => {
    await page.goto("/leave");
    await page.waitForLoadState("networkidle");

    const newBtn = page
      .getByRole("button", { name: /new|request|apply/i })
      .first();

    await expect(newBtn).toBeVisible({ timeout: 8_000 });
  });

  test("opens new leave request form", async ({ page }) => {
    await page.goto("/leave");
    await page.waitForLoadState("networkidle");

    // Try the /leave/new route directly if the button isn't found
    const newBtn = page.getByRole("button", { name: /new|request|apply/i }).first();
    if (await newBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await newBtn.click();
    } else {
      await page.goto("/leave/new");
    }

    await page.waitForLoadState("networkidle");
    // Either a dialog or a form page should appear
    const form = page.getByRole("form").first();
    const dialog = page.getByRole("dialog").first();
    const hasForm = await form.isVisible({ timeout: 3_000 }).catch(() => false);
    const hasDialog = await dialog.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasForm || hasDialog, "Expected a form or dialog for new leave request").toBe(true);
  });
});
