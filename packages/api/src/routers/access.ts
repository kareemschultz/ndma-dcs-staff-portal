import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db, platformAccounts, serviceOwners } from "@ndma-dcs-staff-portal/db";
import { and, eq, lte, sql } from "drizzle-orm";

import { protectedProcedure } from "../index";
import { logAudit } from "../lib/audit";

export const accessRouter = {
  accounts: {
    list: protectedProcedure
      .input(
        z.object({
          staffProfileId: z.string().optional(),
          platform: z
            .enum(["vpn", "fortigate", "uportal", "biometric", "ad", "other"])
            .optional(),
          status: z
            .enum(["active", "suspended", "disabled", "pending_creation"])
            .optional(),
        }),
      )
      .handler(async ({ input }) => {
        const conditions = [];
        if (input.staffProfileId)
          conditions.push(eq(platformAccounts.staffProfileId, input.staffProfileId));
        if (input.platform)
          conditions.push(eq(platformAccounts.platform, input.platform));
        if (input.status)
          conditions.push(eq(platformAccounts.status, input.status));

        return db.query.platformAccounts.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          with: { staffProfile: { with: { user: true, department: true } } },
        });
      }),

    getByStaff: protectedProcedure
      .input(z.object({ staffProfileId: z.string() }))
      .handler(async ({ input }) => {
        return db.query.platformAccounts.findMany({
          where: eq(platformAccounts.staffProfileId, input.staffProfileId),
        });
      }),

    getByPlatform: protectedProcedure
      .input(
        z.object({
          platform: z.enum(["vpn", "fortigate", "uportal", "biometric", "ad", "other"]),
        }),
      )
      .handler(async ({ input }) => {
        return db.query.platformAccounts.findMany({
          where: eq(platformAccounts.platform, input.platform),
          with: { staffProfile: { with: { user: true, department: true } } },
        });
      }),

    getExpiring: protectedProcedure
      .input(z.object({ withinDays: z.number().default(30) }))
      .handler(async ({ input }) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + input.withinDays);
        const cutoffStr = cutoff.toISOString().split("T")[0];

        return db.query.platformAccounts.findMany({
          where: and(
            sql`${platformAccounts.expiresAt} IS NOT NULL`,
            lte(platformAccounts.expiresAt, cutoffStr),
            eq(platformAccounts.status, "active"),
          ),
          with: { staffProfile: { with: { user: true, department: true } } },
        });
      }),

    create: protectedProcedure
      .input(
        z.object({
          staffProfileId: z.string(),
          platform: z.enum(["vpn", "fortigate", "uportal", "biometric", "ad", "other"]),
          accountIdentifier: z.string().min(1),
          status: z
            .enum(["active", "suspended", "disabled", "pending_creation"])
            .default("active"),
          provisionedAt: z.string().optional(),
          expiresAt: z.string().optional(),
          notes: z.string().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const [account] = await db
          .insert(platformAccounts)
          .values({
            ...input,
            provisionedAt: input.provisionedAt ?? null,
            expiresAt: input.expiresAt ?? null,
            notes: input.notes ?? null,
          })
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "access.account.create",
          module: "access",
          resourceType: "platform_account",
          resourceId: account.id,
          afterValue: account as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return account;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.string(),
          status: z
            .enum(["active", "suspended", "disabled", "pending_creation"])
            .optional(),
          expiresAt: z.string().optional(),
          notes: z.string().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const { id, ...updates } = input;
        const before = await db.query.platformAccounts.findFirst({
          where: eq(platformAccounts.id, id),
        });
        if (!before) throw new ORPCError("NOT_FOUND");

        const [updated] = await db
          .update(platformAccounts)
          .set(updates)
          .where(eq(platformAccounts.id, id))
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "access.account.update",
          module: "access",
          resourceType: "platform_account",
          resourceId: id,
          beforeValue: before as Record<string, unknown>,
          afterValue: updated as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return updated;
      }),

    markReviewed: protectedProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const today = new Date().toISOString().split("T")[0];
        const [updated] = await db
          .update(platformAccounts)
          .set({ lastReviewedAt: today })
          .where(eq(platformAccounts.id, input.id))
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "access.account.review",
          module: "access",
          resourceType: "platform_account",
          resourceId: input.id,
          afterValue: { lastReviewedAt: today } as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return updated;
      }),
  },

  serviceOwners: {
    list: protectedProcedure
      .input(z.object({ serviceId: z.string().optional() }))
      .handler(async ({ input }) => {
        return db.query.serviceOwners.findMany({
          where: input.serviceId
            ? eq(serviceOwners.serviceId, input.serviceId)
            : undefined,
          with: {
            service: true,
            staffProfile: { with: { user: true } },
          },
        });
      }),

    assign: protectedProcedure
      .input(
        z.object({
          serviceId: z.string(),
          staffProfileId: z.string(),
          role: z.enum(["owner", "backup", "contributor"]).default("owner"),
        }),
      )
      .handler(async ({ input, context }) => {
        const [owner] = await db
          .insert(serviceOwners)
          .values(input)
          .onConflictDoUpdate({
            target: [serviceOwners.serviceId, serviceOwners.staffProfileId],
            set: { role: input.role },
          })
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "access.service_owner.assign",
          module: "access",
          resourceType: "service_owner",
          resourceId: owner.id,
          afterValue: owner as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return owner;
      }),

    remove: protectedProcedure
      .input(z.object({ serviceId: z.string(), staffProfileId: z.string() }))
      .handler(async ({ input, context }) => {
        await db
          .delete(serviceOwners)
          .where(
            and(
              eq(serviceOwners.serviceId, input.serviceId),
              eq(serviceOwners.staffProfileId, input.staffProfileId),
            ),
          );

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "access.service_owner.remove",
          module: "access",
          resourceType: "service_owner",
          resourceId: `${input.serviceId}:${input.staffProfileId}`,
          beforeValue: input as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return { success: true };
      }),

    getByService: protectedProcedure
      .input(z.object({ serviceId: z.string() }))
      .handler(async ({ input }) => {
        return db.query.serviceOwners.findMany({
          where: eq(serviceOwners.serviceId, input.serviceId),
          with: { staffProfile: { with: { user: true } } },
        });
      }),
  },
};
