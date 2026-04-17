import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { departments } from "./departments";
import { user } from "./auth";
import { staffProfiles } from "./staff";

export const departmentAssignmentRoleEnum = pgEnum(
  "department_assignment_role",
  ["manager", "pa", "team_lead", "supervisor"],
);

export const departmentAssignmentHistoryActionEnum = pgEnum(
  "department_assignment_history_action",
  ["created", "updated", "deactivated", "reactivated"],
);

export const departmentAssignments = pgTable(
  "department_assignments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    departmentId: text("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    role: departmentAssignmentRoleEnum("role").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    assignedById: text("assigned_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    endedAt: timestamp("ended_at"),
    endedById: text("ended_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("department_assignments_staff_department_role_unique").on(
      table.staffProfileId,
      table.departmentId,
      table.role,
    ),
    index("department_assignments_staffProfileId_idx").on(table.staffProfileId),
    index("department_assignments_departmentId_idx").on(table.departmentId),
    index("department_assignments_role_idx").on(table.role),
    index("department_assignments_isActive_idx").on(table.isActive),
  ],
);

export const departmentAssignmentHistory = pgTable(
  "department_assignment_history",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    departmentAssignmentId: text("department_assignment_id")
      .notNull()
      .references(() => departmentAssignments.id, { onDelete: "cascade" }),
    action: departmentAssignmentHistoryActionEnum("action").notNull(),
    beforeValue: text("before_value"),
    afterValue: text("after_value"),
    changedById: text("changed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("department_assignment_history_assignmentId_idx").on(
      table.departmentAssignmentId,
    ),
    index("department_assignment_history_createdAt_idx").on(table.createdAt),
  ],
);

export const departmentAssignmentRelations = relations(
  departmentAssignments,
  ({ one, many }) => ({
    staffProfile: one(staffProfiles, {
      fields: [departmentAssignments.staffProfileId],
      references: [staffProfiles.id],
    }),
    department: one(departments, {
      fields: [departmentAssignments.departmentId],
      references: [departments.id],
    }),
    assignedBy: one(user, {
      fields: [departmentAssignments.assignedById],
      references: [user.id],
      relationName: "departmentAssignmentAssignedBy",
    }),
    endedBy: one(user, {
      fields: [departmentAssignments.endedById],
      references: [user.id],
      relationName: "departmentAssignmentEndedBy",
    }),
    history: many(departmentAssignmentHistory),
  }),
);

export const departmentAssignmentHistoryRelations = relations(
  departmentAssignmentHistory,
  ({ one }) => ({
    departmentAssignment: one(departmentAssignments, {
      fields: [departmentAssignmentHistory.departmentAssignmentId],
      references: [departmentAssignments.id],
    }),
    changedBy: one(user, {
      fields: [departmentAssignmentHistory.changedById],
      references: [user.id],
      relationName: "departmentAssignmentHistoryChangedBy",
    }),
  }),
);
