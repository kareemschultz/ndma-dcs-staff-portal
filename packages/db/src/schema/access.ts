import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { user } from "./auth";
import { services } from "./incidents";
import { staffProfiles } from "./staff";

// ── Enums ─────────────────────────────────────────────────────────────────

export const platformTypeEnum = pgEnum("platform_type", [
  "vpn",
  "fortigate",
  "uportal",
  "biometric",
  "ad",
  "ipam",
  "radius",
  "other",
]);

export const accountStatusEnum = pgEnum("account_status", [
  "active",
  "suspended",
  "disabled",
  "pending_creation",
]);

/**
 * How the account record authenticates to the platform.
 * Different from platform_type — one platform can support multiple auth sources.
 */
export const authSourceEnum = pgEnum("auth_source", [
  "local",
  "active_directory",
  "ldap",
  "radius",
  "saml",
  "oauth_oidc",
  "service_account",
  "api_only",
]);

/** Whether the record is manually managed, synced from an external API, or both. */
export const syncModeEnum = pgEnum("sync_mode", ["manual", "synced", "hybrid"]);

export const syncDirectionEnum = pgEnum("sync_direction", [
  "inbound",
  "outbound",
  "bidirectional",
]);

export const integrationStatusEnum = pgEnum("integration_status", [
  "active",
  "inactive",
  "error",
  "pending",
]);

export const syncJobStatusEnum = pgEnum("sync_job_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "partial",
]);

export const reconciliationIssueTypeEnum = pgEnum("reconciliation_issue_type", [
  "orphaned_account",
  "stale_account",
  "no_staff_link",
  "username_mismatch",
  "duplicate",
]);

// ── Platform Accounts ─────────────────────────────────────────────────────
// Cybersecurity compliance — auditable record of who has access to what.
// Supports both manually-entered records and records synced from external APIs.

export const platformAccounts = pgTable(
  "platform_accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    platform: platformTypeEnum("platform").notNull(),

    // The login name / badge number / AD sAMAccountName etc.
    accountIdentifier: text("account_identifier").notNull(),
    // Friendly display name (e.g. Full Name in AD)
    displayName: text("display_name"),

    // How this user authenticates to the platform
    authSource: authSourceEnum("auth_source").notNull().default("local"),

    // E.g. "admin", "standard", "read_only" — free text, platform-specific
    privilegeLevel: text("privilege_level"),

    status: accountStatusEnum("status").notNull().default("active"),

    // Whether this record is managed manually or via API sync
    syncMode: syncModeEnum("sync_mode").notNull().default("manual"),

    // External system identifier (e.g. IPAM user ID, AD ObjectGUID)
    externalAccountId: text("external_account_id"),
    // Which external system owns the authoritative data (e.g. "ipam", "ad")
    syncSourceSystem: text("sync_source_system"),
    // Last time external API wrote to this record
    lastSyncedAt: timestamp("last_synced_at"),

    provisionedAt: date("provisioned_at"),
    expiresAt: date("expires_at"),
    // Date of last formal access review — for compliance audit trail
    lastReviewedAt: date("last_reviewed_at"),
    // When the account was last manually verified against the platform
    lastVerifiedAt: date("last_verified_at"),

    // Who created this record (for manually-entered records)
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),

    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("platform_accounts_unique").on(
      table.staffProfileId,
      table.platform,
      table.accountIdentifier,
    ),
    index("platform_accounts_staffProfileId_idx").on(table.staffProfileId),
    index("platform_accounts_platform_idx").on(table.platform),
    index("platform_accounts_status_idx").on(table.status),
    index("platform_accounts_syncMode_idx").on(table.syncMode),
    index("platform_accounts_externalAccountId_idx").on(table.externalAccountId),
  ],
);

// ── Platform Integrations ─────────────────────────────────────────────────
// Per-platform connector configuration.
// Tracks which platforms have API sync enabled and how they're configured.

export const platformIntegrations = pgTable(
  "platform_integrations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // Human-readable name e.g. "IPAM Production"
    name: text("name").notNull(),
    platform: platformTypeEnum("platform").notNull(),
    description: text("description"),

    hasApi: boolean("has_api").notNull().default(false),
    syncEnabled: boolean("sync_enabled").notNull().default(false),
    syncDirection: syncDirectionEnum("sync_direction").notNull().default("inbound"),

    // How often to auto-sync (minutes). null = manual only.
    syncFrequencyMinutes: integer("sync_frequency_minutes"),

    // Which system owns the authoritative record for conflicts
    authoritativeSource: text("authoritative_source").default("external"),
    // Whether admins can still edit records synced from this integration
    manualFallbackAllowed: boolean("manual_fallback_allowed").notNull().default(true),

    // Base URL of the external API
    apiBaseUrl: text("api_base_url"),

    // JSON config for credentials/settings — store secrets encrypted at app layer
    config: jsonb("config"),

    status: integrationStatusEnum("status").notNull().default("pending"),
    lastSyncAt: timestamp("last_sync_at"),
    lastSyncError: text("last_sync_error"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("platform_integrations_platform_idx").on(table.platform),
    index("platform_integrations_status_idx").on(table.status),
  ],
);

