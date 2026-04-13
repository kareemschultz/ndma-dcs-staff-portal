import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db, temporaryChanges } from "@ndma-dcs-staff-portal/db";
import { and, desc, eq, lt, sql } from "drizzle-orm";

import { protectedProcedure } from "../index";
import { logAudit } from "../lib/audit";

const StatusSchema = z.enum([
  "planned",
  "implemented",
  "active",
  "overdue",
  "removed",
  "cancelled",
]);

export const tempChangesRouter = {
  list: protectedProcedure
    .input(
      z.object({
        status: StatusSchema.optional(),
        ownerId: z.string().optional(),
        serviceId: z.string().optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .handler(async ({ input }) => {
      const conditions = [];
      if (input.status) conditions.push(eq(temporaryChanges.status, input.status));
      if (input.ownerId) conditions.push(eq(temporaryChanges.ownerId, input.ownerId));
      if (input.serviceId) conditions.push(eq(temporaryChanges.serviceId, input.serviceId));

      return db.query.temporaryChanges.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: desc(temporaryChanges.createdAt),
        limit: input.limit,
        offset: input.offset,
        with: {
          owner: { with: { user: true } },
          service: true,
          createdBy: true,
          approvedBy: true,
        },
      });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const change = await db.query.temporaryChanges.findFirst({
        where: eq(temporaryChanges.id, input.id),
        with: {
          owner: { with: { user: true } },
          service: true,
          createdBy: true,
          approvedBy: true,
        },
      });
      if (!change) throw new ORPCError("NOT_FOUND");
      return change;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        justification: z.string().optional(),
        ownerId: z.string().optional(),
        serviceId: z.string().optional(),
        implementationDate: z.string().optional(),
        removeByDate: z.string().optional(),
        rollbackPlan: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const [change] = await db
        .insert(temporaryChanges)
        .values({
          ...input,
          createdById: context.session.user.id,
          description: input.description ?? null,
          justification: input.justification ?? null,
          ownerId: input.ownerId ?? null,
          serviceId: input.serviceId ?? null,
          implementationDate: input.implementationDate ?? null,
          removeByDate: input.removeByDate ?? null,
          rollbackPlan: input.rollbackPlan ?? null,
        })
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "temp_change.create",
        module: "changes",
        resourceType: "temporary_change",
        resourceId: change.id,
        afterValue: change as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return change;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        justification: z.string().optional(),
        ownerId: z.string().optional(),
        serviceId: z.string().optional(),
        implementationDate: z.string().optional(),
        removeByDate: z.string().optional(),
        status: StatusSchema.optional(),
        rollbackPlan: z.string().optional(),
        followUpNotes: z.string().optional(),
        approvedById: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const { id, ...updates } = input;
      const before = await db.query.temporaryChanges.findFirst({
        where: eq(temporaryChanges.id, id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      const [updated] = await db
        .update(temporaryChanges)
        .set(updates)
        .where(eq(temporaryChanges.id, id))
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "temp_change.update",
        module: "changes",
        resourceType: "temporary_change",
        resourceId: id,
        beforeValue: before as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return updated;
    }),

  markRemoved: protectedProcedure
    .input(z.object({ id: z.string(), followUpNotes: z.string().optional() }))
    .handler(async ({ input, context }) => {
      const today = new Date().toISOString().split("T")[0];
      const [updated] = await db
        .update(temporaryChanges)
        .set({
          status: "removed",
          actualRemovalDate: today,
          followUpNotes: input.followUpNotes ?? null,
        })
        .where(eq(temporaryChanges.id, input.id))
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "temp_change.mark_removed",
        module: "changes",
        resourceType: "temporary_change",
        resourceId: input.id,
        afterValue: { status: "removed", actualRemovalDate: today },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return updated;
    }),

  getOverdue: protectedProcedure.handler(async () => {
    const today = new Date().toISOString().split("T")[0];
    return db.query.temporaryChanges.findMany({
      where: and(
        sql`${temporaryChanges.removeByDate} IS NOT NULL`,
        lt(temporaryChanges.removeByDate, today),
        sql`${temporaryChanges.status} NOT IN ('removed', 'cancelled')`,
      ),
      with: {
        owner: { with: { user: true } },
        service: true,
      },
    });
  }),

  stats: protectedProcedure.handler(async () => {
    const all = await db.query.temporaryChanges.findMany({
      columns: { id: true, status: true, removeByDate: true },
    });
    const today = new Date().toISOString().split("T")[0];
    const byStatus: Record<string, number> = {};
    let overdue = 0;

    for (const c of all) {
      byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
      if (
        c.removeByDate &&
        c.removeByDate < today &&
        !["removed", "cancelled"].includes(c.status)
      ) {
        overdue++;
      }
    }

    return { total: all.length, byStatus, overdue };
  }),
};
