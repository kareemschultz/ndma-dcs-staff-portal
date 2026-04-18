import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { user } from "./auth";
import { staffProfiles } from "./staff";

export const contractStatusEnum = pgEnum("contract_status", [
  "active",
  "expiring_soon",
  "expired",
  "renewed",
  "terminated",
]);

export const contractRenewalStatusEnum = pgEnum("contract_renewal_status", [
  "not_required",
  "pending",
  "requested",
  "approved",
  "issued",
  "completed",
  "declined",
]);

export const contracts = pgTable(
  "contracts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    // e.g. "permanent", "fixed_term", "contract", "secondment"
    contractType: text("contract_type").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    // Days before endDate to trigger expiry reminder
    renewalReminderDays: integer("renewal_reminder_days").notNull().default(60),
    status: contractStatusEnum("status").notNull().default("active"),
    renewalStatus: contractRenewalStatusEnum("renewal_status")
      .notNull()
      .default("not_required"),
    renewalLetterRequiredBy: date("renewal_letter_required_by"),
    renewalRequestedAt: timestamp("renewal_requested_at"),
    renewalRequestedById: text("renewal_requested_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    renewalCompletedAt: timestamp("renewal_completed_at"),
    documentUrl: text("document_url"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("contracts_staffProfileId_idx").on(table.staffProfileId),
    index("contracts_status_idx").on(table.status),
    index("contracts_endDate_idx").on(table.endDate),
  ],
);

export const contractsRelations = relations(contracts, ({ one }) => ({
  staffProfile: one(staffProfiles, {
    fields: [contracts.staffProfileId],
    references: [staffProfiles.id],
  }),
  renewalRequestedBy: one(user, {
    fields: [contracts.renewalRequestedById],
    references: [user.id],
  }),
}));
