import { relations } from "drizzle-orm";
import {
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { incidents } from "./incidents";
import { staffProfiles } from "./staff";
import { user } from "./auth";

export const timesheetStatusEnum = pgEnum("timesheet_status", [
  "draft",
  "submitted",
  "approved",
  "rejected",
  "closed",
]);

export const timesheets = pgTable(
  "timesheets",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    totalHours: numeric("total_hours", { precision: 8, scale: 2 })
      .notNull()
      .default("0"),
    status: timesheetStatusEnum("status").notNull().default("draft"),
    submittedAt: timestamp("submitted_at"),
    approvedAt: timestamp("approved_at"),
    reviewedById: text("reviewed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewNotes: text("review_notes"),
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
    unique("timesheets_staff_period_unique").on(
      table.staffProfileId,
      table.periodStart,
      table.periodEnd,
    ),
    index("timesheets_staffProfileId_idx").on(table.staffProfileId),
    index("timesheets_status_idx").on(table.status),
    index("timesheets_periodStart_idx").on(table.periodStart),
  ],
);

export const timesheetEntries = pgTable(
  "timesheet_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    timesheetId: text("timesheet_id")
      .notNull()
      .references(() => timesheets.id, { onDelete: "cascade" }),
    workDate: date("work_date").notNull(),
    hours: numeric("hours", { precision: 8, scale: 2 }).notNull(),
    category: text("category").notNull(),
    description: text("description"),
    relatedIncidentId: text("related_incident_id").references(() => incidents.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("timesheet_entries_timesheetId_idx").on(table.timesheetId),
    index("timesheet_entries_workDate_idx").on(table.workDate),
  ],
);

export const timesheetsRelations = relations(timesheets, ({ one, many }) => ({
  staffProfile: one(staffProfiles, {
    fields: [timesheets.staffProfileId],
    references: [staffProfiles.id],
  }),
  reviewedBy: one(user, {
    fields: [timesheets.reviewedById],
    references: [user.id],
    relationName: "timesheetReviewedBy",
  }),
  createdBy: one(user, {
    fields: [timesheets.createdById],
    references: [user.id],
    relationName: "timesheetCreatedBy",
  }),
  entries: many(timesheetEntries),
}));

export const timesheetEntriesRelations = relations(timesheetEntries, ({ one }) => ({
  timesheet: one(timesheets, {
    fields: [timesheetEntries.timesheetId],
    references: [timesheets.id],
  }),
  relatedIncident: one(incidents, {
    fields: [timesheetEntries.relatedIncidentId],
    references: [incidents.id],
  }),
}));
