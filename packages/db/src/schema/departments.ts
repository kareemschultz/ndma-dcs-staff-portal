import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { staffProfiles } from "./staff";

export const departments = pgTable("departments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(), // "ASN", "Core", "Enterprise", "DCS"
  code: text("code").notNull().unique(), // "ASN", "CORE", "ENT", "DCS"
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  // Self-referential parent — bare text (no .references()) to avoid Drizzle circular FK issue
  // DCS is the parent of ASN, CORE, ENT sub-departments
  parentId: text("parent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const departmentRelations = relations(departments, ({ one, many }) => ({
  staffProfiles: many(staffProfiles),
  // Sub-departments under this department
  children: many(departments, { relationName: "dept_parent" }),
  // Parent department (null for top-level)
  parent: one(departments, {
    fields: [departments.parentId],
    references: [departments.id],
    relationName: "dept_parent",
  }),
}));
