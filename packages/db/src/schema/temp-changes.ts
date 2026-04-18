import {
  boolean,
  date,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { user } from "./auth";
import { departments } from "./departments";
import { incidents, services } from "./incidents";
import { staffProfiles } from "./staff";
import { workItems } from "./work";

export const tempChangeStatusEnum = pgEnum("temp_change_status", [
  "planned",
  "implemented",
  "active",
  "overdue",
  "removed",
  "cancelled",
]);

export const tempChangeCategoryEnum = pgEnum("temp_change_category", [
  "public_ip_exposure",
  "temporary_service",
  "temporary_access",
  "temporary_change",
  "other",
]);

export const tempChangeRiskEnum = pgEnum("temp_change_risk", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const tempChangeOwnerTypeEnum = pgEnum("temp_change_owner_type", [
  "internal_staff",
  "external_contact",
  "department",
  "system",
]);

export const temporaryChanges = pgTable(
  "temporary_changes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    description: text("description"),
    justification: text("justification"),
    ownerId: text("owner_id").references(() => staffProfiles.id, {
      onDelete: "set null",
    }),
    serviceId: text("service_id").references(() => services.id, {
      onDelete: "set null",
    }),
    implementationDate: date("implementation_date"),
    removeByDate: date("remove_by_date"),
    actualRemovalDate: date("actual_removal_date"),
    status: tempChangeStatusEnum("status").notNull().default("planned"),
    rollbackPlan: text("rollback_plan"),
    followUpNotes: text("follow_up_notes"),
    // Scheduled date for a follow-up check (distinct from removal date)
    followUpDate: date("follow_up_date"),
    // Optional cross-link to a work item tracking this change
    linkedWorkItemId: text("linked_work_item_id").references(
      () => workItems.id,
      { onDelete: "set null" },
    ),
    approvedById: text("approved_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Extended categorization
    category: tempChangeCategoryEnum("category")
      .notNull()
      .default("temporary_change"),
    riskLevel: tempChangeRiskEnum("risk_level").notNull().default("medium"),
    environment: text("environment").default("production"), // production | test | dev
    systemName: text("system_name"),

    // Network/IP exposure details
    publicIp: text("public_ip"),
    internalIp: text("internal_ip"),
    port: text("port"),
    protocol: text("protocol"), // tcp | udp | both
    externalExposure: boolean("external_exposure").default(false).notNull(),

    // Owner model
    ownerType: tempChangeOwnerTypeEnum("owner_type").default("internal_staff"),
    externalAgencyName: text("external_agency_name"),
    externalAgencyType: text("external_agency_type"), // government|vendor|contractor|partner|other

    // Requester info
    requestedByType: text("requested_by_type").default("internal_staff"),
    requestedByExternal: text("requested_by_external"),
    requestedById: text("requested_by_id").references(() => staffProfiles.id, {
      onDelete: "set null",
    }),

    // Department linkage
    departmentId: text("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("temp_changes_status_idx").on(table.status),
    index("temp_changes_removeByDate_idx").on(table.removeByDate),
    index("temp_changes_ownerId_idx").on(table.ownerId),
    index("temp_changes_category_idx").on(table.category),
    index("temp_changes_riskLevel_idx").on(table.riskLevel),
  ],
);

// ── History log ───────────────────────────────────────────────────────────────

export const tempChangeHistory = pgTable("temp_change_history", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tempChangeId: text("temp_change_id")
    .notNull()
    .references(() => temporaryChanges.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // created | updated | status_changed | removed | overdue_flagged | extended
  performedByName: text("performed_by_name"),
  performedById: text("performed_by_id"),
  oldValues: jsonb("old_values").$type<Record<string, unknown>>(),
  newValues: jsonb("new_values").$type<Record<string, unknown>>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tempChangeHistoryRelations = relations(
  tempChangeHistory,
  ({ one }) => ({
    tempChange: one(temporaryChanges, {
      fields: [tempChangeHistory.tempChangeId],
      references: [temporaryChanges.id],
    }),
  }),
);

// ── Cross-links ───────────────────────────────────────────────────────────────

export const tempChangeLinks = pgTable("temp_change_links", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tempChangeId: text("temp_change_id")
    .notNull()
    .references(() => temporaryChanges.id, { onDelete: "cascade" }),
  workItemId: text("work_item_id").references(() => workItems.id, {
    onDelete: "cascade",
  }),
  incidentId: text("incident_id").references(() => incidents.id, {
    onDelete: "cascade",
  }),
  serviceId: text("service_id").references(() => services.id, {
    onDelete: "cascade",
  }),
  linkType: text("link_type").default("related"), // related | caused_by | resolves
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tempChangeLinksRelations = relations(
  tempChangeLinks,
  ({ one }) => ({
    tempChange: one(temporaryChanges, {
      fields: [tempChangeLinks.tempChangeId],
      references: [temporaryChanges.id],
    }),
  }),
);

// ── Relations ─────────────────────────────────────────────────────────────────

export const temporaryChangesRelations = relations(
  temporaryChanges,
  ({ one, many }) => ({
    owner: one(staffProfiles, {
      fields: [temporaryChanges.ownerId],
      references: [staffProfiles.id],
    }),
    service: one(services, {
      fields: [temporaryChanges.serviceId],
      references: [services.id],
    }),
    approvedBy: one(user, {
      fields: [temporaryChanges.approvedById],
      references: [user.id],
    }),
    createdBy: one(user, {
      fields: [temporaryChanges.createdById],
      references: [user.id],
      relationName: "tempChangeCreatedBy",
    }),
    history: many(tempChangeHistory),
    links: many(tempChangeLinks),
  }),
);


