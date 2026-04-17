import { z } from "zod";
import {
  db,
  staffProfiles,
  incidents,
  workItems,
  temporaryChanges,
  contracts,
  appraisals,
  leaveRequests,
  purchaseRequisitions,
  auditLogs,
  onCallSchedules,
} from "@ndma-dcs-staff-portal/db";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import { protectedProcedure, requireRole } from "../index";

export const dashboardRouter = {
  main: protectedProcedure.handler(async () => {
    const today = new Date().toISOString().slice(0, 10);

    const [
      activeStaffCount,
      onLeaveTodayCount,
      openWorkItemsCount,
      overdueWorkCount,
      activeIncidentsCount,
      overdueChangesCount,
      pendingLeavesCount,
      pendingPRsCount,
      expiringContracts,
      dueAppraisals,
      currentSchedule,
    ] = await Promise.all([
      // Active staff
      db
        .select({ count: sql<number>`count(*)` })
        .from(staffProfiles)
        .where(eq(staffProfiles.status, "active")),

      // On leave today
      db
        .select({ count: sql<number>`count(*)` })
        .from(leaveRequests)
        .where(
          and(
            eq(leaveRequests.status, "approved"),
            lte(leaveRequests.startDate, today),
            gte(leaveRequests.endDate, today),
          ),
        ),

      // Open work items
      db
        .select({ count: sql<number>`count(*)` })
        .from(workItems)
        .where(
          sql`${workItems.status} NOT IN ('done', 'cancelled')`,
        ),

      // Overdue work items
      db
        .select({ count: sql<number>`count(*)` })
        .from(workItems)
        .where(
          and(
            sql`${workItems.dueDate} IS NOT NULL`,
            sql`${workItems.dueDate} < ${today}`,
            sql`${workItems.status} NOT IN ('done', 'cancelled')`,
          ),
        ),

      // Active incidents
      db
        .select({ count: sql<number>`count(*)` })
        .from(incidents)
        .where(
          sql`${incidents.status} NOT IN ('resolved', 'post_mortem', 'closed')`,
        ),

      // Overdue temp changes
      db
        .select({ count: sql<number>`count(*)` })
        .from(temporaryChanges)
        .where(
          and(
            sql`${temporaryChanges.removeByDate} IS NOT NULL`,
            sql`${temporaryChanges.removeByDate} < ${today}`,
            sql`${temporaryChanges.status} NOT IN ('removed', 'cancelled')`,
          ),
        ),

      // Pending leave requests
      db
        .select({ count: sql<number>`count(*)` })
        .from(leaveRequests)
        .where(eq(leaveRequests.status, "pending")),

      // Pending procurement PRs
      db
        .select({ count: sql<number>`count(*)` })
        .from(purchaseRequisitions)
        .where(eq(purchaseRequisitions.status, "submitted")),

      // Contracts expiring in 60 days
      (() => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + 60);
        const cutoffStr = cutoff.toISOString().slice(0, 10);
        return db
          .select({ count: sql<number>`count(*)` })
          .from(contracts)
          .where(
            and(
              sql`${contracts.endDate} IS NOT NULL`,
              lte(contracts.endDate, cutoffStr),
              sql`${contracts.status} NOT IN ('expired', 'terminated', 'renewed')`,
            ),
          );
      })(),

      // Appraisals overdue
      db
        .select({ count: sql<number>`count(*)` })
        .from(appraisals)
        .where(
          and(
            sql`${appraisals.scheduledDate} IS NOT NULL`,
            sql`${appraisals.scheduledDate} < ${today}`,
            sql`${appraisals.status} NOT IN ('completed')`,
          ),
        ),

      // Current on-call schedule
      db.query.onCallSchedules.findFirst({
        where: and(
          eq(onCallSchedules.status, "published"),
          lte(onCallSchedules.weekStart, today),
          gte(onCallSchedules.weekEnd, today),
        ),
        with: {
          assignments: {
            with: { staffProfile: { with: { user: true } } },
          },
        },
      }),
    ]);

    return {
      activeStaff: Number(activeStaffCount[0]?.count ?? 0),
      onLeaveToday: Number(onLeaveTodayCount[0]?.count ?? 0),
      openWorkItems: Number(openWorkItemsCount[0]?.count ?? 0),
      overdueWorkItems: Number(overdueWorkCount[0]?.count ?? 0),
      activeIncidents: Number(activeIncidentsCount[0]?.count ?? 0),
      overdueChanges: Number(overdueChangesCount[0]?.count ?? 0),
      pendingLeaveRequests: Number(pendingLeavesCount[0]?.count ?? 0),
      pendingPRs: Number(pendingPRsCount[0]?.count ?? 0),
      expiringContracts: Number(expiringContracts[0]?.count ?? 0),
      dueAppraisals: Number(dueAppraisals[0]?.count ?? 0),
      currentSchedule: currentSchedule ?? null,
    };
  }),

  opsReadiness: requireRole("report", "read").handler(async () => {
    const today = new Date().toISOString().slice(0, 10);

    const [onCallCoverage, unresolvedIncidents, overdueWork, overdueChanges] =
      await Promise.all([
        // Is there a current published schedule with all 4 roles filled?
        db.query.onCallSchedules.findFirst({
          where: and(
            eq(onCallSchedules.status, "published"),
            lte(onCallSchedules.weekStart, today),
            gte(onCallSchedules.weekEnd, today),
          ),
          with: { assignments: true },
        }),

        db
          .select({ count: sql<number>`count(*)` })
          .from(incidents)
          .where(
            and(
              sql`${incidents.status} NOT IN ('resolved', 'post_mortem', 'closed')`,
              sql`${incidents.severity} IN ('sev1', 'sev2')`,
            ),
          ),

        db
          .select({ count: sql<number>`count(*)` })
          .from(workItems)
          .where(
            and(
              sql`${workItems.dueDate} IS NOT NULL`,
              sql`${workItems.dueDate} < ${today}`,
              sql`${workItems.priority} IN ('high', 'critical')`,
              sql`${workItems.status} NOT IN ('done', 'cancelled')`,
            ),
          ),

        db
          .select({ count: sql<number>`count(*)` })
          .from(temporaryChanges)
          .where(
            and(
              sql`${temporaryChanges.removeByDate} IS NOT NULL`,
              sql`${temporaryChanges.removeByDate} < ${today}`,
              sql`${temporaryChanges.status} NOT IN ('removed', 'cancelled')`,
            ),
          ),
      ]);

    const requiredRoles = ["lead_engineer", "asn_support", "core_support", "enterprise_support"];
    const filledRoles = onCallCoverage?.assignments.map((a) => a.role) ?? [];
    const onCallComplete =
      !!onCallCoverage &&
      requiredRoles.every((r) =>
        filledRoles.includes(r as (typeof filledRoles)[number]),
      );

    const criticalIncidents = Number(unresolvedIncidents[0]?.count ?? 0);
    const highOverdueWork = Number(overdueWork[0]?.count ?? 0);
    const overdueChangesCount = Number(overdueChanges[0]?.count ?? 0);

    // Traffic light: green / amber / red
    const issueCount = [
      !onCallComplete,
      criticalIncidents > 0,
      highOverdueWork > 2,
      overdueChangesCount > 0,
    ].filter(Boolean).length;

    const readinessStatus =
      issueCount === 0 ? "green" : issueCount <= 1 ? "amber" : "red";

    return {
      readinessStatus,
      onCallComplete,
      currentSchedule: onCallCoverage ?? null,
      criticalIncidents,
      highOverdueWork,
      overdueChanges: overdueChangesCount,
    };
  }),

  recentActivity: requireRole("audit", "read")
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
    .handler(async ({ input }) => {
      return db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(input.limit);
    }),
};
