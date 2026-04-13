import {
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { staffProfiles } from "./staff";

export const appraisalStatusEnum = pgEnum("appraisal_status", [
  "scheduled",
  "in_progress",
  "completed",
  "overdue",
]);

export const appraisals = pgTable(
  "appraisals",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    // The reviewer / line manager conducting the appraisal
    reviewerId: text("reviewer_id").references(() => staffProfiles.id, {
      onDelete: "set null",
    }),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    scheduledDate: date("scheduled_date"),
    completedDate: date("completed_date"),
    status: appraisalStatusEnum("status").notNull().default("scheduled"),
    // 1–5 rating
    overallRating: integer("overall_rating"),
    summary: text("summary"),
    objectives: jsonb("objectives").$type<
      { title: string; rating?: number; comments?: string }[]
    >(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("appraisals_staffProfileId_idx").on(table.staffProfileId),
    index("appraisals_status_idx").on(table.status),
    index("appraisals_scheduledDate_idx").on(table.scheduledDate),
  ],
);

export const appraisalsRelations = relations(appraisals, ({ one }) => ({
  staffProfile: one(staffProfiles, {
    fields: [appraisals.staffProfileId],
    references: [staffProfiles.id],
    relationName: "staffAppraisals",
  }),
  reviewer: one(staffProfiles, {
    fields: [appraisals.reviewerId],
    references: [staffProfiles.id],
    relationName: "reviewerAppraisals",
  }),
}));
