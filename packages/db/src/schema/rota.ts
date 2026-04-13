import { relations } from "drizzle-orm";
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

import { user } from "./auth";
import { staffProfiles } from "./staff";

// ── Enums ──────────────────────────────────────────────────────────────────
export const onCallRoleEnum = pgEnum("on_call_role", [
  "lead_engineer", // Primary escalation contact
  "asn_support", // ASN team on-call
  "core_support", // Core/Routing team on-call
  "enterprise_support", // Enterprise team on-call
]);

export const scheduleStatusEnum = pgEnum("schedule_status", [
  "draft", // Being built, not visible to staff
  "published", // Active, staff notified
  "archived", // Past week
]);

export const swapStatusEnum = pgEnum("swap_status", [
  "pending", // Awaiting manager decision
  "approved", // Manager approved, rota updated
  "rejected", // Manager rejected
  "cancelled", // Requester cancelled
]);

export const conflictTypeEnum = pgEnum("conflict_type", [
  "approved_leave",
  "sick_leave",
  "training",
  "contract_expired",
  "manually_unavailable",
  "duplicate_assignment",
  "missing_role",
]);

// ── on_call_schedules ──────────────────────────────────────────────────────
// One row per week. week_start is always a Sunday (DCS uses Sun–Sat weeks).
export const onCallSchedules = pgTable(
  "on_call_schedules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    weekStart: date("week_start").notNull().unique(), // ISO date, always Sunday
    weekEnd: date("week_end").notNull(), // Always Saturday
    status: scheduleStatusEnum("status").default("draft").notNull(),
    publishedAt: timestamp("published_at"),
    publishedById: text("published_by_id").references(() => user.id),
    notes: text("notes"),
    hasConflicts: boolean("has_conflicts").default(false).notNull(),
    isLegacyImport: boolean("is_legacy_import").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("schedules_weekStart_idx").on(table.weekStart),
    index("schedules_status_idx").on(table.status),
  ],
);

// ── on_call_assignments ────────────────────────────────────────────────────
// One row per role per week. Max 4 rows per schedule.
export const onCallAssignments = pgTable(
  "on_call_assignments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    scheduleId: text("schedule_id")
      .notNull()
      .references(() => onCallSchedules.id, { onDelete: "cascade" }),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id),
    role: onCallRoleEnum("role").notNull(),
    // Conflict detection results — stored as JSON array of conflict objects
    conflictFlags: jsonb("conflict_flags")
      .$type<
        {
          type: string;
          message: string;
          severity: "warning" | "blocker";
        }[]
      >()
      .default([]),
    isConfirmed: boolean("is_confirmed").default(false).notNull(),
    notifiedAt: timestamp("notified_at"),
    // Acknowledgement — staff member confirms they received the assignment
    acknowledgedAt: timestamp("acknowledged_at"),
    acknowledgedById: text("acknowledged_by_id").references(() => staffProfiles.id),
    // Legacy import flag — marks assignments imported from the legacy spreadsheet
    isLegacyImport: boolean("is_legacy_import").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("assignments_scheduleId_idx").on(table.scheduleId),
    index("assignments_staffId_idx").on(table.staffProfileId),
  ],
);

// ── on_call_swaps ──────────────────────────────────────────────────────────
export const onCallSwaps = pgTable(
  "on_call_swaps",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => onCallAssignments.id, { onDelete: "cascade" }),
    requesterId: text("requester_id")
      .notNull()
      .references(() => staffProfiles.id),
    targetId: text("target_id")
      .notNull()
      .references(() => staffProfiles.id),
    reason: text("reason"),
    status: swapStatusEnum("status").default("pending").notNull(),
    reviewedById: text("reviewed_by_id").references(() => user.id),
    reviewedAt: timestamp("reviewed_at"),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("swaps_assignmentId_idx").on(table.assignmentId),
    index("swaps_requesterId_idx").on(table.requesterId),
    index("swaps_status_idx").on(table.status),
  ],
);