// ── Sync Jobs ─────────────────────────────────────────────────────────────
// One row per sync run — scheduled or manually triggered.

export const syncJobs = pgTable(
  "sync_jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    integrationId: text("integration_id")
      .notNull()
      .references(() => platformIntegrations.id, { onDelete: "cascade" }),

    // "scheduled" | "manual"
    triggeredBy: text("triggered_by").notNull().default("manual"),
    triggeredByUserId: text("triggered_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),

    status: syncJobStatusEnum("status").notNull().default("pending"),

    recordsProcessed: integer("records_processed").default(0),
    recordsCreated: integer("records_created").default(0),
    recordsUpdated: integer("records_updated").default(0),
    recordsSkipped: integer("records_skipped").default(0),
    // Array of { externalId, field, message } error objects
    errors: jsonb("errors"),

    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("sync_jobs_integrationId_idx").on(table.integrationId),
    index("sync_jobs_status_idx").on(table.status),
    index("sync_jobs_createdAt_idx").on(table.createdAt),
  ],
);

// ── Reconciliation Issues ─────────────────────────────────────────────────
// Discrepancies surfaced during sync — orphaned accounts, mismatches, etc.

export const reconciliationIssues = pgTable(
  "reconciliation_issues",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    syncJobId: text("sync_job_id").references(() => syncJobs.id, {
      onDelete: "cascade",
    }),
    integrationId: text("integration_id")
      .notNull()
      .references(() => platformIntegrations.id, { onDelete: "cascade" }),

    issueType: reconciliationIssueTypeEnum("issue_type").notNull(),

    // The account in question (may be null if fully orphaned)
    platformAccountId: text("platform_account_id").references(
      () => platformAccounts.id,
      { onDelete: "set null" },
    ),
    // External identifier for accounts not yet linked
    externalAccountId: text("external_account_id"),
    // Staff member involved (if linkable)
    staffProfileId: text("staff_profile_id").references(() => staffProfiles.id, {
      onDelete: "set null",
    }),

    details: text("details"),

    resolvedAt: timestamp("resolved_at"),
    resolvedByUserId: text("resolved_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    resolutionNote: text("resolution_note"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("reconciliation_issues_integrationId_idx").on(table.integrationId),
    index("reconciliation_issues_issueType_idx").on(table.issueType),
    index("reconciliation_issues_resolvedAt_idx").on(table.resolvedAt),
  ],
);

// ── Service Owners ─────────────────────────────────────────────────────────

export const serviceOwners = pgTable(
  "service_owners",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    serviceId: text("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    // owner | backup | contributor
    role: text("role").notNull().default("owner"),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("service_owners_unique").on(table.serviceId, table.staffProfileId),
  ],
);

// ── Relations ─────────────────────────────────────────────────────────────────

export const platformAccountsRelations = relations(
  platformAccounts,
  ({ one }) => ({
    staffProfile: one(staffProfiles, {
      fields: [platformAccounts.staffProfileId],
      references: [staffProfiles.id],
    }),
    createdBy: one(user, {
      fields: [platformAccounts.createdByUserId],
      references: [user.id],
    }),
  }),
);

export const platformIntegrationsRelations = relations(
  platformIntegrations,
  ({ many }) => ({
    syncJobs: many(syncJobs),
    reconciliationIssues: many(reconciliationIssues),
  }),
);

export const syncJobsRelations = relations(syncJobs, ({ one, many }) => ({
  integration: one(platformIntegrations, {
    fields: [syncJobs.integrationId],
    references: [platformIntegrations.id],
  }),
  triggeredByUser: one(user, {
    fields: [syncJobs.triggeredByUserId],
    references: [user.id],
  }),
  reconciliationIssues: many(reconciliationIssues),
}));

export const reconciliationIssuesRelations = relations(
  reconciliationIssues,
  ({ one }) => ({
    syncJob: one(syncJobs, {
      fields: [reconciliationIssues.syncJobId],
      references: [syncJobs.id],
    }),
    integration: one(platformIntegrations, {
      fields: [reconciliationIssues.integrationId],
      references: [platformIntegrations.id],
    }),
    platformAccount: one(platformAccounts, {
      fields: [reconciliationIssues.platformAccountId],
      references: [platformAccounts.id],
    }),
    staffProfile: one(staffProfiles, {
      fields: [reconciliationIssues.staffProfileId],
      references: [staffProfiles.id],
    }),
    resolvedBy: one(user, {
      fields: [reconciliationIssues.resolvedByUserId],
      references: [user.id],
    }),
  }),
);

export const serviceOwnersRelations = relations(serviceOwners, ({ one }) => ({
  service: one(services, {
    fields: [serviceOwners.serviceId],
    references: [services.id],
  }),
  staffProfile: one(staffProfiles, {
    fields: [serviceOwners.staffProfileId],
    references: [staffProfiles.id],
  }),
}));
