import { ORPCError } from "@orpc/server";
import { z } from "zod";
import {
  db,
  accessGroups,
  accessReviews,
  accountGroupMemberships,
  externalContacts,
  platformAccounts,
  platformIntegrations,
  reconciliationIssues,
  serviceOwners,
  syncJobs,
} from "@ndma-dcs-staff-portal/db";
import { and, eq, isNull, isNotNull, lte } from "drizzle-orm";

import { requireRole } from "../index";
import { logAudit } from "../lib/audit";
import { runSyncJob } from "../lib/sync";

// ── Shared enum values ────────────────────────────────────────────────────

const PLATFORM_VALUES = [
  "vpn",
  "fortigate",
  "uportal",
  "biometric",
  "ad",
  "ipam",
  "phpipam",
  "radius",
  "zabbix",
  "other",
] as const;

const ACCOUNT_STATUS_VALUES = [
  "active",
  "suspended",
  "disabled",
  "pending_creation",
  "orphaned",
  "pending_review",
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

const AFFILIATION_VALUES = [
  "ndma_internal",
  "external_agency",
  "contractor",
  "consultant",
  "vendor",
  "shared_service",
] as const;

const ACCESS_GROUP_TYPE_VALUES = [
  "ad_group",
  "vpn_group",
  "platform_role",
  "local_group",
  "radius_group",
] as const;

const ACCESS_REVIEW_STATUS_VALUES = [
  "pending",
  "approved",
  "revoked",
  "escalated",
] as const;

export const accessRouter = {
  // ── Platform Accounts ───────────────────────────────────────────────────

  accounts: {
    list: requireRole("access", "read")
      .input(
        z.object({
          staffProfileId: z.string().optional(),
          externalContactId: z.string().optional(),
          platform: z.enum(PLATFORM_VALUES).optional(),
          status: z.enum(ACCOUNT_STATUS_VALUES).optional(),
          syncMode: z.enum(SYNC_MODE_VALUES).optional(),
          authSource: z.enum(AUTH_SOURCE_VALUES).optional(),
          affiliationType: z.enum(AFFILIATION_VALUES).optional(),
          vpnEnabled: z.boolean().optional(),
          isOrphaned: z.boolean().optional(),
          isStale: z.boolean().optional(),
          reviewDue: z.boolean().optional(), // accounts with reviewDueDate <= today
          limit: z.number().default(100),
          offset: z.number().default(0),
        }),
      )
      .handler(async ({ input }) => {
        const conditions = [];
        if (input.staffProfileId)
          conditions.push(eq(platformAccounts.staffProfileId, input.staffProfileId));
        if (input.externalContactId)
          conditions.push(eq(platformAccounts.externalContactId, input.externalContactId));
        if (input.platform)
          conditions.push(eq(platformAccounts.platform, input.platform));
        if (input.status)
          conditions.push(eq(platformAccounts.status, input.status));
        if (input.syncMode)
          conditions.push(eq(platformAccounts.syncMode, input.syncMode));
        if (input.authSource)
          conditions.push(eq(platformAccounts.authSource, input.authSource));
        if (input.affiliationType)
          conditions.push(eq(platformAccounts.affiliationType, input.affiliationType));
        if (input.vpnEnabled !== undefined)
          conditions.push(eq(platformAccounts.vpnEnabled, input.vpnEnabled));
        if (input.isOrphaned !== undefined)
          conditions.push(eq(platformAccounts.isOrphaned, input.isOrphaned));
        if (input.isStale !== undefined)
          conditions.push(eq(platformAccounts.isStale, input.isStale));
        if (input.reviewDue) {
          const today = new Date().toISOString().slice(0, 10);
          conditions.push(
            and(
              isNotNull(platformAccounts.reviewDueDate),
              lte(platformAccounts.reviewDueDate, today),
            )!,
          );
        }

        return db.query.platformAccounts.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          with: {
            staffProfile: { with: { user: true, department: true } },
            externalContact: true,
          },
          orderBy: (t, { desc }) => [desc(t.createdAt)],
          limit: input.limit,
          offset: input.offset,
        });
      }),

    get: requireRole("access", "read")
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        const account = await db.query.platformAccounts.findFirst({
          where: eq(platformAccounts.id, input.id),
          with: {
            staffProfile: { with: { user: true, department: true } },
            externalContact: true,
            groupMemberships: {
              where: isNull(accountGroupMemberships.removedAt),
              with: { accessGroup: true },
            },
            reviews: {
              orderBy: (t, { desc }) => [desc(t.createdAt)],
              limit: 10,
              with: { reviewer: true },
            },
          },
        });
        if (!account) throw new ORPCError("NOT_FOUND");
        return account;
      }),

    getByStaff: requireRole("access", "read")
      .input(z.object({ staffProfileId: z.string() }))
      .handler(async ({ input }) => {
        return db.query.platformAccounts.findMany({
          where: eq(platformAccounts.staffProfileId, input.staffProfileId),
          orderBy: (t, { asc }) => [asc(t.platform)],
        });
      }),

    getByPlatform: requireRole("access", "read")
      .input(z.object({ platform: z.enum(PLATFORM_VALUES) }))
      .handler(async ({ input }) => {
        return db.query.platformAccounts.findMany({
          where: eq(platformAccounts.platform, input.platform),
          with: {
            staffProfile: { with: { user: true, department: true } },
            externalContact: true,
          },
        });
      }),

    getExpiring: requireRole("access", "read")
      .input(z.object({ withinDays: z.number().default(30) }))
      .handler(async ({ input }) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + input.withinDays);
        const cutoffStr = cutoff.toISOString().slice(0, 10);

        return db.query.platformAccounts.findMany({
          where: and(
            isNotNull(platformAccounts.expiresAt),
            lte(platformAccounts.expiresAt, cutoffStr),
            eq(platformAccounts.status, "active"),
          ),
          with: {
            staffProfile: { with: { user: true, department: true } },
            externalContact: true,
          },
        });
      }),

    getOrphaned: requireRole("access", "read").handler(async () => {
      return db.query.platformAccounts.findMany({
        where: eq(platformAccounts.isOrphaned, true),
        with: {
          staffProfile: { with: { user: true } },
          externalContact: true,
        },
      });
    }),

    getStale: requireRole("access", "read").handler(async () => {
      return db.query.platformAccounts.findMany({
        where: eq(platformAccounts.isStale, true),
        with: {
          staffProfile: { with: { user: true } },
          externalContact: true,
        },
      });
    }),

    getVpnEnabled: requireRole("access", "read").handler(async () => {
      return db.query.platformAccounts.findMany({
        where: eq(platformAccounts.vpnEnabled, true),
        with: {
          staffProfile: { with: { user: true, department: true } },
          externalContact: true,
        },
        orderBy: (t, { asc }) => [asc(t.vpnGroup)],
      });
    }),

    create: requireRole("access", "create")
      .input(
        z.object({
          // One of these two should be provided
          staffProfileId: z.string().optional(),
          externalContactId: z.string().optional(),
          platform: z.enum(PLATFORM_VALUES),
          accountIdentifier: z.string().min(1),
          displayName: z.string().optional(),
          email: z.string().email().optional(),
          affiliationType: z.enum(AFFILIATION_VALUES).default("ndma_internal"),
          authSource: z.enum(AUTH_SOURCE_VALUES).default("local"),
          privilegeLevel: z.string().optional(),
          status: z.enum(ACCOUNT_STATUS_VALUES).default("active"),
          syncMode: z.enum(SYNC_MODE_VALUES).default("manual"),
          externalAccountId: z.string().optional(),
          syncSourceSystem: z.string().optional(),
          provisionedAt: z.string().optional(),
          expiresAt: z.string().optional(),
          reviewDueDate: z.string().optional(),
          vpnEnabled: z.boolean().default(false),
          vpnGroup: z.string().optional(),
          vpnProfile: z.string().optional(),
          notes: z.string().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        if (!input.staffProfileId && !input.externalContactId) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Either staffProfileId or externalContactId is required",
          });
        }

        const [account] = await db
          .insert(platformAccounts)
          .values({
            ...input,
            provisionedAt: input.provisionedAt ?? null,
            expiresAt: input.expiresAt ?? null,
            reviewDueDate: input.reviewDueDate ?? null,
            notes: input.notes ?? null,
            createdByUserId: context.session.user.id,
          })
          .returning();

        if (!account) throw new ORPCError("INTERNAL_SERVER_ERROR");

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
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return account;
      }),

    update: requireRole("access", "update")
      .input(
        z.object({
          id: z.string(),
          displayName: z.string().optional(),
          email: z.string().email().optional(),
          affiliationType: z.enum(AFFILIATION_VALUES).optional(),
          authSource: z.enum(AUTH_SOURCE_VALUES).optional(),
          privilegeLevel: z.string().optional(),
          status: z.enum(ACCOUNT_STATUS_VALUES).optional(),
          syncMode: z.enum(SYNC_MODE_VALUES).optional(),
          expiresAt: z.string().optional(),
          reviewDueDate: z.string().optional(),
          lastVerifiedAt: z.string().optional(),
          vpnEnabled: z.boolean().optional(),
          vpnGroup: z.string().optional(),
          vpnProfile: z.string().optional(),
          isOrphaned: z.boolean().optional(),
          isStale: z.boolean().optional(),
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
          .set({ ...updates, updatedByUserId: context.session.user.id })
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
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return updated;
      }),

    disable: requireRole("access", "update")
      .input(z.object({ id: z.string(), reason: z.string().optional() }))
      .handler(async ({ input, context }) => {
        const before = await db.query.platformAccounts.findFirst({
          where: eq(platformAccounts.id, input.id),
        });
        if (!before) throw new ORPCError("NOT_FOUND");

        const [updated] = await db
          .update(platformAccounts)
          .set({
            status: "disabled",
            disabledAt: new Date(),
            updatedByUserId: context.session.user.id,
            notes: input.reason
              ? `${before.notes ? before.notes + "\n" : ""}Disabled: ${input.reason}`
              : before.notes,
          })
          .where(eq(platformAccounts.id, input.id))
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "access.account.disable",
          module: "access",
          resourceType: "platform_account",
          resourceId: input.id,
          beforeValue: before as Record<string, unknown>,
          afterValue: updated as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return updated;
      }),

    markReviewed: requireRole("access", "update")
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const today = new Date().toISOString().slice(0, 10);
        // Set next review date 90 days out
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + 90);
        const nextReviewStr = nextReview.toISOString().slice(0, 10);

        const [updated] = await db
          .update(platformAccounts)
          .set({
            lastReviewedAt: today,
            reviewDueDate: nextReviewStr,
            updatedByUserId: context.session.user.id,
          })
          .where(eq(platformAccounts.id, input.id))
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "access.account.mark_reviewed",
          module: "access",
          resourceType: "platform_account",
          resourceId: input.id,
          afterValue: { lastReviewedAt: today, reviewDueDate: nextReviewStr } as Record<
            string,
            unknown
          >,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return updated;
      }),
  },

  // ── External Contacts ───────────────────────────────────────────────────

  externalContacts: {
    list: requireRole("access", "read")
      .input(
        z.object({
          affiliationType: z.enum(AFFILIATION_VALUES).optional(),
          isActive: z.boolean().optional(),
        }),
      )
      .handler(async ({ input }) => {
        const conditions = [];
        if (input.affiliationType)
          conditions.push(eq(externalContacts.affiliationType, input.affiliationType));
        if (input.isActive !== undefined)
          conditions.push(eq(externalContacts.isActive, input.isActive));

        return db.query.externalContacts.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          with: {
            linkedStaffProfile: { with: { user: true } },
            platformAccounts: true,
          },
          orderBy: (t, { asc }) => [asc(t.name)],
        });
      }),

    get: requireRole("access", "read")
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        const contact = await db.query.externalContacts.findFirst({
          where: eq(externalContacts.id, input.id),
          with: {
            linkedStaffProfile: { with: { user: true } },
            platformAccounts: true,
          },
        });
        if (!contact) throw new ORPCError("NOT_FOUND");
        return contact;
      }),

    create: requireRole("access", "create")
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email().optional(),
          organization: z.string().optional(),
          phone: z.string().optional(),
          affiliationType: z.enum(AFFILIATION_VALUES).default("external_agency"),
          linkedStaffProfileId: z.string().optional(),
          notes: z.string().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const [contact] = await db
          .insert(externalContacts)
          .values({ ...input, createdByUserId: context.session.user.id })
          .returning();

        if (!contact) throw new ORPCError("INTERNAL_SERVER_ERROR");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "access.external_contact.create",
          module: "access",
          resourceType: "external_contact",
          resourceId: contact.id,
          afterValue: contact as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return contact;
      }),

    update: requireRole("access", "update")
      .input(
        z.object({
          id: z.string(),
          name: z.string().optional(),
          email: z.string().email().optional(),
          organization: z.string().optional(),
          phone: z.string().optional(),
          affiliationType: z.enum(AFFILIATION_VALUES).optional(),
          linkedStaffProfileId: z.string().optional(),
          isActive: z.boolean().optional(),
          notes: z.string().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const { id, ...updates } = input;
        const before = await db.query.externalContacts.findFirst({
          where: eq(externalContacts.id, id),
        });
        if (!before) throw new ORPCError("NOT_FOUND");

        const [updated] = await db
          .update(externalContacts)
          .set(updates)
          .where(eq(externalContacts.id, id))
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "access.external_contact.update",
          module: "access",
          resourceType: "external_contact",
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
  },

  // ── Access Groups ───────────────────────────────────────────────────────

  groups: {
    list: requireRole("access", "read")
      .input(
        z.object({
          platform: z.enum(PLATFORM_VALUES).optional(),
          groupType: z.enum(ACCESS_GROUP_TYPE_VALUES).optional(),
          isActive: z.boolean().optional(),
        }),
      )
      .handler(async ({ input }) => {
        const conditions = [];
        if (input.platform) conditions.push(eq(accessGroups.platform, input.platform));
        if (input.groupType) conditions.push(eq(accessGroups.groupType, input.groupType));
        if (input.isActive !== undefined)
          conditions.push(eq(accessGroups.isActive, input.isActive));

        return db.query.accessGroups.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          orderBy: (t, { asc }) => [asc(t.name)],
        });
      }),

    get: requireRole("access", "read")
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        const group = await db.query.accessGroups.findFirst({
          where: eq(accessGroups.id, input.id),
          with: {
            memberships: {
              where: isNull(accountGroupMemberships.removedAt),
              with: {
                platformAccount: {
                  with: {
                    staffProfile: { with: { user: true } },
                    externalContact: true,
                  },
                },
              },
            },
          },
        });
        if (!group) throw new ORPCError("NOT_FOUND");
        return group;
      }),

    create: requireRole("access", "create")
      .input(
        z.object({
          name: z.string().min(1),
          platform: z.enum(PLATFORM_VALUES),
          groupType: z.enum(ACCESS_GROUP_TYPE_VALUES),
          description: z.string().optional(),
          externalId: z.string().optional(),
          syncMode: z.enum(SYNC_MODE_VALUES).default("manual"),
        }),
      )
      .handler(async ({ input, context }) => {
        const [group] = await db.insert(accessGroups).values(input).returning();

        if (!group) throw new ORPCError("INTERNAL_SERVER_ERROR");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "access.group.create",
          module: "access",
          resourceType: "access_group",
          resourceId: group.id,
          afterValue: group as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return group;
      }),

    update: requireRole("access", "update")
      .input(
        z.object({
          id: z.string(),
          name: z.string().optional(),
          description: z.string().optional(),
          externalId: z.string().optional(),
          syncMode: z.enum(SYNC_MODE_VALUES).optional(),
          isActive: z.boolean().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const { id, ...updates } = input;
        const before = await db.query.accessGroups.findFirst({
          where: eq(accessGroups.id, id),
        });
        if (!before) throw new ORPCError("NOT_FOUND");

        const [updated] = await db
          .update(accessGroups)
          .set(updates)
          .where(eq(accessGroups.id, id))
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "access.group.update",
          module: "access",
          resourceType: "access_group",
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

    delete: requireRole("access", "delete")
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const group = await db.query.accessGroups.findFirst({
          where: eq(accessGroups.id, input.id),
        });
        if (!group) throw new ORPCError("NOT_FOUND");

        await db.delete(accessGroups).where(eq(accessGroups.id, input.id));

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "access.group.delete",
          module: "access",
          resourceType: "access_group",
          resourceId: input.id,
          beforeValue: group as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return { success: true };
      }),

    listMembers: requireRole("access", "read")
      .input(z.object({ groupId: z.string(), includeRemoved: z.boolean().default(false) }))
      .handler(async ({ input }) => {
        return db.query.accountGroupMemberships.findMany({
          where: and(
            eq(accountGroupMemberships.accessGroupId, input.groupId),
            input.includeRemoved ? undefined : isNull(accountGroupMemberships.removedAt),
          ),
          with: {
            platformAccount: {
              with: {
                staffProfile: { with: { user: true } },
                externalContact: true,
              },
            },
            addedBy: true,
          },
          orderBy: (t, { desc }) => [desc(t.addedAt)],
        });
      }),

    addMember: requireRole("access", "update")
      .input(
        z.object({
          groupId: z.string(),
          platformAccountId: z.string(),
        }),
      )
      .handler(async ({ input, context }) => {
        const [membership] = await db
          .insert(accountGroupMemberships)
          .values({
            accessGroupId: input.groupId,
            platformAccountId: input.platformAccountId,
            addedByUserId: context.session.user.id,
          })
          .onConflictDoUpdate({
            target: [
              accountGroupMemberships.platformAccountId,
              accountGroupMemberships.accessGroupId,
            ],
            // Re-add if previously removed
            set: { removedAt: null, addedByUserId: context.session.user.id },
          })
          .returning();

        if (!membership) throw new ORPCError("INTERNAL_SERVER_ERROR");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "access.group.add_member",
          module: "access",
          resourceType: "account_group_membership",
          resourceId: membership.id,
          afterValue: { groupId: input.groupId, platformAccountId: input.platformAccountId },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return membership;
      }),

    removeMember: requireRole("access", "update")
      .input(
        z.object({
          groupId: z.string(),
          platformAccountId: z.string(),
        }),
      )
      .handler(async ({ input, context }) => {
        const [updated] = await db
          .update(accountGroupMemberships)
          .set({ removedAt: new Date() })
          .where(
            and(
              eq(accountGroupMemberships.accessGroupId, input.groupId),
              eq(accountGroupMemberships.platformAccountId, input.platformAccountId),
              isNull(accountGroupMemberships.removedAt),
            ),
          )
          .returning();

        if (!updated) throw new ORPCError("NOT_FOUND");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "access.group.remove_member",
          module: "access",
          resourceType: "account_group_membership",
          resourceId: updated.id,
          afterValue: { groupId: input.groupId, platformAccountId: input.platformAccountId, removedAt: new Date() },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return updated;
      }),
  },

  // ── Access Reviews ──────────────────────────────────────────────────────

  reviews: {
    list: requireRole("access", "read")
      .input(
        z.object({
          status: z.enum(ACCESS_REVIEW_STATUS_VALUES).optional(),
          platformAccountId: z.string().optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        }),
      )
      .handler(async ({ input }) => {
        const conditions = [];
        if (input.status) conditions.push(eq(accessReviews.status, input.status));
        if (input.platformAccountId)
          conditions.push(eq(accessReviews.platformAccountId, input.platformAccountId));

        return db.query.accessReviews.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          with: {
            platformAccount: {
              with: {
                staffProfile: { with: { user: true } },
                externalContact: true,
              },
            },
            reviewer: true,
          },
          orderBy: (t, { desc }) => [desc(t.createdAt)],
          limit: input.limit,
          offset: input.offset,
        });
      }),

    getPending: requireRole("access", "read").handler(async () => {
      return db.query.accessReviews.findMany({
        where: eq(accessReviews.status, "pending"),
        with: {
          platformAccount: {
            with: {
              staffProfile: { with: { user: true } },
              externalContact: true,
            },
          },
          reviewer: true,
        },
        orderBy: (t, { asc }) => [asc(t.createdAt)],
      });
    }),

    getOverdue: requireRole("access", "read").handler(async () => {
      const today = new Date().toISOString().slice(0, 10);
      return db.query.accessReviews.findMany({
        where: and(
          eq(accessReviews.status, "pending"),
          isNotNull(accessReviews.nextReviewDate),
          lte(accessReviews.nextReviewDate, today),
        ),
        with: {
          platformAccount: {
            with: {
              staffProfile: { with: { user: true } },
              externalContact: true,
            },
          },
          reviewer: true,
        },
      });
    }),

    create: requireRole("access", "create")
      .input(
        z.object({
          platformAccountId: z.string(),
          reviewerId: z.string().optional(),
          nextReviewDate: z.string().optional(),
          notes: z.string().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const [review] = await db
          .insert(accessReviews)
          .values({
            ...input,
            reviewerId: input.reviewerId ?? context.session.user.id,
          })
          .returning();

        if (!review) throw new ORPCError("INTERNAL_SERVER_ERROR");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "access.review.create",
          module: "access",
          resourceType: "access_review",
          resourceId: review.id,
          afterValue: review as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return review;
      }),

    complete: requireRole("access", "update")
      .input(
        z.object({
          id: z.string(),
          status: z.enum(["approved", "revoked", "escalated"]),
          notes: z.string().optional(),
          nextReviewDate: z.string().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const before = await db.query.accessReviews.findFirst({
          where: eq(accessReviews.id, input.id),
        });
        if (!before) throw new ORPCError("NOT_FOUND");

        const [updated] = await db
          .update(accessReviews)
          .set({
            status: input.status,
            reviewedAt: new Date(),
            reviewerId: context.session.user.id,
            notes: input.notes ?? before.notes,
            nextReviewDate: input.nextReviewDate ?? before.nextReviewDate,
          })
          .where(eq(accessReviews.id, input.id))
          .returning();

        // If revoked, disable the account
        if (input.status === "revoked") {
          await db
            .update(platformAccounts)
            .set({ status: "disabled", disabledAt: new Date() })
            .where(eq(platformAccounts.id, before.platformAccountId));
        }

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "access.review.complete",
          module: "access",
          resourceType: "access_review",
          resourceId: input.id,
          beforeValue: before as Record<string, unknown>,
          afterValue: updated as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return updated;
      }),
  },

  // ── Platform Integrations ───────────────────────────────────────────────

  integrations: {
    list: requireRole("access", "read").handler(async () => {
      return db.query.platformIntegrations.findMany({
        with: {
          ownerStaff: { with: { user: true } },
          syncJobs: { limit: 1, orderBy: (t, { desc }) => [desc(t.createdAt)] },
        },
        orderBy: (t, { asc }) => [asc(t.platform)],
      });
    }),

    get: requireRole("access", "read")
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        const integration = await db.query.platformIntegrations.findFirst({
          where: eq(platformIntegrations.id, input.id),
          with: {
            ownerStaff: { with: { user: true } },
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

    create: requireRole("access", "create")
      .input(
        z.object({
          name: z.string().min(1),
          platform: z.enum(PLATFORM_VALUES),
          description: z.string().optional(),
          ownerStaffId: z.string().optional(),
          supportTeam: z.string().optional(),
          runbookUrl: z.string().url().optional(),
          documentationUrl: z.string().url().optional(),
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

        if (!integration) throw new ORPCError("INTERNAL_SERVER_ERROR");

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
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return integration;
      }),

    update: requireRole("access", "update")
      .input(
        z.object({
          id: z.string(),
          name: z.string().optional(),
          description: z.string().optional(),
          ownerStaffId: z.string().optional(),
          supportTeam: z.string().optional(),
          runbookUrl: z.string().url().optional(),
          documentationUrl: z.string().url().optional(),
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
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return updated;
      }),

    triggerSync: requireRole("access", "update")
      .input(z.object({ integrationId: z.string() }))
      .handler(async ({ input, context }) => {
        const integration = await db.query.platformIntegrations.findFirst({
          where: eq(platformIntegrations.id, input.integrationId),
        });
        if (!integration) throw new ORPCError("NOT_FOUND");
        if (!integration.syncEnabled)
          throw new ORPCError("BAD_REQUEST", {
            message: "Sync is not enabled for this integration",
          });

        const [job] = await db
          .insert(syncJobs)
          .values({
            integrationId: input.integrationId,
            triggeredBy: "manual",
            triggeredByUserId: context.session.user.id,
            status: "pending",
          })
          .returning();
        if (!job) throw new ORPCError("INTERNAL_SERVER_ERROR");

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
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        // Run the sync job in the background — don't await so the HTTP response
        // returns immediately while the sync progresses asynchronously.
        void runSyncJob(job.id).catch((err) => {
          console.error(`[sync] Job ${job.id} crashed:`, err);
        });

        return job;
      }),
  },

  // ── Sync Jobs ───────────────────────────────────────────────────────────

  syncJobs: {
    list: requireRole("access", "read")
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
    list: requireRole("access", "read")
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
              "disabled_staff_active_account",
              "expired_contractor",
              "missing_internally",
              "missing_externally",
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
        if (!input.resolved) conditions.push(isNull(reconciliationIssues.resolvedAt));

        return db.query.reconciliationIssues.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          with: {
            integration: true,
            platformAccount: {
              with: {
                staffProfile: { with: { user: true } },
                externalContact: true,
              },
            },
            staffProfile: { with: { user: true } },
          },
          orderBy: (t, { desc }) => [desc(t.createdAt)],
        });
      }),

    resolve: requireRole("access", "update")
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
          afterValue: {
            resolvedAt: new Date(),
            note: input.resolutionNote,
          },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return resolved;
      }),
  },

  // ── Service Owners ──────────────────────────────────────────────────────

  serviceOwners: {
    list: requireRole("access", "read")
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

    assign: requireRole("access", "update")
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
        if (!owner) throw new ORPCError("INTERNAL_SERVER_ERROR");

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
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return owner;
      }),

    remove: requireRole("access", "update")
      .input(z.object({ serviceId: z.string(), staffProfileId: z.string() }))
      .handler(async ({ input, context }) => {
        await db.delete(serviceOwners).where(
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
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return { success: true };
      }),

    getByService: requireRole("access", "read")
      .input(z.object({ serviceId: z.string() }))
      .handler(async ({ input }) => {
        return db.query.serviceOwners.findMany({
          where: eq(serviceOwners.serviceId, input.serviceId),
          with: { staffProfile: { with: { user: true } } },
        });
      }),
  },
};
