/**
 * Smoke tests — visit every page, assert no unhandled JS errors.
 * This mirrors the audit-errors.ts script but runs as a proper test suite.
 */
import { test, expect } from "@playwright/test";

const PAGES = [
  { path: "/", name: "Dashboard" },
  { path: "/ops-readiness", name: "Ops Readiness" },
  { path: "/work", name: "Work Register" },
  { path: "/work/workload", name: "Workload" },
  { path: "/incidents", name: "Incidents" },
  { path: "/rota", name: "Roster" },
  { path: "/changes", name: "Changes" },
  { path: "/procurement", name: "Procurement" },
  { path: "/staff", name: "Staff" },
  { path: "/leave", name: "Leave" },
  { path: "/contracts", name: "Contracts" },
  { path: "/appraisals", name: "Appraisals" },
  { path: "/services", name: "Services" },
  { path: "/access", name: "Access" },
  { path: "/compliance/training", name: "Compliance Training" },
  { path: "/compliance/ppe", name: "Compliance PPE" },
  { path: "/compliance/items", name: "Compliance Items" },
  { path: "/reports", name: "Reports" },
  { path: "/audit", name: "Audit Log" },
  { path: "/notifications", name: "Notifications" },
  { path: "/settings/general", name: "Settings General" },
  { path: "/settings/departments", name: "Settings Departments" },
  { path: "/settings/leave-types", name: "Settings Leave Types" },
  { path: "/settings/roles", name: "Settings Roles" },
];

for (const { path, name } of PAGES) {
  test(`${name} (${path}) loads without JS errors`, async ({ page }) => {
    const errors: { type: string; text: string }[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push({ type: "console.error", text: msg.text() });
      }
    });
    page.on("pageerror", (err) => {
      errors.push({ type: "pageerror", text: err.message });
    });

    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);

    // Filter out known non-critical browser noise
    const critical = errors.filter(
      (e) =>
        !e.text.includes("favicon") &&
        !e.text.includes("net::ERR_ABORTED") &&
        !e.text.includes("Failed to load resource"),
    );

    if (critical.length > 0) {
      const report = critical.map((e) => `[${e.type}] ${e.text}`).join("\n");
      expect.soft(critical, `${name} had JS errors:\n${report}`).toHaveLength(0);
    }
  });
}
