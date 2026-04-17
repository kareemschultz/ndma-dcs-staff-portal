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
import { user } from "./auth";

export const appraisalCycleHalfEnum = pgEnum("appraisal_cycle_half", [
  "h1",
  "h2",
]);

export const appraisalCycleStatusEnum = pgEnum("appraisal_cycle_status", [
  "draft",
  "open",
  "closed",
  "archived",
]);

export const appraisalCycles = pgTable(
  "appraisal_cycles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    departmentId: text("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    year: integer("year").notNull(),
    half: appraisalCycleHalfEnum("half").notNull(),
    title: text("title").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    status: appraisalCycleStatusEnum("status").notNull().default("draft"),
    openedAt: timestamp("opened_at"),
    openedById: text("opened_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    closedAt: timestamp("closed_at"),
    closedById: text("closed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("appraisal_cycles_department_year_half_unique").on(
      table.departmentId,
      table.year,
      table.half,
    ),
    index("appraisal_cycles_departmentId_idx").on(table.departmentId),
    index("appraisal_cycles_year_idx").on(table.year),
    index("appraisal_cycles_status_idx").on(table.status),
  ],
);

export const appraisalCyclesRelations = relations(appraisalCycles, ({ one }) => ({
  department: one(departments, {
    fields: [appraisalCycles.departmentId],
    references: [departments.id],
  }),
  openedBy: one(user, {
    fields: [appraisalCycles.openedById],
    references: [user.id],
    relationName: "appraisalCycleOpenedBy",
  }),
  closedBy: one(user, {
    fields: [appraisalCycles.closedById],
    references: [user.id],
    relationName: "appraisalCycleClosedBy",
  }),
}));
