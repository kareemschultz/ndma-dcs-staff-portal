/**
 * Operational Overlays router — quarterly recurring duties (server room
 * cleaning, routine maintenance, etc.) that sit alongside the on-call rota.
 */
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db } from "@ndma-dcs-staff-portal/db";
import {
  overlayTypes,
  overlaySchedules,
  overlayAssignments,
  overlayTasks,
} from "@ndma-dcs-staff-portal/db";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { protectedProcedure, requireRole } from "../index";
import { logAudit } from "../lib/audit";

// ── helpers ────────────────────────────────────────────────────────────────

const OverlayTaskStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "overdue",
]);

// ── Router ─────────────────────────────────────────────────────────────────
export const overlaysRouter = {
  // ── Types ──────────────────────────────────────────────────────────────
  types: {
    list: protectedProcedure.handler(async () => {
      return db.query.overlayTypes.findMany({
        orderBy: asc(overlayTypes.name),
        with: { schedules: { limit: 8 } },
      });
    }),

    create: requireRole("settings", "create")
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          category: z.string().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const [type] = await db
          .insert(overlayTypes)
          .values(input)
          .returning();
        if (!type) throw new ORPCError("INTERNAL_SERVER_ERROR");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
          action: "overlay.type.create",
          module: "rota",
          resourceType: "overlay_type",
          resourceId: type.id,
          afterValue: type as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return type;
      }),
  },

  // ── Schedules ──────────────────────────────────────────────────────────
  list: protectedProcedure
    .input(
      z.object({
        quarter: z.string().optional(), // "Q1", "Q2", etc.
        year: z.string().optional(),
        overlayTypeId: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const conditions = [];
      if (input.quarter) conditions.push(eq(overlaySchedules.quarter, input.quarter));
      if (input.year) conditions.push(eq(overlaySchedules.year, input.year));
      if (input.overlayTypeId)
        conditions.push(eq(overlaySchedules.overlayTypeId, input.overlayTypeId));

      return db.query.overlaySchedules.findMany({
        where: conditions.length ? and(...conditions) : undefined,
        orderBy: [asc(overlaySchedules.year), asc(overlaySchedules.quarter)],
        with: {
          overlayType: true,
          assignments: {
            with: { staffProfile: { with: { user: true } } },
          },
          tasks: {
            with: { assignedTo: { with: { user: true } } },
            orderBy: asc(overlayTasks.dueDate),
          },
        },
      });
    }),

  getByQuarter: protectedProcedure
    .input(z.object({ quarter: z.string(), year: z.string() }))
    .handler(async ({ input }) => {
      return db.query.overlaySchedules.findMany({
        where: and(
          eq(overlaySchedules.quarter, input.quarter),
          eq(overlaySchedules.year, input.year),
        ),
        with: {
          overlayType: true,
          assignments: {
            with: { staffProfile: { with: { user: true } } },
          },
          tasks: {
            with: { assignedTo: { with: { user: true } } },
            orderBy: asc(overlayTasks.dueDate),
          },
        },
      });
    }),

  create: requireRole("rota", "create")
    .input(
      z.object({
        overlayTypeId: z.string(),
        quarter: z.string(),
        year: z.string(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        notes: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const [schedule] = await db
        .insert(overlaySchedules)
        .values(input)
        .returning();
      if (!schedule) throw new ORPCError("INTERNAL_SERVER_ERROR");

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
        action: "overlay.schedule.create",
        module: "rota",
        resourceType: "overlay_schedule",
        resourceId: schedule.id,
        afterValue: schedule as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return schedule;
    }),

  // ── Assignments ────────────────────────────────────────────────────────
  assign: requireRole("rota", "update")
    .input(
      z.object({
        overlayScheduleId: z.string(),
        staffProfileId: z.string().optional(),
        externalLabel: z.string().optional(),
        roleDescription: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const [assignment] = await db
        .insert(overlayAssignments)
        .values(input)
        .returning();
      if (!assignment) throw new ORPCError("INTERNAL_SERVER_ERROR");

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
        action: "overlay.assignment.create",
        module: "rota",
        resourceType: "overlay_assignment",
        resourceId: assignment.id,
        afterValue: assignment as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return assignment;
    }),

  updateAssignment: requireRole("rota", "update")
    .input(
      z.object({
        assignmentId: z.string(),
        staffProfileId: z.string().optional(),
        externalLabel: z.string().optional(),
        roleDescription: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const { assignmentId, ...updates } = input;
      const [updated] = await db
        .update(overlayAssignments)
        .set(updates)
        .where(eq(overlayAssignments.id, assignmentId))
        .returning();
      if (!updated) throw new ORPCError("NOT_FOUND");

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
        action: "overlay.assignment.update",
        module: "rota",
        resourceType: "overlay_assignment",
        resourceId: assignmentId,
        afterValue: updated as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return updated;
    }),

  // ── Tasks ──────────────────────────────────────────────────────────────
  tasks: {
    list: protectedProcedure
      .input(
        z.object({
          status: OverlayTaskStatusSchema.optional(),
          staffProfileId: z.string().optional(),
          overlayScheduleId: z.string().optional(),
          dueBefore: z.string().optional(),
          dueAfter: z.string().optional(),
        }),
      )
      .handler(async ({ input }) => {
        const conditions = [];
        if (input.status) conditions.push(eq(overlayTasks.status, input.status));
        if (input.staffProfileId)
          conditions.push(eq(overlayTasks.assignedToId, input.staffProfileId));
        if (input.overlayScheduleId)
          conditions.push(eq(overlayTasks.overlayScheduleId, input.overlayScheduleId));
        if (input.dueBefore)
          conditions.push(lte(overlayTasks.dueDate, input.dueBefore));
        if (input.dueAfter)
          conditions.push(gte(overlayTasks.dueDate, input.dueAfter));

        return db.query.overlayTasks.findMany({
          where: conditions.length ? and(...conditions) : undefined,
          orderBy: asc(overlayTasks.dueDate),
          with: {
            overlaySchedule: { with: { overlayType: true } },
            assignedTo: { with: { user: true } },
            completedBy: true,
          },
        });
      }),

    create: requireRole("rota", "create")
      .input(
        z.object({
          overlayScheduleId: z.string(),
          name: z.string().min(1),
          dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
          assignedToId: z.string().optional(),
          assignedToExternal: z.string().optional(),
          notes: z.string().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const [task] = await db
          .insert(overlayTasks)
          .values(input)
          .returning();
        if (!task) throw new ORPCError("INTERNAL_SERVER_ERROR");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
          action: "overlay.task.create",
          module: "rota",
          resourceType: "overlay_task",
          resourceId: task.id,
          afterValue: task as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return task;
      }),

    update: requireRole("rota", "update")
      .input(
        z.object({
          taskId: z.string(),
          name: z.string().optional(),
          dueDate: z.string().optional(),
          assignedToId: z.string().optional(),
          status: OverlayTaskStatusSchema.optional(),
          notes: z.string().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const { taskId, ...updates } = input;
        const [updated] = await db
          .update(overlayTasks)
          .set(updates)
          .where(eq(overlayTasks.id, taskId))
          .returning();
        if (!updated) throw new ORPCError("NOT_FOUND");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
          action: "overlay.task.update",
          module: "rota",
          resourceType: "overlay_task",
          resourceId: taskId,
          afterValue: updated as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return updated;
      }),

    complete: requireRole("rota", "update")
      .input(
        z.object({
          taskId: z.string(),
          notes: z.string().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const [completed] = await db
          .update(overlayTasks)
          .set({
            status: "completed",
            completedAt: new Date(),
            completedById: context.session.user.id,
            notes: input.notes,
          })
          .where(eq(overlayTasks.id, input.taskId))
          .returning();
        if (!completed) throw new ORPCError("NOT_FOUND");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
          action: "overlay.task.complete",
          module: "rota",
          resourceType: "overlay_task",
          resourceId: input.taskId,
          afterValue: { status: "completed", completedAt: completed.completedAt },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return completed;
      }),
  },

  // ── Stats / Dashboard ──────────────────────────────────────────────────
  stats: protectedProcedure.handler(async () => {
    const today = new Date().toISOString().slice(0, 10);

    const [allTasks, overdueTasks, pendingTasks, completedTasks] =
      await Promise.all([
        db.query.overlayTasks.findMany({ columns: { id: true, status: true } }),
        db.query.overlayTasks.findMany({
          where: and(
            sql`${overlayTasks.status} IN ('pending', 'in_progress')`,
            lte(overlayTasks.dueDate, today),
          ),
          columns: { id: true },
        }),
        db.query.overlayTasks.findMany({
          where: eq(overlayTasks.status, "pending"),
          columns: { id: true },
        }),
        db.query.overlayTasks.findMany({
          where: eq(overlayTasks.status, "completed"),
          columns: { id: true },
        }),
      ]);

    const completionRate =
      allTasks.length > 0
        ? Math.round((completedTasks.length / allTasks.length) * 100)
        : 0;

    return {
      total: allTasks.length,
      overdue: overdueTasks.length,
      pending: pendingTasks.length,
      completed: completedTasks.length,
      completionRate,
    };
  }),
};
