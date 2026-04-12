import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { departments } from "./departments";

export const employmentTypeEnum = pgEnum("employment_type", [
  "full_time",
  "part_time",
  "contract",
  "temporary",
]);

export const staffStatusEnum = pgEnum("staff_status", [
  "active",
  "inactive",
  "on_leave",
  "terminated",
]);

export const staffProfiles = pgTable(
  "staff_profiles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    employeeId: text("employee_id").notNull().unique(), // e.g. "DCS-001"
    departmentId: text("department_id")
      .notNull()
      .references(() => departments.id),
    jobTitle: text("job_title").notNull(),
    employmentType: employmentTypeEnum("employment_type")
      .default("full_time")
      .notNull(),
    status: staffStatusEnum("status").default("active").notNull(),
    // On-call eligibility
    isTeamLead: boolean("is_team_lead").default(false).notNull(),
    isLeadEngineerEligible: boolean("is_lead_engineer_eligible")
      .default(false)
      .notNull(),
    isOnCallEligible: boolean("is_on_call_eligible").default(true).notNull(),
    contractExpiresAt: timestamp("contract_expires_at"),
    startDate: timestamp("start_date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("staff_profiles_userId_idx").on(table.userId),
    index("staff_profiles_departmentId_idx").on(table.departmentId),
  ],
);

export const staffProfileRelations = relations(staffProfiles, ({ one }) => ({
  user: one(user, {
    fields: [staffProfiles.userId],
    references: [user.id],
  }),
  department: one(departments, {
    fields: [staffProfiles.departmentId],
    references: [departments.id],
  }),
}));
