import { relations } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { incidents } from "./incidents";
import { staffProfiles } from "./staff";
import { user } from "./auth";

export const calloutTypeEnum = pgEnum("callout_type", [
  "phone",
  "sms",
  "whatsapp",
  "email",
  "manual",
]);

export const calloutStatusEnum = pgEnum("callout_status", [
  "logged",
  "reviewed",
  "closed",
]);

export const callouts = pgTable(
  "callouts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    relatedIncidentId: text("related_incident_id").references(() => incidents.id, {
      onDelete: "set null",
    }),
    calloutAt: timestamp("callout_at").notNull(),
    calloutType: calloutTypeEnum("callout_type").notNull().default("manual"),
    reason: text("reason").notNull(),
    outcome: text("outcome"),
    status: calloutStatusEnum("status").notNull().default("logged"),
    reviewedById: text("reviewed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("callouts_staffProfileId_idx").on(table.staffProfileId),
    index("callouts_relatedIncidentId_idx").on(table.relatedIncidentId),
    index("callouts_status_idx").on(table.status),
    index("callouts_calloutAt_idx").on(table.calloutAt),
  ],
);

export const calloutsRelations = relations(callouts, ({ one }) => ({
  staffProfile: one(staffProfiles, {
    fields: [callouts.staffProfileId],
    references: [staffProfiles.id],
  }),
  relatedIncident: one(incidents, {
    fields: [callouts.relatedIncidentId],
    references: [incidents.id],
  }),
  reviewedBy: one(user, {
    fields: [callouts.reviewedById],
    references: [user.id],
    relationName: "calloutReviewedBy",
  }),
}));
