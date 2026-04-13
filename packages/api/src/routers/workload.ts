import { z } from "zod";
import { db, workItems } from "@ndma-dcs-staff-portal/db";
import { and, isNotNull, sql } from "drizzle-orm";

import { protectedProcedure } from "../index";

// ── Output schema ──────────────────────────────────────────────────────────

const WorkloadEntrySchema = z.object({
  staffProfileId: z.string(),
  staffName: z.string(),
  itemCount: z.number(),
  loadLevel: z.enum(["overloaded", "normal", "low"]),
});

// ── Router ─────────────────────────────────────────────────────────────────

export const workloadRouter = {
  get: protectedProcedure
    .input(
      z.object({
        weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        weekEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    )
    .output(z.array(WorkloadEntrySchema))
    .handler(async () => {
      // Fetch all active (non-done, non-cancelled) work items that have an assignee
      const items = await db.query.workItems.findMany({
        where: and(
          isNotNull(workItems.assignedToId),
          sql`${workItems.status} NOT IN ('done', 'cancelled')`,
        ),
        with: {
          assignedTo: { with: { user: true } },
        },
      });

      // Group by staff profile and count items
      const byStaff = new Map<
        string,
        { staffName: string; count: number }
      >();

      for (const item of items) {
        if (!item.assignedToId || !item.assignedTo) continue;
        const name = item.assignedTo.user?.name ?? "Unknown";
        const existing = byStaff.get(item.assignedToId);
        if (existing) {
          existing.count++;
        } else {
          byStaff.set(item.assignedToId, { staffName: name, count: 1 });
        }
      }

      // Classify load level: ≥5 = overloaded, ≤1 = low, 2–4 = normal
      return Array.from(byStaff.entries()).map(
        ([staffProfileId, { staffName, count }]) => ({
          staffProfileId,
          staffName,
          itemCount: count,
          loadLevel: (
            count >= 5 ? "overloaded" : count <= 1 ? "low" : "normal"
          ) as "overloaded" | "normal" | "low",
        }),
      );
    }),
};
