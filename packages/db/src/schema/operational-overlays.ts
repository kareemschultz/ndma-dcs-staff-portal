/**
 * Operational Overlays — quarterly recurring duties (server room cleaning,
 * routine maintenance, etc.) that sit alongside but separate from on-call rota.
 */
import { relations } from "drizzle-orm";
import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { staffProfiles } from "./staff";

// ── Enums ──────────────────────────────────────────────────────────────────
export const overlayTaskStatusEnum = pgEnum("overlay_task_status", [
  "pending",
  "in_progress",
  "completed",
  "overdue",
]);

// ── overlay_types ──────────────────────────────────────────────────────────
// Defines the named categories of recurring operational duties.
export const overlayTypes = pgTable("overlay_types", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(), // e.g. "Cleaning Server Room"
  description: text("description"),
  category: text("category"), // e.g. "facilities", "maintenance", "compliance"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ── overlay_schedules ──────────────────────────────────────────────────────
// One row per overlay-type per quarter (Q1 2026, Q2 2026, ...).
export const overlaySchedules = pgTable(
  "overlay_schedules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    overlayTypeId: text("overlay_type_id")
      .notNull()
      .references(() => overlayTypes.id),
    quarter: text("quarter").notNull(), // "Q1" | "Q2" | "Q3" | "Q4"
    year: text("year").notNull(), // "2026"
    startDate: date("start_date").notNull(), // first day of the quarter
    endDate: date("end_date").notNull(), // last day of the quarter
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("overlay_schedules_typeId_idx").on(table.overlayTypeId),
    index("overlay_schedules_quarter_year_idx").on(table.quarter, table.year),
  ],
);

// ── overlay_assignments ────────────────────────────────────────────────────
// Who is responsible for a given overlay schedule.
// staffProfileId is nullable to support external entities (NOC, Asif, etc.).
export const overlayAssignments = pgTable(
  "overlay_assignments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    overlayScheduleId: text("overlay_schedule_id")
      .notNull()
      .references(() => overlaySchedules.id, { onDelete: "cascade" }),
    staffProfileId: text("staff_profile_id").references(() => staffProfiles.id), // nullable
    externalLabel: text("external_label"), // "NOC", "Asif", "Core" etc.
    roleDescription: text("role_description"), // e.g. "Test Fire Detection System"
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("overlay_assignments_scheduleId_idx").on(table.overlayScheduleId),
    index("overlay_assignments_staffId_idx").on(table.staffProfileId),
  ],
);

// ── overlay_tasks ──────────────────────────────────────────────────────────
// Granular tasks under an overlay schedule (e.g. "Inspect cooling airflow").
export const overlayTasks = pgTable(
  "overlay_tasks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    overlayScheduleId: text("overlay_schedule_id")
      .notNull()
      .references(() => overlaySchedules.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    dueDate: date("due_date"),
    assignedToId: text("assigned_to_id").references(() => staffProfiles.id),
    assignedToExternal: text("assigned_to_external"), // for NOC, Asif, etc.
    status: overlayTaskStatusEnum("status").default("pending").notNull(),
    completedAt: timestamp("completed_at"),
    completedById: text("completed_by_id").references(() => user.id),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("overlay_tasks_scheduleId_idx").on(table.overlayScheduleId),
    index("overlay_tasks_status_idx").on(table.status),
    index("overlay_tasks_dueDate_idx").on(table.dueDate),
  ],
);

// ── Relations ──────────────────────────────────────────────────────────────
export const overlayTypeRelations = relations(overlayTypes, ({ many }) => ({
  schedules: many(overlaySchedules),
}));

export const overlayScheduleRelations = relations(
  overlaySchedules,
  ({ one, many }) => ({
    overlayType: one(overlayTypes, {
      fields: [overlaySchedules.overlayTypeId],
      references: [overlayTypes.id],
    }),
    assignments: many(overlayAssignments),
    tasks: many(overlayTasks),
  }),
);

export const overlayAssignmentRelations = relations(
  overlayAssignments,
  ({ one }) => ({
    overlaySchedule: one(overlaySchedules, {
      fields: [overlayAssignments.overlayScheduleId],
      references: [overlaySchedules.id],
    }),
    staffProfile: one(staffProfiles, {
      fields: [overlayAssignments.staffProfileId],
      references: [staffProfiles.id],
    }),
  }),
);

export const overlayTaskRelations = relations(overlayTasks, ({ one }) => ({
  overlaySchedule: one(overlaySchedules, {
    fields: [overlayTasks.overlayScheduleId],
    references: [overlaySchedules.id],
  }),
  assignedTo: one(staffProfiles, {
    fields: [overlayTasks.assignedToId],
    references: [staffProfiles.id],
  }),
  completedBy: one(user, {
    fields: [overlayTasks.completedById],
    references: [user.id],
  }),
}));
