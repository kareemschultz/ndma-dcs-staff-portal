import { ORPCError } from "@orpc/server";
import { z } from "zod";
import {
  db,
  trainingRecords,
  ppeRecords,
  policyAcknowledgements,
} from "@ndma-dcs-staff-portal/db";
import { and, eq, lte, sql } from "drizzle-orm";

import { protectedProcedure } from "../index";
import { logAudit } from "../lib/audit";

export const complianceRouter = {
  // ── Training ─────────────────────────────────────────────────────────────
  training: {
    list: protectedProcedure
      .input(
        z.object({
          staffProfileId: z.string().optional(),
          status: z
            .enum(["current", "expiring_soon", "expired", "not_applicable"])
            .optional(),
        }),
      )
      .handler(async ({ input }) => {
        const conditions = [];
        if (input.staffProfileId)
          conditions.push(eq(trainingRecords.staffProfileId, input.staffProfileId));
        if (input.status)
          conditions.push(eq(trainingRecords.status, input.status));

        return db.query.trainingRecords.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          with: { staffProfile: { with: { user: true } } },
        });
      }),

    create: protectedProcedure
      .input(
        z.object({
          staffProfileId: z.string(),
          trainingName: z.string().min(1),
          provider: z.string().optional(),
          completedDate: z.string().optional(),
          expiryDate: z.string().optional(),
          certificateUrl: z.string().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const [record] = await db
          .insert(trainingRecords)
          .values({
            ...input,
            completedDate: input.completedDate ?? null,
            expiryDate: input.expiryDate ?? null,
            certificateUrl: input.certificateUrl ?? null,
            provider: input.provider ?? null,
          })
          .returning();
        if (!record) throw new ORPCError("INTERNAL_SERVER_ERROR");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "training.create",
          module: "compliance",
          resourceType: "training_record",
          resourceId: record.id,
          afterValue: record as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return record;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.string(),
          trainingName: z.string().optional(),
          provider: z.string().optional(),
          completedDate: z.string().optional(),
          expiryDate: z.string().optional(),
          certificateUrl: z.string().optional(),
          status: z
            .enum(["current", "expiring_soon", "expired", "not_applicable"])
            .optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const { id, ...updates } = input;
        const before = await db.query.trainingRecords.findFirst({
          where: eq(trainingRecords.id, id),
        });
        if (!before) throw new ORPCError("NOT_FOUND");

        const [updated] = await db
          .update(trainingRecords)
          .set(updates)
          .where(eq(trainingRecords.id, id))
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "training.update",
          module: "compliance",
          resourceType: "training_record",
          resourceId: id,
          beforeValue: before as Record<string, unknown>,
          afterValue: updated as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return updated;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        await db.delete(trainingRecords).where(eq(trainingRecords.id, input.id));
        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "training.delete",
          module: "compliance",
          resourceType: "training_record",
          resourceId: input.id,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });
        return { success: true };
      }),
  },

  // ── PPE ───────────────────────────────────────────────────────────────────
  ppe: {
    list: protectedProcedure
      .input(z.object({ staffProfileId: z.string().optional() }))
      .handler(async ({ input }) => {
        return db.query.ppeRecords.findMany({
          where: input.staffProfileId
            ? eq(ppeRecords.staffProfileId, input.staffProfileId)
            : undefined,
          with: { staffProfile: { with: { user: true } } },
        });
      }),

    create: protectedProcedure
      .input(
        z.object({
          staffProfileId: z.string(),
          itemName: z.string().min(1),
          issuedDate: z.string().optional(),
          expiryDate: z.string().optional(),
          size: z.string().optional(),
          condition: z.string().default("good"),
        }),
      )
      .handler(async ({ input, context }) => {
        const [record] = await db
          .insert(ppeRecords)
          .values({
            ...input,
            issuedDate: input.issuedDate ?? null,
            expiryDate: input.expiryDate ?? null,
            size: input.size ?? null,
          })
          .returning();
        if (!record) throw new ORPCError("INTERNAL_SERVER_ERROR");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "ppe.create",
          module: "compliance",
          resourceType: "ppe_record",
          resourceId: record.id,
          afterValue: record as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return record;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.string(),
          itemName: z.string().optional(),
          issuedDate: z.string().optional(),
          expiryDate: z.string().optional(),
          size: z.string().optional(),
          condition: z.string().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const { id, ...updates } = input;
        const before = await db.query.ppeRecords.findFirst({
          where: eq(ppeRecords.id, id),
        });
        if (!before) throw new ORPCError("NOT_FOUND");

        const [updated] = await db
          .update(ppeRecords)
          .set(updates)
          .where(eq(ppeRecords.id, id))
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "ppe.update",
          module: "compliance",
          resourceType: "ppe_record",
          resourceId: id,
          beforeValue: before as Record<string, unknown>,
          afterValue: updated as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return updated;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        await db.delete(ppeRecords).where(eq(ppeRecords.id, input.id));
        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "ppe.delete",
          module: "compliance",
          resourceType: "ppe_record",
          resourceId: input.id,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });
        return { success: true };
      }),
  },

  // ── Policy Acknowledgements ───────────────────────────────────────────────
  policyAck: {
    list: protectedProcedure
      .input(z.object({ staffProfileId: z.string().optional() }))
      .handler(async ({ input }) => {
        return db.query.policyAcknowledgements.findMany({
          where: input.staffProfileId
            ? eq(policyAcknowledgements.staffProfileId, input.staffProfileId)
            : undefined,
          with: { staffProfile: { with: { user: true } } },
        });
      }),

    acknowledge: protectedProcedure
      .input(
        z.object({
          staffProfileId: z.string(),
          policyName: z.string().min(1),
          policyVersion: z.string().min(1),
        }),
      )
      .handler(async ({ input, context }) => {
        const [record] = await db
          .insert(policyAcknowledgements)
          .values(input)
          .returning();
        if (!record) throw new ORPCError("INTERNAL_SERVER_ERROR");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "policy.acknowledge",
          module: "compliance",
          resourceType: "policy_acknowledgement",
          resourceId: record.id,
          afterValue: record as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return record;
      }),
  },

  // ── Cross-cutting: items expiring across all compliance tables ────────────
  getExpiringItems: protectedProcedure
    .input(z.object({ withinDays: z.number().default(30) }))
    .handler(async ({ input }) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + input.withinDays);
      const cutoffStr = cutoff.toISOString().slice(0, 10);

      const [training, ppe] = await Promise.all([
        db.query.trainingRecords.findMany({
          where: and(
            sql`${trainingRecords.expiryDate} IS NOT NULL`,
            lte(trainingRecords.expiryDate, cutoffStr),
            sql`${trainingRecords.status} NOT IN ('expired', 'not_applicable')`,
          ),
          with: { staffProfile: { with: { user: true } } },
        }),
        db.query.ppeRecords.findMany({
          where: and(
            sql`${ppeRecords.expiryDate} IS NOT NULL`,
            lte(ppeRecords.expiryDate, cutoffStr),
          ),
          with: { staffProfile: { with: { user: true } } },
        }),
      ]);

      return { training, ppe };
    }),
};
