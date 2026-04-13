import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db, contracts } from "@ndma-dcs-staff-portal/db";
import { and, eq, lte, sql } from "drizzle-orm";

import { protectedProcedure, requireRole } from "../index";
import { logAudit } from "../lib/audit";

export const contractsRouter = {
  list: protectedProcedure
    .input(
      z.object({
        staffProfileId: z.string().optional(),
        status: z
          .enum(["active", "expiring_soon", "expired", "renewed", "terminated"])
          .optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .handler(async ({ input }) => {
      const conditions = [];
      if (input.staffProfileId)
        conditions.push(eq(contracts.staffProfileId, input.staffProfileId));
      if (input.status) conditions.push(eq(contracts.status, input.status));

      return db.query.contracts.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: { staffProfile: { with: { user: true } } },
        limit: input.limit,
        offset: input.offset,
      });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const contract = await db.query.contracts.findFirst({
        where: eq(contracts.id, input.id),
        with: { staffProfile: { with: { user: true, department: true } } },
      });
      if (!contract) throw new ORPCError("NOT_FOUND");
      return contract;
    }),

  create: requireRole("contract", "create")
    .input(
      z.object({
        staffProfileId: z.string(),
        contractType: z.string().min(1),
        startDate: z.string(),
        endDate: z.string().optional(),
        renewalReminderDays: z.number().default(60),
        documentUrl: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const [contract] = await db
        .insert(contracts)
        .values({
          ...input,
          endDate: input.endDate ?? null,
        })
        .returning();
      if (!contract) throw new ORPCError("INTERNAL_SERVER_ERROR");

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "contract.create",
        module: "staff",
        resourceType: "contract",
        resourceId: contract.id,
        afterValue: contract as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
      });

      return contract;
    }),

  update: requireRole("contract", "update")
    .input(
      z.object({
        id: z.string(),
        contractType: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        renewalReminderDays: z.number().optional(),
        status: z
          .enum(["active", "expiring_soon", "expired", "renewed", "terminated"])
          .optional(),
        documentUrl: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const { id, ...updates } = input;
      const before = await db.query.contracts.findFirst({
        where: eq(contracts.id, id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      const [updated] = await db
        .update(contracts)
        .set(updates)
        .where(eq(contracts.id, id))
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "contract.update",
        module: "staff",
        resourceType: "contract",
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

  getExpiringSoon: protectedProcedure
    .input(z.object({ withinDays: z.number().default(60) }))
    .handler(async ({ input }) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + input.withinDays);
      const cutoffStr = cutoff.toISOString().slice(0, 10);

      return db.query.contracts.findMany({
        where: and(
          sql`${contracts.endDate} IS NOT NULL`,
          lte(contracts.endDate, cutoffStr),
          sql`${contracts.status} NOT IN ('expired', 'terminated', 'renewed')`,
        ),
        with: { staffProfile: { with: { user: true, department: true } } },
      });
    }),
};
