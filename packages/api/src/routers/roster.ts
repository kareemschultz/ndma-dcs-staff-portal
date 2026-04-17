import { ORPCError } from "@orpc/server";
import { and, asc, desc, eq, gte, lte, inArray } from "drizzle-orm";
import { z } from "zod";

import {
  db,
  departments,
  leaveRequests,
  maintenanceAssignments,
  rosterAssignments,
  rosterSchedules,
  rosterSwapRequests,
  staffProfiles,
} from "@ndma-dcs-staff-portal/db";

import { requireRole } from "../index";
import { logAudit } from "../lib/audit";
import { canAccessStaffPrivate, getCallerStaffProfile, getManagedStaffIds } from "../lib/scope";

const monthKeySchema = z.string().regex(/^\d{4}-\d{2}$/);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const scheduleStatusSchema = z.enum(["draft", "published", "archived"]);
const shiftTypeSchema = z.enum(["day", "swing", "night"]);
const swapStatusSchema = z.enum(["pending", "approved", "rejected", "cancelled"]);
const maintenanceStatusSchema = z.enum(["draft", "scheduled", "completed", "cancelled"]);

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function nextMonthKey(monthKey: string) {
  const [yearText = "1970", monthText = "1"] = monthKey.split("-");
  const y = Number(yearText);
  const m = Number(monthText);
  return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
}