// ── assignment_history ─────────────────────────────────────────────────────
// Immutable audit log. One row per change event.
export const assignmentHistory = pgTable(
  "assignment_history",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    scheduleId: text("schedule_id")
      .notNull()
      .references(() => onCallSchedules.id),
    assignmentId: text("assignment_id").references(() => onCallAssignments.id),
    staffProfileId: text("staff_profile_id").references(
      () => staffProfiles.id,
    ),
    role: onCallRoleEnum("role"),
    action: text("action").notNull(), // "assigned" | "removed" | "swapped" | "published"
    performedById: text("performed_by_id").references(() => user.id),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("history_scheduleId_idx").on(table.scheduleId),
    index("history_staffId_idx").on(table.staffProfileId),
  ],
);

// ── Relations ──────────────────────────────────────────────────────────────
export const onCallScheduleRelations = relations(
  onCallSchedules,
  ({ many, one }) => ({
    assignments: many(onCallAssignments),
    publishedBy: one(user, {
      fields: [onCallSchedules.publishedById],
      references: [user.id],
    }),
  }),
);

export const onCallAssignmentRelations = relations(
  onCallAssignments,
  ({ one, many }) => ({
    schedule: one(onCallSchedules, {
      fields: [onCallAssignments.scheduleId],
      references: [onCallSchedules.id],
    }),
    staffProfile: one(staffProfiles, {
      fields: [onCallAssignments.staffProfileId],
      references: [staffProfiles.id],
    }),
    acknowledgedBy: one(staffProfiles, {
      fields: [onCallAssignments.acknowledgedById],
      references: [staffProfiles.id],
      relationName: "acknowledgedAssignments",
    }),
    swaps: many(onCallSwaps),
  }),
);

export const onCallSwapRelations = relations(onCallSwaps, ({ one }) => ({
  assignment: one(onCallAssignments, {
    fields: [onCallSwaps.assignmentId],
    references: [onCallAssignments.id],
  }),
  requester: one(staffProfiles, {
    fields: [onCallSwaps.requesterId],
    references: [staffProfiles.id],
  }),
  target: one(staffProfiles, {
    fields: [onCallSwaps.targetId],
    references: [staffProfiles.id],
  }),
  reviewedBy: one(user, {
    fields: [onCallSwaps.reviewedById],
    references: [user.id],
  }),
}));

export const assignmentHistoryRelations = relations(
  assignmentHistory,
  ({ one }) => ({
    schedule: one(onCallSchedules, {
      fields: [assignmentHistory.scheduleId],
      references: [onCallSchedules.id],
    }),
    assignment: one(onCallAssignments, {
      fields: [assignmentHistory.assignmentId],
      references: [onCallAssignments.id],
    }),
    staffProfile: one(staffProfiles, {
      fields: [assignmentHistory.staffProfileId],
      references: [staffProfiles.id],
    }),
    performedBy: one(user, {
      fields: [assignmentHistory.performedById],
      references: [user.id],
    }),
  }),
);

// ── rota_import_warnings ───────────────────────────────────────────────────
// Tracks ambiguous or multi-name legacy spreadsheet entries that need review.
export const rotaImportWarnings = pgTable(
  "rota_import_warnings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    scheduleId: text("schedule_id").references(() => onCallSchedules.id),
    weekStart: date("week_start").notNull(),
    weekEnd: date("week_end").notNull(),
    role: onCallRoleEnum("role").notNull(),
    rawValue: text("raw_value").notNull(), // e.g. "Gerard/ Shemar", "Richie/ Timothy"
    status: text("status").default("pending").notNull(), // pending | resolved | dismissed
    resolvedById: text("resolved_by_id").references(() => user.id),
    resolvedAt: timestamp("resolved_at"),
    resolutionNotes: text("resolution_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("import_warnings_weekStart_idx").on(table.weekStart),
    index("import_warnings_status_idx").on(table.status),
  ],
);

export const rotaImportWarningRelations = relations(
  rotaImportWarnings,
  ({ one }) => ({
    schedule: one(onCallSchedules, {
      fields: [rotaImportWarnings.scheduleId],
      references: [onCallSchedules.id],
    }),
    resolvedBy: one(user, {
      fields: [rotaImportWarnings.resolvedById],
      references: [user.id],
    }),
  }),
);
