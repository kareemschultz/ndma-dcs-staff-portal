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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const departmentRelations = relations(departments, ({ many }) => ({
  staffProfiles: many(staffProfiles),
}));
