import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { staffProfiles } from "./staff";

export const complianceItemStatusEnum = pgEnum("compliance_item_status", [
  "current",
  "expiring_soon",
  "expired",
  "not_applicable",
]);

// ── Training Records ───────────────────────────────────────────────────────

export const trainingRecords = pgTable(
  "training_records",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    trainingName: text("training_name").notNull(),
    provider: text("provider"),
    completedDate: date("completed_date"),
    expiryDate: date("expiry_date"),
    certificateUrl: text("certificate_url"),
    status: complianceItemStatusEnum("status").notNull().default("current"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("training_records_staffProfileId_idx").on(table.staffProfileId),
    index("training_records_expiryDate_idx").on(table.expiryDate),
    index("training_records_status_idx").on(table.status),
  ],
);

// ── PPE Records ────────────────────────────────────────────────────────────

export const ppeRecords = pgTable(
  "ppe_records",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    itemName: text("item_name").notNull(),
    issuedDate: date("issued_date"),
    expiryDate: date("expiry_date"),
    size: text("size"),
    // good | worn | damaged | lost
    condition: text("condition").notNull().default("good"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("ppe_records_staffProfileId_idx").on(table.staffProfileId),
    index("ppe_records_expiryDate_idx").on(table.expiryDate),
  ],
);

// ── Policy Acknowledgements ────────────────────────────────────────────────

export const policyAcknowledgements = pgTable(
  "policy_acknowledgements",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    policyName: text("policy_name").notNull(),
    policyVersion: text("policy_version").notNull(),
    acknowledgedAt: timestamp("acknowledged_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("policy_acks_staffProfileId_idx").on(table.staffProfileId),
  ],
);

// ── Relations ─────────────────────────────────────────────────────────────────

export const trainingRecordsRelations = relations(
  trainingRecords,
  ({ one }) => ({
    staffProfile: one(staffProfiles, {
      fields: [trainingRecords.staffProfileId],
      references: [staffProfiles.id],
    }),
  }),
);

export const ppeRecordsRelations = relations(ppeRecords, ({ one }) => ({
  staffProfile: one(staffProfiles, {
    fields: [ppeRecords.staffProfileId],
    references: [staffProfiles.id],
  }),
}));

export const policyAcknowledgementsRelations = relations(
  policyAcknowledgements,
  ({ one }) => ({
    staffProfile: one(staffProfiles, {
      fields: [policyAcknowledgements.staffProfileId],
      references: [staffProfiles.id],
    }),
  }),
);
