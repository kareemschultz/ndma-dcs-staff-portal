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
import { workItems } from "./work";

export const cycleStatusEnum = pgEnum("cycle_status", [
  "draft",
  "active",
  "completed",
  "cancelled",
]);

export const cyclePeriodEnum = pgEnum("cycle_period", [
  "weekly",
  "fortnightly",
  "monthly",
  "quarterly",
  "custom",
]);

export const cycles = pgTable(
  "cycles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    period: cyclePeriodEnum("period").notNull().default("weekly"),
    departmentId: text("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    status: cycleStatusEnum("status").notNull().default("draft"),
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
    index("cycles_status_idx").on(table.status),
    index("cycles_startDate_idx").on(table.startDate),
    index("cycles_departmentId_idx").on(table.departmentId),
  ],
);

export const cycleWorkItems = pgTable(
  "cycle_work_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    cycleId: text("cycle_id")
      .notNull()
      .references(() => cycles.id, { onDelete: "cascade" }),
    workItemId: text("work_item_id")
      .notNull()
      .references(() => workItems.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (table) => [
    unique("cycle_work_items_unique").on(table.cycleId, table.workItemId),
    index("cycle_work_items_cycleId_idx").on(table.cycleId),
    index("cycle_work_items_workItemId_idx").on(table.workItemId),
  ],
);

// ── Relations ──────────────────────────────────────────────────────────────

export const cyclesRelations = relations(cycles, ({ one, many }) => ({
  department: one(departments, {
    fields: [cycles.departmentId],
    references: [departments.id],
  }),
  createdBy: one(user, {
    fields: [cycles.createdById],
    references: [user.id],
  }),
  cycleWorkItems: many(cycleWorkItems),
}));

export const cycleWorkItemsRelations = relations(cycleWorkItems, ({ one }) => ({
  cycle: one(cycles, {
    fields: [cycleWorkItems.cycleId],
    references: [cycles.id],
  }),
  workItem: one(workItems, {
    fields: [cycleWorkItems.workItemId],
    references: [workItems.id],
  }),
}));
