import { ORPCError } from "@orpc/server";
import { z } from "zod";
import {
  db,
  cycles,
  cycleWorkItems,
  workItems,
} from "@ndma-dcs-staff-portal/db";
import { and, desc, eq, gte, lte } from "drizzle-orm";

import { protectedProcedure, requireRole } from "../index";
import { logAudit } from "../lib/audit";

const CycleStatusSchema = z.enum(["draft", "active", "completed", "cancelled"]);
const CyclePeriodSchema = z.enum([
  "weekly",
  "fortnightly",
  "monthly",
  "quarterly",
  "custom",
]);

export const cyclesRouter = {
  list: protectedProcedure
    .input(
      z.object({
        status: CycleStatusSchema.optional(),
        departmentId: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .handler(async ({ input }) => {
      const conditions = [];
      if (input.status) conditions.push(eq(cycles.status, input.status));
      if (input.departmentId)
        conditions.push(eq(cycles.departmentId, input.departmentId));
      if (input.from) conditions.push(gte(cycles.startDate, input.from));
      if (input.to) conditions.push(lte(cycles.endDate, input.to));

      return db.query.cycles.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(cycles.startDate)],
        limit: input.limit,
        with: {
          department: true,
          createdBy: true,
          cycleWorkItems: {
            with: { workItem: { columns: { id: true, status: true } } },
          },
        },
      });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const cycle = await db.query.cycles.findFirst({
        where: eq(cycles.id, input.id),
        with: {
          department: true,
          createdBy: true,
          cycleWorkItems: {
            with: {
              workItem: {
                with: {
                  assignedTo: { with: { user: true } },
                  department: true,
                },
              },
            },
          },
        },
      });
      if (!cycle) throw new ORPCError("NOT_FOUND");
      return cycle;
    }),

  create: requireRole("work", "create")
    .input(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().optional(),
        period: CyclePeriodSchema,
        departmentId: z.string().optional(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    )
    .handler(async ({ input, context }) => {
      const [cycle] = await db
        .insert(cycles)
        .values({
          ...input,
          description: input.description ?? null,
          departmentId: input.departmentId ?? null,
          createdById: context.session.user.id,
        })
        .returning();
      if (!cycle) throw new ORPCError("INTERNAL_SERVER_ERROR");

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "cycle.create",
        module: "work",
        resourceType: "cycle",
        resourceId: cycle.id,
        afterValue: cycle as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
      });

      return cycle;
    }),

  update: requireRole("work", "update")
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        status: CycleStatusSchema.optional(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const { id, ...updates } = input;
      const before = await db.query.cycles.findFirst({
        where: eq(cycles.id, id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      const [updated] = await db
        .update(cycles)
        .set(updates)
        .where(eq(cycles.id, id))
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "cycle.update",
        module: "work",
        resourceType: "cycle",
        resourceId: id,
        beforeValue: before as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
      });

      return updated;
    }),

  addWorkItem: requireRole("work", "update")
    .input(z.object({ cycleId: z.string(), workItemId: z.string() }))
    .handler(async ({ input, context }) => {
      const cycle = await db.query.cycles.findFirst({
        where: eq(cycles.id, input.cycleId),
      });
      if (!cycle) throw new ORPCError("NOT_FOUND", { message: "Cycle not found" });

      const item = await db.query.workItems.findFirst({
        where: eq(workItems.id, input.workItemId),
      });
      if (!item) throw new ORPCError("NOT_FOUND", { message: "Work item not found" });

      const [cw] = await db
        .insert(cycleWorkItems)
        .values({ cycleId: input.cycleId, workItemId: input.workItemId })
        .onConflictDoNothing()
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "cycle.add_work_item",
        module: "work",
        resourceType: "cycle",
        resourceId: input.cycleId,
        afterValue: { workItemId: input.workItemId } as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
      });

      return cw ?? null;
    }),

  removeWorkItem: requireRole("work", "update")
    .input(z.object({ cycleId: z.string(), workItemId: z.string() }))
    .handler(async ({ input, context }) => {
      await db
        .delete(cycleWorkItems)
        .where(
          and(
            eq(cycleWorkItems.cycleId, input.cycleId),
            eq(cycleWorkItems.workItemId, input.workItemId),
          ),
        );

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "cycle.remove_work_item",
        module: "work",
        resourceType: "cycle",
        resourceId: input.cycleId,
        afterValue: { workItemId: input.workItemId } as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
      });

      return { success: true };
    }),

  stats: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const cycle = await db.query.cycles.findFirst({
        where: eq(cycles.id, input.id),
        with: {
          cycleWorkItems: {
            with: { workItem: { columns: { id: true, status: true } } },
          },
        },
      });
      if (!cycle) throw new ORPCError("NOT_FOUND");

      const items = cycle.cycleWorkItems.map((cwi) => cwi.workItem);
      const total = items.length;
      const byStatus: Record<string, number> = {};
      for (const item of items) {
        byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
      }
      const completed = byStatus["done"] ?? 0;
      const completionRate =
        total > 0 ? Math.round((completed / total) * 100) : 0;

      return { total, completed, completionRate, byStatus };
    }),
};