function daysInMonth(monthKey: string) {
  const [yearText = "1970", monthText = "1"] = monthKey.split("-");
  const y = Number(yearText);
  const m = Number(monthText);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

async function assertStaffAccess(context: Parameters<typeof canAccessStaffPrivate>[0], staffProfileId: string) {
  const role = context.userRole ?? "";
  if (role === "admin" || role === "hrAdminOps") return;
  const caller = await getCallerStaffProfile(context);
  if (!caller) throw new ORPCError("FORBIDDEN");
  if (caller.id === staffProfileId) return;
  if (!(await canAccessStaffPrivate(context, staffProfileId))) {
    throw new ORPCError("FORBIDDEN");
  }
}

async function loadSchedule(id: string) {
  const schedule = await db.query.rosterSchedules.findFirst({ where: eq(rosterSchedules.id, id) });
  if (!schedule) throw new ORPCError("NOT_FOUND");
  return schedule;
}

async function validateAssignment(context: Parameters<typeof canAccessStaffPrivate>[0], staffProfileId: string, shiftDate: string) {
  const staff = await db.query.staffProfiles.findFirst({ where: eq(staffProfiles.id, staffProfileId) });
  if (!staff) throw new ORPCError("NOT_FOUND");
  if (staff.status !== "active" || !staff.isOnCallEligible) {
    throw new ORPCError("CONFLICT", { message: "Staff member is not eligible for roster assignment." });
  }
  const overlap = await db.query.leaveRequests.findFirst({
    where: and(
      eq(leaveRequests.staffProfileId, staffProfileId),
      eq(leaveRequests.status, "approved"),
      lte(leaveRequests.startDate, shiftDate),
      gte(leaveRequests.endDate, shiftDate),
    ),
  });
  if (overlap) {
    throw new ORPCError("CONFLICT", { message: "Assignment conflicts with approved leave." });
  }
  await assertStaffAccess(context, staffProfileId);
}

async function upsertAssignment(input: {
  scheduleId: string;
  shiftDate: string;
  shiftType: "day" | "swing" | "night";
  staffProfileId: string;
  notes?: string | null;
}, context: Parameters<typeof canAccessStaffPrivate>[0]) {
  await validateAssignment(context, input.staffProfileId, input.shiftDate);
  const before = await db.query.rosterAssignments.findFirst({
    where: and(
      eq(rosterAssignments.scheduleId, input.scheduleId),
      eq(rosterAssignments.shiftDate, input.shiftDate),
      eq(rosterAssignments.shiftType, input.shiftType),
    ),
  });
  const [after] = before
    ? await db.update(rosterAssignments).set({
        staffProfileId: input.staffProfileId,
        notes: input.notes ?? before.notes,
        acknowledgedAt: null,
        acknowledgedById: null,
        updatedAt: new Date(),
      }).where(eq(rosterAssignments.id, before.id)).returning()
    : await db.insert(rosterAssignments).values({
        scheduleId: input.scheduleId,
        shiftDate: input.shiftDate,
        shiftType: input.shiftType,
        staffProfileId: input.staffProfileId,
        notes: input.notes ?? null,
      }).returning();
  if (!after) throw new ORPCError("INTERNAL_SERVER_ERROR");
  return { before, after };
}

async function canPublish(scheduleId: string) {
  const schedule = await loadSchedule(scheduleId);
  const assignments = await db.query.rosterAssignments.findMany({ where: eq(rosterAssignments.scheduleId, scheduleId) });
  const byDate = new Map<string, Set<string>>();
  for (const assignment of assignments) {
    const set = byDate.get(assignment.shiftDate) ?? new Set<string>();
    set.add(assignment.shiftType);
    byDate.set(assignment.shiftDate, set);
  }
  const totalDays = daysInMonth(schedule.monthKey);
  for (let day = 1; day <= totalDays; day += 1) {
    const date = `${schedule.monthKey}-${String(day).padStart(2, "0")}`;
    const set = byDate.get(date);
    if (!set || !set.has("day") || !set.has("swing") || !set.has("night")) {
      throw new ORPCError("CONFLICT", { message: `Missing full coverage for ${date}.` });
    }
  }
  return schedule;
}

export const rosterRouter = {
  list: requireRole("roster", "read")
    .input(z.object({ monthKey: monthKeySchema.optional(), departmentId: z.string().optional(), status: scheduleStatusSchema.optional() }))
    .handler(async ({ input }) => {
      const where = [];
      if (input.monthKey) where.push(eq(rosterSchedules.monthKey, input.monthKey));
      if (input.departmentId) where.push(eq(rosterSchedules.departmentId, input.departmentId));
      if (input.status) where.push(eq(rosterSchedules.status, input.status));
      return db.query.rosterSchedules.findMany({
        where: where.length ? and(...where) : undefined,
        with: {
          department: true,
          publishedBy: true,
          assignments: { with: { staffProfile: { with: { user: true, department: true } }, acknowledgedBy: true }, orderBy: [asc(rosterAssignments.shiftDate), asc(rosterAssignments.shiftType)] },
        },
        orderBy: [desc(rosterSchedules.monthKey)],
      });
    }),

  get: requireRole("roster", "read").input(z.object({ id: z.string() })).handler(async ({ input }) => {
    const schedule = await db.query.rosterSchedules.findFirst({
      where: eq(rosterSchedules.id, input.id),
      with: {
        department: true,
        publishedBy: true,
        assignments: { with: { staffProfile: { with: { user: true, department: true } }, acknowledgedBy: true }, orderBy: [asc(rosterAssignments.shiftDate), asc(rosterAssignments.shiftType)] },
      },
    });
    if (!schedule) throw new ORPCError("NOT_FOUND");
    return schedule;
  }),

  getCurrent: requireRole("roster", "read").handler(async () => {
    const key = currentMonthKey();
    const schedule = await db.query.rosterSchedules.findFirst({
      where: eq(rosterSchedules.monthKey, key),
      with: {
        department: true,
        publishedBy: true,
        assignments: { with: { staffProfile: { with: { user: true, department: true } }, acknowledgedBy: true }, orderBy: [asc(rosterAssignments.shiftDate), asc(rosterAssignments.shiftType)] },
      },
      orderBy: [desc(rosterSchedules.status)],
    });
    return schedule ?? null;
  }),

  getUpcoming: requireRole("roster", "read").handler(async () => {
    return db.query.rosterSchedules.findMany({
      where: and(gte(rosterSchedules.monthKey, nextMonthKey(currentMonthKey())), eq(rosterSchedules.status, "published")),
      with: {
        department: true,
        publishedBy: true,
        assignments: { with: { staffProfile: { with: { user: true, department: true } }, acknowledgedBy: true }, orderBy: [asc(rosterAssignments.shiftDate), asc(rosterAssignments.shiftType)] },
      },
      orderBy: [asc(rosterSchedules.monthKey)],
      limit: 6,
    });
  }),

  today: requireRole("roster", "read").handler(async () => {
    const key = currentMonthKey();
    const today = new Date().toISOString().slice(0, 10);
    const schedule = await db.query.rosterSchedules.findFirst({
      where: and(eq(rosterSchedules.monthKey, key), eq(rosterSchedules.status, "published")),
      with: {
        department: true,
        publishedBy: true,
        assignments: { with: { staffProfile: { with: { user: true, department: true } }, acknowledgedBy: true }, orderBy: [asc(rosterAssignments.shiftDate), asc(rosterAssignments.shiftType)] },
      },
    });
    if (!schedule) return null;
    return { ...schedule, assignments: schedule.assignments.filter((assignment) => assignment.shiftDate === today) };
  }),

  myRoster: requireRole("roster", "read").handler(async ({ context }) => {
    const caller = await getCallerStaffProfile(context);
    if (!caller) return [];
    return db.query.rosterAssignments.findMany({
      where: eq(rosterAssignments.staffProfileId, caller.id),
      with: {
        schedule: { with: { department: true, publishedBy: true } },
        staffProfile: { with: { user: true, department: true } },
        acknowledgedBy: true,
      },
      orderBy: [asc(rosterAssignments.shiftDate), asc(rosterAssignments.shiftType)],
    });
  }),

  create: requireRole("roster", "create")
    .input(z.object({ monthKey: monthKeySchema, departmentId: z.string().optional(), notes: z.string().optional() }))
    .handler(async ({ input, context }) => {
      const existing = await db.query.rosterSchedules.findFirst({ where: eq(rosterSchedules.monthKey, input.monthKey) });
      if (existing) throw new ORPCError("CONFLICT", { message: "Roster schedule already exists for this month." });
      if (input.departmentId) {
        const dept = await db.query.departments.findFirst({ where: eq(departments.id, input.departmentId) });
        if (!dept) throw new ORPCError("NOT_FOUND");
      }
      const [schedule] = await db.insert(rosterSchedules).values({ monthKey: input.monthKey, departmentId: input.departmentId ?? null, notes: input.notes ?? null }).returning();
      if (!schedule) throw new ORPCError("INTERNAL_SERVER_ERROR");
      await logAudit({ actorId: context.session.user.id, actorName: context.session.user.name, actorRole: context.userRole ?? undefined, action: "roster_schedule.create", module: "roster", resourceType: "roster_schedule", resourceId: schedule.id, afterValue: schedule as Record<string, unknown>, ipAddress: context.ipAddress, userAgent: context.userAgent, correlationId: context.requestId });
      return schedule;
    }),

  update: requireRole("roster", "update")
    .input(z.object({ id: z.string(), monthKey: monthKeySchema.optional(), departmentId: z.string().nullable().optional(), notes: z.string().optional(), status: scheduleStatusSchema.optional() }))
    .handler(async ({ input, context }) => {
      const before = await loadSchedule(input.id);
      if (input.monthKey && input.monthKey !== before.monthKey) {
        const existing = await db.query.rosterSchedules.findFirst({ where: eq(rosterSchedules.monthKey, input.monthKey) });
        if (existing) throw new ORPCError("CONFLICT", { message: "Roster schedule already exists for this month." });
      }
      const [schedule] = await db.update(rosterSchedules).set({
        monthKey: input.monthKey ?? before.monthKey,
        departmentId: input.departmentId === undefined ? before.departmentId : input.departmentId,
        notes: input.notes ?? before.notes,
        status: input.status ?? before.status,
        updatedAt: new Date(),
      }).where(eq(rosterSchedules.id, input.id)).returning();
      await logAudit({ actorId: context.session.user.id, actorName: context.session.user.name, actorRole: context.userRole ?? undefined, action: "roster_schedule.update", module: "roster", resourceType: "roster_schedule", resourceId: input.id, beforeValue: before as Record<string, unknown>, afterValue: schedule as Record<string, unknown>, ipAddress: context.ipAddress, userAgent: context.userAgent, correlationId: context.requestId });
      return schedule;
    }),

  delete: requireRole("roster", "delete").input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const before = await loadSchedule(input.id);
    const [schedule] = await db.update(rosterSchedules).set({ status: "archived", updatedAt: new Date() }).where(eq(rosterSchedules.id, input.id)).returning();
    await logAudit({ actorId: context.session.user.id, actorName: context.session.user.name, actorRole: context.userRole ?? undefined, action: "roster_schedule.archive", module: "roster", resourceType: "roster_schedule", resourceId: input.id, beforeValue: before as Record<string, unknown>, afterValue: schedule as Record<string, unknown>, ipAddress: context.ipAddress, userAgent: context.userAgent, correlationId: context.requestId });
    return schedule;
  }),

  publish: requireRole("roster", "publish").input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const before = await loadSchedule(input.id);
    if (before.status === "archived") throw new ORPCError("CONFLICT", { message: "Archived schedules cannot be published." });
    await canPublish(input.id);
    const assignments = await db.query.rosterAssignments.findMany({ where: eq(rosterAssignments.scheduleId, input.id) });
    for (const assignment of assignments) {
      await validateAssignment(context, assignment.staffProfileId, assignment.shiftDate);
    }
    const [schedule] = await db.update(rosterSchedules).set({ status: "published", publishedAt: new Date(), publishedById: context.session.user.id, updatedAt: new Date() }).where(eq(rosterSchedules.id, input.id)).returning();
    await logAudit({ actorId: context.session.user.id, actorName: context.session.user.name, actorRole: context.userRole ?? undefined, action: "roster_schedule.publish", module: "roster", resourceType: "roster_schedule", resourceId: input.id, beforeValue: before as Record<string, unknown>, afterValue: schedule as Record<string, unknown>, ipAddress: context.ipAddress, userAgent: context.userAgent, correlationId: context.requestId });
    return schedule;
  }),

  assign: requireRole("roster", "assign").input(z.object({ scheduleId: z.string(), shiftDate: dateSchema, shiftType: shiftTypeSchema, staffProfileId: z.string(), notes: z.string().optional() })).handler(async ({ input, context }) => {
    const schedule = await loadSchedule(input.scheduleId);
    if (schedule.status === "archived") throw new ORPCError("CONFLICT", { message: "Archived schedules cannot be edited." });
    const { before, after } = await upsertAssignment({ scheduleId: input.scheduleId, shiftDate: input.shiftDate, shiftType: input.shiftType, staffProfileId: input.staffProfileId, notes: input.notes ?? null }, context);
    await logAudit({ actorId: context.session.user.id, actorName: context.session.user.name, actorRole: context.userRole ?? undefined, action: before ? "roster_assignment.update" : "roster_assignment.create", module: "roster", resourceType: "roster_assignment", resourceId: after.id, beforeValue: before as Record<string, unknown> | undefined, afterValue: after as Record<string, unknown>, ipAddress: context.ipAddress, userAgent: context.userAgent, correlationId: context.requestId });
    return after;
  }),

  bulkAssign: requireRole("roster", "assign").input(z.object({ scheduleId: z.string(), assignments: z.array(z.object({ shiftDate: dateSchema, shiftType: shiftTypeSchema, staffProfileId: z.string(), notes: z.string().optional() })) })).handler(async ({ input, context }) => {
    const schedule = await loadSchedule(input.scheduleId);
    if (schedule.status === "archived") throw new ORPCError("CONFLICT", { message: "Archived schedules cannot be edited." });
    const rows = await db.transaction(async (tx) => {
      const results = [];
      for (const item of input.assignments) {
        await validateAssignment(context, item.staffProfileId, item.shiftDate);
        const before = await tx.query.rosterAssignments.findFirst({ where: and(eq(rosterAssignments.scheduleId, input.scheduleId), eq(rosterAssignments.shiftDate, item.shiftDate), eq(rosterAssignments.shiftType, item.shiftType)) });
        const [after] = before ? await tx.update(rosterAssignments).set({ staffProfileId: item.staffProfileId, notes: item.notes ?? before.notes, acknowledgedAt: null, acknowledgedById: null, updatedAt: new Date() }).where(eq(rosterAssignments.id, before.id)).returning() : await tx.insert(rosterAssignments).values({ scheduleId: input.scheduleId, shiftDate: item.shiftDate, shiftType: item.shiftType, staffProfileId: item.staffProfileId, notes: item.notes ?? null }).returning();
        if (!after) throw new ORPCError("INTERNAL_SERVER_ERROR");
        results.push(after);
      }
      return results;
    });
    await logAudit({ actorId: context.session.user.id, actorName: context.session.user.name, actorRole: context.userRole ?? undefined, action: "roster_assignment.bulk_assign", module: "roster", resourceType: "roster_schedule", resourceId: input.scheduleId, afterValue: { assignmentIds: rows.map((row) => row.id) } as Record<string, unknown>, ipAddress: context.ipAddress, userAgent: context.userAgent, correlationId: context.requestId });
    return { count: rows.length, assignments: rows };
  }),

  swap: {
    list: requireRole("roster", "read").input(z.object({ status: swapStatusSchema.optional(), staffProfileId: z.string().optional() })).handler(async ({ input, context }) => {
      const where = [];
      if (input.status) where.push(eq(rosterSwapRequests.status, input.status));
      if (input.staffProfileId) {
        await assertStaffAccess(context, input.staffProfileId);
        where.push(eq(rosterSwapRequests.requesterId, input.staffProfileId));
      } else if (!["admin", "hrAdminOps"].includes(context.userRole ?? "")) {
        const managed = await getManagedStaffIds(context);
        const caller = await getCallerStaffProfile(context);
        const ids = new Set(managed);
        if (caller?.id) ids.add(caller.id);
        if (ids.size === 0) return [];
        where.push(inArray(rosterSwapRequests.requesterId, [...ids]));
      }
      return db.query.rosterSwapRequests.findMany({
        where: where.length ? and(...where) : undefined,
        with: {
          assignment: { with: { schedule: true, staffProfile: { with: { user: true, department: true } } } },
          requester: { with: { user: true, department: true } },
          targetStaffProfile: { with: { user: true, department: true } },
          reviewedBy: true,
        },
        orderBy: [desc(rosterSwapRequests.createdAt)],
      });
    }),

    request: requireRole("roster", "swap").input(z.object({ assignmentId: z.string(), targetStaffProfileId: z.string(), reason: z.string().optional() })).handler(async ({ input, context }) => {
      const caller = await getCallerStaffProfile(context);
      if (!caller) throw new ORPCError("FORBIDDEN");
      const assignment = await db.query.rosterAssignments.findFirst({ where: eq(rosterAssignments.id, input.assignmentId), with: { schedule: true } });
      if (!assignment) throw new ORPCError("NOT_FOUND");
      if (assignment.staffProfileId !== caller.id && !(await canAccessStaffPrivate(context, assignment.staffProfileId))) {
        throw new ORPCError("FORBIDDEN");
      }
      await assertStaffAccess(context, input.targetStaffProfileId);
      const existing = await db.query.rosterSwapRequests.findFirst({ where: and(eq(rosterSwapRequests.assignmentId, input.assignmentId), eq(rosterSwapRequests.status, "pending")) });
      if (existing) throw new ORPCError("CONFLICT", { message: "A pending swap request already exists." });
      const [swap] = await db.insert(rosterSwapRequests).values({ assignmentId: input.assignmentId, requesterId: caller.id, targetStaffProfileId: input.targetStaffProfileId, reason: input.reason ?? null }).returning();
      if (!swap) throw new ORPCError("INTERNAL_SERVER_ERROR");
      await logAudit({ actorId: context.session.user.id, actorName: context.session.user.name, actorRole: context.userRole ?? undefined, action: "roster_swap_request.create", module: "roster", resourceType: "roster_swap_request", resourceId: swap.id, afterValue: swap as Record<string, unknown>, ipAddress: context.ipAddress, userAgent: context.userAgent, correlationId: context.requestId });
      return swap;
    }),

    review: requireRole("roster", "update").input(z.object({ swapId: z.string(), action: z.enum(["approve", "reject"]), notes: z.string().optional() })).handler(async ({ input, context }) => {
      const before = await db.query.rosterSwapRequests.findFirst({ where: eq(rosterSwapRequests.id, input.swapId), with: { assignment: true } });
      if (!before) throw new ORPCError("NOT_FOUND");
      if (before.status !== "pending") throw new ORPCError("CONFLICT", { message: "Only pending swap requests can be reviewed." });
      await assertStaffAccess(context, before.assignment.staffProfileId);
      const [swap] = await db.update(rosterSwapRequests).set({ status: input.action === "approve" ? "approved" : "rejected", reviewedById: context.session.user.id, reviewedAt: new Date(), reviewNotes: input.notes ?? before.reviewNotes, updatedAt: new Date() }).where(eq(rosterSwapRequests.id, input.swapId)).returning();
      if (!swap) throw new ORPCError("INTERNAL_SERVER_ERROR");
      if (input.action === "approve") {
        await validateAssignment(context, before.targetStaffProfileId, before.assignment.shiftDate);
        await db.update(rosterAssignments).set({ staffProfileId: before.targetStaffProfileId, acknowledgedAt: null, acknowledgedById: null, updatedAt: new Date() }).where(eq(rosterAssignments.id, before.assignmentId));
      }
      await logAudit({ actorId: context.session.user.id, actorName: context.session.user.name, actorRole: context.userRole ?? undefined, action: `roster_swap_request.${input.action}`, module: "roster", resourceType: "roster_swap_request", resourceId: swap.id, beforeValue: before as Record<string, unknown>, afterValue: swap as Record<string, unknown>, ipAddress: context.ipAddress, userAgent: context.userAgent, correlationId: context.requestId });
      return swap;
    }),
  },

  maintenance: {
    list: requireRole("roster", "read").input(z.object({ departmentId: z.string().optional(), year: z.number().int().optional(), quarter: z.string().optional(), status: maintenanceStatusSchema.optional() })).handler(async ({ input }) => {
      const where = [];
      if (input.departmentId) where.push(eq(maintenanceAssignments.departmentId, input.departmentId));
      if (input.year) where.push(eq(maintenanceAssignments.year, input.year));
      if (input.quarter) where.push(eq(maintenanceAssignments.quarter, input.quarter));
      if (input.status) where.push(eq(maintenanceAssignments.status, input.status));
      return db.query.maintenanceAssignments.findMany({
        where: where.length ? and(...where) : undefined,
        with: { department: true, staffProfile: { with: { user: true, department: true } } },
        orderBy: [desc(maintenanceAssignments.year), asc(maintenanceAssignments.quarter)],
      });
    }),

    create: requireRole("roster", "create").input(z.object({ departmentId: z.string().optional(), year: z.number().int(), quarter: z.string().min(1), maintenanceType: z.enum(["cleaning_server_room", "routine_maintenance_dcs", "fire_detection_test"]), staffProfileId: z.string().optional(), notes: z.string().optional() })).handler(async ({ input, context }) => {
      if (input.departmentId) {
        const dept = await db.query.departments.findFirst({ where: eq(departments.id, input.departmentId) });
        if (!dept) throw new ORPCError("NOT_FOUND");
      }
      if (input.staffProfileId) await assertStaffAccess(context, input.staffProfileId);
      const [row] = await db.insert(maintenanceAssignments).values({ departmentId: input.departmentId ?? null, year: input.year, quarter: input.quarter, maintenanceType: input.maintenanceType, staffProfileId: input.staffProfileId ?? null, notes: input.notes ?? null, status: "draft" }).returning();
      if (!row) throw new ORPCError("INTERNAL_SERVER_ERROR");
      await logAudit({ actorId: context.session.user.id, actorName: context.session.user.name, actorRole: context.userRole ?? undefined, action: "maintenance_assignment.create", module: "roster", resourceType: "maintenance_assignment", resourceId: row.id, afterValue: row as Record<string, unknown>, ipAddress: context.ipAddress, userAgent: context.userAgent, correlationId: context.requestId });
      return row;
    }),

    update: requireRole("roster", "update").input(z.object({ id: z.string(), departmentId: z.string().nullable().optional(), year: z.number().int().optional(), quarter: z.string().optional(), maintenanceType: z.enum(["cleaning_server_room", "routine_maintenance_dcs", "fire_detection_test"]).optional(), staffProfileId: z.string().nullable().optional(), notes: z.string().optional(), status: maintenanceStatusSchema.optional() })).handler(async ({ input, context }) => {
      const before = await db.query.maintenanceAssignments.findFirst({ where: eq(maintenanceAssignments.id, input.id) });
      if (!before) throw new ORPCError("NOT_FOUND");
      if (input.staffProfileId) await assertStaffAccess(context, input.staffProfileId);
      const [row] = await db.update(maintenanceAssignments).set({ departmentId: input.departmentId === undefined ? before.departmentId : input.departmentId, year: input.year ?? before.year, quarter: input.quarter ?? before.quarter, maintenanceType: input.maintenanceType ?? before.maintenanceType, staffProfileId: input.staffProfileId === undefined ? before.staffProfileId : input.staffProfileId, notes: input.notes ?? before.notes, status: input.status ?? before.status, updatedAt: new Date() }).where(eq(maintenanceAssignments.id, input.id)).returning();
      await logAudit({ actorId: context.session.user.id, actorName: context.session.user.name, actorRole: context.userRole ?? undefined, action: "maintenance_assignment.update", module: "roster", resourceType: "maintenance_assignment", resourceId: input.id, beforeValue: before as Record<string, unknown>, afterValue: row as Record<string, unknown>, ipAddress: context.ipAddress, userAgent: context.userAgent, correlationId: context.requestId });
      return row;
    }),

    delete: requireRole("roster", "delete").input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
      const before = await db.query.maintenanceAssignments.findFirst({ where: eq(maintenanceAssignments.id, input.id) });
      if (!before) throw new ORPCError("NOT_FOUND");
      const [row] = await db.update(maintenanceAssignments).set({ status: "cancelled", updatedAt: new Date() }).where(eq(maintenanceAssignments.id, input.id)).returning();
      await logAudit({ actorId: context.session.user.id, actorName: context.session.user.name, actorRole: context.userRole ?? undefined, action: "maintenance_assignment.delete", module: "roster", resourceType: "maintenance_assignment", resourceId: input.id, beforeValue: before as Record<string, unknown>, afterValue: row as Record<string, unknown>, ipAddress: context.ipAddress, userAgent: context.userAgent, correlationId: context.requestId });
      return row;
    }),
  },
};
