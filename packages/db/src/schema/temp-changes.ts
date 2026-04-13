import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { user } from "./auth";
import { services } from "./incidents";
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
    approvedById: text("approved_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    linkedWorkItemId: text("linked_work_item_id").references(
      () => workItems.id,
      { onDelete: "set null" },
    ),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("temp_changes_status_idx").on(table.status),
    index("temp_changes_removeByDate_idx").on(table.removeByDate),
    index("temp_changes_ownerId_idx").on(table.ownerId),
  ],
);

// ── Relations ─────────────────────────────────────────────────────────────────

export const temporaryChangesRelations = relations(
  temporaryChanges,
  ({ one }) => ({
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
  }),
);
