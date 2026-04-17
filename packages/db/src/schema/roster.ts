import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { departments } from "./departments";
import { staffProfiles } from "./staff";
import { user } from "./auth";

export const rosterShiftTypeEnum = pgEnum("roster_shift_type", [
  "day",
  "swing",
  "night",
]);

export const rosterScheduleStatusEnum = pgEnum("roster_schedule_status", [
  "draft",
  "published",
  "archived",
]);

export const rosterSwapStatusEnum = pgEnum("roster_swap_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);

export const maintenanceAssignmentTypeEnum = pgEnum(
  "maintenance_assignment_type",
  ["cleaning_server_room", "routine_maintenance_dcs", "fire_detection_test"],
);

export const maintenanceAssignmentStatusEnum = pgEnum(
  "maintenance_assignment_status",
  ["draft", "scheduled", "completed", "cancelled"],
);

export const rosterSchedules = pgTable(
  "roster_schedules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    departmentId: text("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    monthKey: text("month_key").notNull(),
    status: rosterScheduleStatusEnum("status").notNull().default("draft"),
    notes: text("notes"),
    publishedAt: timestamp("published_at"),
    publishedById: text("published_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("roster_schedules_monthKey_unique").on(table.monthKey),
    index("roster_schedules_departmentId_idx").on(table.departmentId),
    index("roster_schedules_status_idx").on(table.status),
  ],
);

export const rosterAssignments = pgTable(
  "roster_assignments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    scheduleId: text("schedule_id")
      .notNull()
      .references(() => rosterSchedules.id, { onDelete: "cascade" }),
    shiftDate: date("shift_date").notNull(),
    shiftType: rosterShiftTypeEnum("shift_type").notNull(),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    notes: text("notes"),
    acknowledgedAt: timestamp("acknowledged_at"),
    acknowledgedById: text("acknowledged_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("roster_assignments_schedule_date_type_unique").on(
      table.scheduleId,
      table.shiftDate,
      table.shiftType,
    ),
    index("roster_assignments_scheduleId_idx").on(table.scheduleId),
    index("roster_assignments_staffProfileId_idx").on(table.staffProfileId),
    index("roster_assignments_shiftDate_idx").on(table.shiftDate),
  ],
);

export const rosterSwapRequests = pgTable(
  "roster_swap_requests",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => rosterAssignments.id, { onDelete: "cascade" }),
    requesterId: text("requester_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    targetStaffProfileId: text("target_staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    reason: text("reason"),
    status: rosterSwapStatusEnum("status").notNull().default("pending"),
    reviewedById: text("reviewed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at"),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("roster_swap_requests_assignmentId_idx").on(table.assignmentId),
    index("roster_swap_requests_requesterId_idx").on(table.requesterId),
    index("roster_swap_requests_status_idx").on(table.status),
  ],
);

export const maintenanceAssignments = pgTable(
  "maintenance_assignments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    departmentId: text("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    year: integer("year").notNull(),
    quarter: text("quarter").notNull(),
    maintenanceType: maintenanceAssignmentTypeEnum("maintenance_type").notNull(),
    staffProfileId: text("staff_profile_id").references(() => staffProfiles.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    status: maintenanceAssignmentStatusEnum("status").notNull().default("draft"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("maintenance_assignments_departmentId_idx").on(table.departmentId),
    index("maintenance_assignments_year_idx").on(table.year),
    index("maintenance_assignments_quarter_idx").on(table.quarter),
    index("maintenance_assignments_type_idx").on(table.maintenanceType),
  ],
);

export const rosterSchedulesRelations = relations(rosterSchedules, ({ many, one }) => ({
  department: one(departments, {
    fields: [rosterSchedules.departmentId],
    references: [departments.id],
  }),
  publishedBy: one(user, {
    fields: [rosterSchedules.publishedById],
    references: [user.id],
    relationName: "rosterSchedulePublishedBy",
  }),
  assignments: many(rosterAssignments),
}));

export const rosterAssignmentsRelations = relations(
  rosterAssignments,
  ({ one, many }) => ({
    schedule: one(rosterSchedules, {
      fields: [rosterAssignments.scheduleId],
      references: [rosterSchedules.id],
    }),
    staffProfile: one(staffProfiles, {
      fields: [rosterAssignments.staffProfileId],
      references: [staffProfiles.id],
    }),
    acknowledgedBy: one(user, {
      fields: [rosterAssignments.acknowledgedById],
      references: [user.id],
      relationName: "rosterAssignmentAcknowledgedBy",
    }),
    swaps: many(rosterSwapRequests),
  }),
);

export const rosterSwapRequestsRelations = relations(rosterSwapRequests, ({ one }) => ({
  assignment: one(rosterAssignments, {
    fields: [rosterSwapRequests.assignmentId],
    references: [rosterAssignments.id],
  }),
  requester: one(staffProfiles, {
    fields: [rosterSwapRequests.requesterId],
    references: [staffProfiles.id],
  }),
  targetStaffProfile: one(staffProfiles, {
    fields: [rosterSwapRequests.targetStaffProfileId],
    references: [staffProfiles.id],
  }),
  reviewedBy: one(user, {
    fields: [rosterSwapRequests.reviewedById],
    references: [user.id],
    relationName: "rosterSwapReviewedBy",
  }),
}));

export const maintenanceAssignmentsRelations = relations(maintenanceAssignments, ({ one }) => ({
  department: one(departments, {
    fields: [maintenanceAssignments.departmentId],
    references: [departments.id],
  }),
  staffProfile: one(staffProfiles, {
    fields: [maintenanceAssignments.staffProfileId],
    references: [staffProfiles.id],
  }),
}));
