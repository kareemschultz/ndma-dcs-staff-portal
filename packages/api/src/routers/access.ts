import { ORPCError } from "@orpc/server";
import { z } from "zod";
import {
  db,
  platformAccounts,
  platformIntegrations,
  reconciliationIssues,
  serviceOwners,
  syncJobs,
} from "@ndma-dcs-staff-portal/db";
import { and, eq, isNull, lte, sql } from "drizzle-orm";

import { protectedProcedure } from "../index";
import { logAudit } from "../lib/audit";

// ── Shared enum values ────────────────────────────────────────────────────

const PLATFORM_VALUES = [
  "vpn",
  "fortigate",
  "uportal",
  "biometric",
  "ad",
  "ipam",
  "radius",
  "other",
] as const;

const ACCOUNT_STATUS_VALUES = [
  "active",
  "suspended",
  "disabled",
  "pending_creation",
] as const;

const AUTH_SOURCE_VALUES = [
  "local",
  "active_directory",
  "ldap",
  "radius",
  "saml",
  "oauth_oidc",
  "service_account",
  "api_only",
] as const;

const SYNC_MODE_VALUES = ["manual", "synced", "hybrid"] as const;

export const accessRouter = {
  // ── Platform Accounts ───────────────────────────────────────────────────

  accounts: {
    list: protectedProcedure
      .input(
        z.object({
          staffProfileId: z.string().optional(),
          platform: z.enum(PLATFORM_VALUES).optional(),
          status: z.enum(ACCOUNT_STATUS_VALUES).optional(),
          syncMode: z.enum(SYNC_MODE_VALUES).optional(),
          authSource: z.enum(AUTH_SOURCE_VALUES).optional(),
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
        if (input.syncMode)
          conditions.push(eq(platformAccounts.syncMode, input.syncMode));
        if (input.authSource)
          conditions.push(eq(platformAccounts.authSource, input.authSource));

        return db.query.platformAccounts.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          with: { staffProfile: { with: { user: true, department: true } } },
          orderBy: (t, { desc }) => [desc(t.createdAt)],
        });
      }),

    getByStaff: protectedProcedure
      .input(z.object({ staffProfileId: z.string() }))
      .handler(async ({ input }) => {
        return db.query.platformAccounts.findMany({
          where: eq(platformAccounts.staffProfileId, input.staffProfileId),
          orderBy: (t, { asc }) => [asc(t.platform)],
        });
      }),

    getByPlatform: protectedProcedure
      .input(z.object({ platform: z.enum(PLATFORM_VALUES) }))
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

    /** Accounts with no linked staff profile — potential orphans. */
    getOrphaned: protectedProcedure.handler(async () => {
      return db.query.platformAccounts.findMany({
        where: and(
          // synced records with no staff link (staffProfileId is always set by FK,
          // but we can find stale ones via reconciliation_issues)
          eq(platformAccounts.syncMode, "synced"),
          eq(platformAccounts.status, "active"),
        ),
        with: { staffProfile: { with: { user: true } } },
      });
    }),

    create: protectedProcedure
      .input(
        z.object({
          staffProfileId: z.string(),
          platform: z.enum(PLATFORM_VALUES),
          accountIdentifier: z.string().min(1),
          displayName: z.string().optional(),
          authSource: z.enum(AUTH_SOURCE_VALUES).default("local"),
          privilegeLevel: z.string().optional(),
          status: z.enum(ACCOUNT_STATUS_VALUES).default("active"),
          syncMode: z.enum(SYNC_MODE_VALUES).default("manual"),
          externalAccountId: z.string().optional(),
          syncSourceSystem: z.string().optional(),
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
            createdByUserId: context.session.user.id,
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
          displayName: z.string().optional(),
          authSource: z.enum(AUTH_SOURCE_VALUES).optional(),
          privilegeLevel: z.string().optional(),
          status: z.enum(ACCOUNT_STATUS_VALUES).optional(),
          syncMode: z.enum(SYNC_MODE_VALUES).optional(),
          expiresAt: z.string().optional(),
          lastVerifiedAt: z.string().optional(),
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

  // ── Platform Integrations ───────────────────────────────────────────────

  integrations: {
    list: protectedProcedure.handler(async () => {
      return db.query.platformIntegrations.findMany({
        with: { syncJobs: { limit: 1, orderBy: (t, { desc }) => [desc(t.createdAt)] } },
        orderBy: (t, { asc }) => [asc(t.platform)],
      });
    }),

    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        const integration = await db.query.platformIntegrations.findFirst({
          where: eq(platformIntegrations.id, input.id),
          with: {
            syncJobs: {
              limit: 10,
              orderBy: (t, { desc }) => [desc(t.createdAt)],
            },
            reconciliationIssues: {
              where: isNull(reconciliationIssues.resolvedAt),
              limit: 50,
            },
          },
        });
        if (!integration) throw new ORPCError("NOT_FOUND");
        return integration;
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          platform: z.enum(PLATFORM_VALUES),
          description: z.string().optional(),
          hasApi: z.boolean().default(false),
          syncEnabled: z.boolean().default(false),
          syncDirection: z.enum(["inbound", "outbound", "bidirectional"]).default("inbound"),
          syncFrequencyMinutes: z.number().optional(),
          authoritativeSource: z.string().default("external"),
          manualFallbackAllowed: z.boolean().default(true),
          apiBaseUrl: z.string().url().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const [integration] = await db
          .insert(platformIntegrations)
          .values({ ...input, status: "pending" })
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "access.integration.create",
          module: "access",
          resourceType: "platform_integration",
          resourceId: integration.id,
          afterValue: integration as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return integration;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.string(),
          name: z.string().optional(),
          description: z.string().optional(),
          syncEnabled: z.boolean().optional(),
          syncFrequencyMinutes: z.number().optional(),
          manualFallbackAllowed: z.boolean().optional(),
          apiBaseUrl: z.string().url().optional(),
          status: z.enum(["active", "inactive", "error", "pending"]).optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const { id, ...updates } = input;
        const [updated] = await db
          .update(platformIntegrations)
          .set(updates)
          .where(eq(platformIntegrations.id, id))
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "access.integration.update",
          module: "access",
          resourceType: "platform_integration",
          resourceId: id,
          afterValue: updated as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return updated;
      }),

    /** Manually trigger a sync run (stub — actual sync logic is a future connector). */
    triggerSync: protectedProcedure
      .input(z.object({ integrationId: z.string() }))
      .handler(async ({ input, context }) => {
        const integration = await db.query.platformIntegrations.findFirst({
          where: eq(platformIntegrations.id, input.integrationId),
        });
        if (!integration) throw new ORPCError("NOT_FOUND");
        if (!integration.syncEnabled)
          throw new ORPCError("BAD_REQUEST", { message: "Sync is not enabled for this integration" });

        // Create a pending job record — the actual sync worker picks this up
        const [job] = await db
          .insert(syncJobs)
          .values({
            integrationId: input.integrationId,
            triggeredBy: "manual",
            triggeredByUserId: context.session.user.id,
            status: "pending",
          })
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "access.integration.sync_trigger",
          module: "access",
          resourceType: "sync_job",
          resourceId: job.id,
          afterValue: { integrationId: input.integrationId, triggeredBy: "manual" },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return job;
      }),
  },

  // ── Sync Jobs ───────────────────────────────────────────────────────────

  syncJobs: {
    list: protectedProcedure
      .input(
        z.object({
          integrationId: z.string().optional(),
          limit: z.number().default(20),
          offset: z.number().default(0),
        }),
      )
      .handler(async ({ input }) => {
        return db.query.syncJobs.findMany({
          where: input.integrationId
            ? eq(syncJobs.integrationId, input.integrationId)
            : undefined,
          with: {
            integration: true,
            triggeredByUser: true,
          },
          orderBy: (t, { desc }) => [desc(t.createdAt)],
          limit: input.limit,
          offset: input.offset,
        });
      }),
  },

  // ── Reconciliation Issues ───────────────────────────────────────────────

  reconciliation: {
    list: protectedProcedure
      .input(
        z.object({
          integrationId: z.string().optional(),
          issueType: z
            .enum([
              "orphaned_account",
              "stale_account",
              "no_staff_link",
              "username_mismatch",
              "duplicate",
            ])
            .optional(),
          resolved: z.boolean().default(false),
        }),
      )
      .handler(async ({ input }) => {
        const conditions = [];
        if (input.integrationId)
          conditions.push(eq(reconciliationIssues.integrationId, input.integrationId));
        if (input.issueType)
          conditions.push(eq(reconciliationIssues.issueType, input.issueType));
        if (!input.resolved)
          conditions.push(isNull(reconciliationIssues.resolvedAt));

        return db.query.reconciliationIssues.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          with: {
            integration: true,
            platformAccount: { with: { staffProfile: { with: { user: true } } } },
            staffProfile: { with: { user: true } },
          },
          orderBy: (t, { desc }) => [desc(t.createdAt)],
        });
      }),

    resolve: protectedProcedure
      .input(
        z.object({
          id: z.string(),
          resolutionNote: z.string().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const [resolved] = await db
          .update(reconciliationIssues)
          .set({
            resolvedAt: new Date(),
            resolvedByUserId: context.session.user.id,
            resolutionNote: input.resolutionNote ?? null,
          })
          .where(eq(reconciliationIssues.id, input.id))
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "access.reconciliation.resolve",
          module: "access",
          resourceType: "reconciliation_issue",
          resourceId: input.id,
          afterValue: { resolvedAt: new Date(), note: input.resolutionNote },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return resolved;
      }),
  },

  // ── Service Owners ──────────────────────────────────────────────────────

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
