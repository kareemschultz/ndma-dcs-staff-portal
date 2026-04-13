import { z } from "zod";
import { and, eq, gte, lte, sql, count, desc } from "drizzle-orm";
import {
  db,
  workItems,
  incidents,
  leaveRequests,
  leaveTypes,
  onCallAssignments,
  onCallSchedules,
  staffProfiles,
  user,
  purchaseRequisitions,
  temporaryChanges,
  appraisals,
  trainingRecords,
} from "@ndma-dcs-staff-portal/db";

import { protectedProcedure } from "../index";

export const analyticsRouter = {
  /** Cross-module analytics summary for the analytics dashboard page. */
  overview: protectedProcedure
    .input(
      z.object({
        year: z.number().default(2026),
      }),
    )
    .handler(async ({ input }) => {
      const { year } = input;
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;

      // ── Work items ────────────────────────────────────────────────────────

      const workByStatus = await db
        .select({
          status: workItems.status,
          count: count(),
        })
        .from(workItems)
        .groupBy(workItems.status);

      const workByType = await db
        .select({
          type: workItems.type,
          count: count(),
        })
        .from(workItems)
        .groupBy(workItems.type);

      const workByPriority = await db
        .select({
          priority: workItems.priority,
          count: count(),
        })
        .from(workItems)
        .groupBy(workItems.priority);

      // Top 10 assignees by open work count
      const workByAssignee = await db
        .select({
          staffProfileId: workItems.assignedToId,
          name: user.name,
          count: count(),
        })
        .from(workItems)
        .innerJoin(staffProfiles, eq(workItems.assignedToId, staffProfiles.id))
        .innerJoin(user, eq(staffProfiles.userId, user.id))
        .where(sql`${workItems.status} != 'done'`)
        .groupBy(workItems.assignedToId, user.name)
        .orderBy(desc(count()))
        .limit(10);

      // ── Incidents ─────────────────────────────────────────────────────────

      const incidentsBySeverity = await db
        .select({
          severity: incidents.severity,
          count: count(),
        })
        .from(incidents)
        .groupBy(incidents.severity);

      const incidentsByStatus = await db
        .select({
          status: incidents.status,
          count: count(),
        })
        .from(incidents)
        .groupBy(incidents.status);

      // Incidents per month for the year
      const incidentsByMonth = await db
        .select({
          month: sql<string>`to_char(${incidents.createdAt}, 'Mon')`,
          monthNum: sql<number>`EXTRACT(MONTH FROM ${incidents.createdAt})::int`,
          count: count(),
        })
        .from(incidents)
        .where(
          and(
            gte(sql`${incidents.createdAt}::date`, sql`${yearStart}::date`),
            lte(sql`${incidents.createdAt}::date`, sql`${yearEnd}::date`),
          ),
        )
        .groupBy(
          sql`to_char(${incidents.createdAt}, 'Mon')`,
          sql`EXTRACT(MONTH FROM ${incidents.createdAt})`,
        )
        .orderBy(sql`EXTRACT(MONTH FROM ${incidents.createdAt})`);

      // ── Leave ─────────────────────────────────────────────────────────────

      const leaveByStaff = await db
        .select({
          staffProfileId: leaveRequests.staffProfileId,
          name: user.name,
          totalDays: sql<number>`COALESCE(SUM(${leaveRequests.totalDays}), 0)::int`,
        })
        .from(leaveRequests)
        .innerJoin(staffProfiles, eq(leaveRequests.staffProfileId, staffProfiles.id))
        .innerJoin(user, eq(staffProfiles.userId, user.id))
        .where(
          and(
            eq(leaveRequests.status, "approved"),
            gte(leaveRequests.startDate, yearStart),
            lte(leaveRequests.endDate, yearEnd),
          ),
        )
        .groupBy(leaveRequests.staffProfileId, user.name)
        .orderBy(desc(sql<number>`COALESCE(SUM(${leaveRequests.totalDays}), 0)`));

      const leaveByType = await db
        .select({
          typeId: leaveRequests.leaveTypeId,
          typeName: leaveTypes.name,
          count: count(),
          totalDays: sql<number>`COALESCE(SUM(${leaveRequests.totalDays}), 0)::int`,
        })
        .from(leaveRequests)
        .innerJoin(leaveTypes, eq(leaveRequests.leaveTypeId, leaveTypes.id))
        .where(
          and(
            eq(leaveRequests.status, "approved"),
            gte(leaveRequests.startDate, yearStart),
            lte(leaveRequests.endDate, yearEnd),
          ),
        )
        .groupBy(leaveRequests.leaveTypeId, leaveTypes.name);

      const leaveByStatus = await db
        .select({
          status: leaveRequests.status,
          count: count(),
        })
        .from(leaveRequests)
        .where(
          and(
            gte(leaveRequests.startDate, yearStart),
            lte(leaveRequests.endDate, yearEnd),
          ),
        )
        .groupBy(leaveRequests.status);

      // ── On-Call Roster ────────────────────────────────────────────────────

      // Assignment counts per engineer per role (year)
      const rotaByPerson = await db
        .select({
          staffProfileId: onCallAssignments.staffProfileId,
          name: user.name,
          role: onCallAssignments.role,
          count: count(),
        })
        .from(onCallAssignments)
        .innerJoin(onCallSchedules, eq(onCallAssignments.scheduleId, onCallSchedules.id))
        .innerJoin(staffProfiles, eq(onCallAssignments.staffProfileId, staffProfiles.id))
        .innerJoin(user, eq(staffProfiles.userId, user.id))
        .where(
          and(
            gte(onCallSchedules.weekStart, yearStart),
            lte(onCallSchedules.weekEnd, yearEnd),
          ),
        )
        .groupBy(onCallAssignments.staffProfileId, user.name, onCallAssignments.role)
        .orderBy(user.name);

      // Fairness: total assignments per person (any role)
      const rotaFairness = await db
        .select({
          staffProfileId: onCallAssignments.staffProfileId,
          name: user.name,
          totalAssignments: count(),
          leadCount: sql<number>`SUM(CASE WHEN ${onCallAssignments.role} = 'lead_engineer' THEN 1 ELSE 0 END)::int`,
          asnCount: sql<number>`SUM(CASE WHEN ${onCallAssignments.role} = 'asn_support' THEN 1 ELSE 0 END)::int`,
          coreCount: sql<number>`SUM(CASE WHEN ${onCallAssignments.role} = 'core_support' THEN 1 ELSE 0 END)::int`,
          enterpriseCount: sql<number>`SUM(CASE WHEN ${onCallAssignments.role} = 'enterprise_support' THEN 1 ELSE 0 END)::int`,
        })
        .from(onCallAssignments)
        .innerJoin(onCallSchedules, eq(onCallAssignments.scheduleId, onCallSchedules.id))
        .innerJoin(staffProfiles, eq(onCallAssignments.staffProfileId, staffProfiles.id))
        .innerJoin(user, eq(staffProfiles.userId, user.id))
        .where(
          and(
            gte(onCallSchedules.weekStart, yearStart),
            lte(onCallSchedules.weekEnd, yearEnd),
          ),
        )
        .groupBy(onCallAssignments.staffProfileId, user.name)
        .orderBy(user.name);

      // ── Procurement ───────────────────────────────────────────────────────

      const procurementByStatus = await db
        .select({
          status: purchaseRequisitions.status,
          count: count(),
        })
        .from(purchaseRequisitions)
        .groupBy(purchaseRequisitions.status);

      const procurementByPriority = await db
        .select({
          priority: purchaseRequisitions.priority,
          count: count(),
        })
        .from(purchaseRequisitions)
        .groupBy(purchaseRequisitions.priority);

      // ── Temp Changes ──────────────────────────────────────────────────────

      const changesByStatus = await db
        .select({
          status: temporaryChanges.status,
          count: count(),
        })
        .from(temporaryChanges)
        .groupBy(temporaryChanges.status);

      // ── Appraisals ────────────────────────────────────────────────────────

      const appraisalsByStatus = await db
        .select({
          status: appraisals.status,
          count: count(),
        })
        .from(appraisals)
        .groupBy(appraisals.status);

      // ── Training Compliance ───────────────────────────────────────────────

      const trainingByStatus = await db
        .select({
          status: trainingRecords.status,
          count: count(),
        })
        .from(trainingRecords)
        .groupBy(trainingRecords.status);

      return {
        year,
        work: {
          byStatus: workByStatus,
          byType: workByType,
          byPriority: workByPriority,
          byAssignee: workByAssignee,
        },
        incidents: {
          bySeverity: incidentsBySeverity,
          byStatus: incidentsByStatus,
          byMonth: incidentsByMonth,
        },
        leave: {
          byStaff: leaveByStaff,
          byType: leaveByType,
          byStatus: leaveByStatus,
        },
        rota: {
          fairness: rotaFairness,
          byPersonAndRole: rotaByPerson,
        },
        procurement: {
          byStatus: procurementByStatus,
          byPriority: procurementByPriority,
        },
        tempChanges: {
          byStatus: changesByStatus,
        },
        appraisals: {
          byStatus: appraisalsByStatus,
        },
        training: {
          byStatus: trainingByStatus,
        },
      };
    }),
};
