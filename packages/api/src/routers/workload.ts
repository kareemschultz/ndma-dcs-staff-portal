import { z } from "zod";
import {
  db,
  staffProfiles,
  leaveRequests,
  onCallAssignments,
  onCallSchedules,
  temporaryChanges,
} from "@ndma-dcs-staff-portal/db";
import { and, eq, gte, lte, sql } from "drizzle-orm";

import { protectedProcedure } from "../index";

export const workloadRouter = {
  get: protectedProcedure
    .input(
      z.object({
        weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        weekEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        departmentId: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const { weekStart, weekEnd } = input;
      const today = new Date().toISOString().slice(0, 10);

      const staffList = await db.query.staffProfiles.findMany({
        where: and(
          eq(staffProfiles.status, "active"),
          input.departmentId
            ? eq(staffProfiles.departmentId, input.departmentId)
            : undefined,
        ),
        with: { user: true, department: true },
      });

      const workloadEntries = await Promise.all(
        staffList.map(async (staff) => {
          const [
            openWorkResult,
            overdueWorkResult,
            onCallThisWeek,
            onLeaveThisWeek,
            overdueChangesResult,
          ] = await Promise.all([
            // Open work items — primary owner OR contributor (deduplicated)
            db.execute(
              sql<{ count: number }>`
                SELECT COUNT(DISTINCT id)::int AS count
                FROM work_items
                WHERE status NOT IN ('done','cancelled')
                  AND (
                    assigned_to_id = ${staff.id}
                    OR id IN (
                      SELECT work_item_id FROM work_item_assignees
                      WHERE staff_profile_id = ${staff.id}
                    )
                  )
              `,
            ),

            // Overdue work items — primary owner OR contributor
            db.execute(
              sql<{ count: number }>`
                SELECT COUNT(DISTINCT id)::int AS count
                FROM work_items
                WHERE due_date IS NOT NULL
                  AND due_date < ${today}
                  AND status NOT IN ('done','cancelled')
                  AND (
                    assigned_to_id = ${staff.id}
                    OR id IN (
                      SELECT work_item_id FROM work_item_assignees
                      WHERE staff_profile_id = ${staff.id}
                    )
                  )
              `,
            ),

            // On-call role in the requested week
            db
              .select({ role: onCallAssignments.role })
              .from(onCallAssignments)
              .innerJoin(
                onCallSchedules,
                eq(onCallAssignments.scheduleId, onCallSchedules.id),
              )
              .where(
                and(
                  eq(onCallAssignments.staffProfileId, staff.id),
                  eq(onCallSchedules.status, "published"),
                  lte(onCallSchedules.weekStart, weekEnd),
                  gte(onCallSchedules.weekEnd, weekStart),
                ),
              ),

            // Approved leave overlapping this week
            db.query.leaveRequests.findFirst({
              where: and(
                eq(leaveRequests.staffProfileId, staff.id),
                eq(leaveRequests.status, "approved"),
                lte(leaveRequests.startDate, weekEnd),
                gte(leaveRequests.endDate, weekStart),
              ),
            }),

            // Owned overdue temporary changes
            db
              .select({ count: sql<number>`count(*)::int` })
              .from(temporaryChanges)
              .where(
                and(
                  eq(temporaryChanges.ownerId, staff.id),
                  sql`${temporaryChanges.removeByDate} IS NOT NULL`,
                  sql`${temporaryChanges.removeByDate} < ${today}`,
                  sql`${temporaryChanges.status} NOT IN ('removed', 'cancelled')`,
                ),
              ),
          ]);

          const openWorkItems = Number((openWorkResult.rows[0] as { count: string } | undefined)?.count ?? 0);
          const overdueWorkItems = Number((overdueWorkResult.rows[0] as { count: string } | undefined)?.count ?? 0);
          const overdueChanges = overdueChangesResult[0]?.count ?? 0;
          const onCallRole = onCallThisWeek[0]?.role ?? null;
          const onLeave = !!onLeaveThisWeek;

          // Load score: higher = more burdened
          const loadScore =
            openWorkItems * 1 +
            overdueWorkItems * 3 +
            (onCallRole ? 5 : 0) +
            overdueChanges * 2 +
            (onLeave ? 2 : 0);

          const loadLevel: "low" | "medium" | "high" | "overloaded" =
            loadScore === 0
              ? "low"
              : loadScore <= 5
                ? "medium"
                : loadScore <= 12
                  ? "high"
                  : "overloaded";

          return {
            staff: {
              id: staff.id,
              name: staff.user?.name ?? "Unknown",
              email: staff.user?.email ?? "",
              department: staff.department?.name ?? null,
            },
            openWorkItems,
            overdueWorkItems,
            onCallRole,
            onLeave,
            overdueChanges,
            loadScore,
            loadLevel,
          };
        }),
      );

      // Sort most burdened first
      return workloadEntries.sort((a, b) => b.loadScore - a.loadScore);
    }),
};
