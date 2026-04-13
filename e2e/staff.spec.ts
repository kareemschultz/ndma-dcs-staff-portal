/**
 * Staff directory E2E tests.
 */
import { test, expect } from "@playwright/test";

test.describe("Staff Directory", () => {
  test("loads the staff page", async ({ page }) => {
    await page.goto("/staff");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading").filter({ hasText: /staff/i }).first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test("no console errors on staff page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/staff");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);

    const critical = errors.filter((e) => !e.includes("favicon"));
    expect(critical, `Staff page errors: ${critical.join("\n")}`).toHaveLength(0);
  });

  test("displays at least one staff member row or empty state", async ({ page }) => {
    await page.goto("/staff");
    await page.waitForLoadState("networkidle");

    // Either a table row or an empty state message
    const row = page.locator("tbody tr, [role='row']").first();
    const empty = page.getByText(/no staff|no members|empty/i).first();

    const hasRow = await row.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasEmpty = await empty.isVisible({ timeout: 2_000 }).catch(() => false);
    expect(hasRow || hasEmpty, "Expected either staff rows or empty state").toBe(true);
  });

  test("search/filter input is available", async ({ page }) => {
    await page.goto("/staff");
    await page.waitForLoadState("networkidle");

    const search = page.getByRole("searchbox").first();
    const filterInput = page.getByPlaceholder(/search|filter|name/i).first();

    const hasSearch = await search.isVisible({ timeout: 3_000 }).catch(() => false);
    const hasFilter = await filterInput.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasSearch || hasFilter, "Expected a search/filter input").toBe(true);
  });
});
