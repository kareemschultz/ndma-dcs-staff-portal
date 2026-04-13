import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { services } from "./incidents";
import { staffProfiles } from "./staff";

// ── Enums ─────────────────────────────────────────────────────────────────

export const platformTypeEnum = pgEnum("platform_type", [
  "vpn",
  "fortigate",
  "uportal",
  "biometric",
  "ad",
  "other",
]);

export const accountStatusEnum = pgEnum("account_status", [
  "active",
  "suspended",
  "disabled",
  "pending_creation",
]);

// ── Platform Accounts ─────────────────────────────────────────────────────
// Cybersecurity compliance — auditable record of who has access to what

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
    // Username, badge number, AD account name, etc.
    accountIdentifier: text("account_identifier").notNull(),
    status: accountStatusEnum("status").notNull().default("active"),
    provisionedAt: date("provisioned_at"),
    expiresAt: date("expires_at"),
    // Date of last formal access review — for compliance audit trail
    lastReviewedAt: date("last_reviewed_at"),
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
