import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { user } from "./auth";
import { departments } from "./departments";
import { staffProfiles } from "./staff";

export const workItemTypeEnum = pgEnum("work_item_type", [
  "routine",
  "project",
  "external_request",
  "ad_hoc",
]);

export const workItemStatusEnum = pgEnum("work_item_status", [
  "backlog",
  "todo",
  "in_progress",
  "blocked",
  "review",
  "done",
  "cancelled",
]);

export const workItemPriorityEnum = pgEnum("work_item_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const workItems = pgTable(
  "work_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    description: text("description"),
    type: workItemTypeEnum("type").notNull().default("routine"),
    status: workItemStatusEnum("status").notNull().default("todo"),
    priority: workItemPriorityEnum("priority").notNull().default("medium"),
    // Assignee + department
    assignedToId: text("assigned_to_id").references(() => staffProfiles.id, {
      onDelete: "set null",
    }),
    departmentId: text("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    // For external_request type — who raised this
    requesterName: text("requester_name"),
    requesterEmail: text("requester_email"),
    // External tracking (e.g. ServiceNow, email thread reference)
    sourceSystem: text("source_system"),
    sourceReference: text("source_reference"),
    // Scheduling
    dueDate: date("due_date"),
    completedAt: timestamp("completed_at"),
    // Audit
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
    index("work_items_status_idx").on(table.status),
    index("work_items_assignedToId_idx").on(table.assignedToId),
    index("work_items_departmentId_idx").on(table.departmentId),
    index("work_items_dueDate_idx").on(table.dueDate),
    index("work_items_type_idx").on(table.type),
  ],
);

export const workItemComments = pgTable("work_item_comments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  workItemId: text("work_item_id")
    .notNull()
    .references(() => workItems.id, { onDelete: "cascade" }),
  authorId: text("author_id").references(() => user.id, {
    onDelete: "set null",
  }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const workItemWeeklyUpdates = pgTable(
  "work_item_weekly_updates",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workItemId: text("work_item_id")
      .notNull()
      .references(() => workItems.id, { onDelete: "cascade" }),
    authorId: text("author_id").references(() => user.id, {
      onDelete: "set null",
    }),
    // ISO date of the Monday that starts this reporting week (YYYY-MM-DD)
    weekStart: date("week_start").notNull(),
    statusSummary: text("status_summary").notNull(),
    blockers: text("blockers"),
    nextSteps: text("next_steps"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("work_item_weekly_updates_unique").on(
      table.workItemId,
      table.weekStart,
    ),
  ],
);

// ── Relations ─────────────────────────────────────────────────────────────────

export const workItemsRelations = relations(workItems, ({ one, many }) => ({
  assignedTo: one(staffProfiles, {
    fields: [workItems.assignedToId],
    references: [staffProfiles.id],
  }),
  department: one(departments, {
    fields: [workItems.departmentId],
    references: [departments.id],
  }),
  createdBy: one(user, {
    fields: [workItems.createdById],
    references: [user.id],
  }),
  comments: many(workItemComments),
  weeklyUpdates: many(workItemWeeklyUpdates),
}));

export const workItemCommentsRelations = relations(
  workItemComments,
  ({ one }) => ({
    workItem: one(workItems, {
      fields: [workItemComments.workItemId],
      references: [workItems.id],
    }),
    author: one(user, {
      fields: [workItemComments.authorId],
      references: [user.id],
    }),
  }),
);

export const workItemWeeklyUpdatesRelations = relations(
  workItemWeeklyUpdates,
  ({ one }) => ({
    workItem: one(workItems, {
      fields: [workItemWeeklyUpdates.workItemId],
      references: [workItems.id],
    }),
    author: one(user, {
      fields: [workItemWeeklyUpdates.authorId],
      references: [user.id],
    }),
  }),
);
