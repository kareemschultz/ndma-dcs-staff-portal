import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { user } from "./auth";
import { departments } from "./departments";
import { services } from "./incidents";
import { staffProfiles } from "./staff";
import { onCallSchedules } from "./rota";
import { onCallRoleEnum } from "./rota";

// ── Escalation Policies ────────────────────────────────────────────────────

export const escalationPolicies = pgTable("escalation_policies", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  // Optional scope — policy can be global, per-service, or per-department
  serviceId: text("service_id").references(() => services.id, {
    onDelete: "set null",
  }),
  departmentId: text("department_id").references(() => departments.id, {
    onDelete: "set null",
  }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const escalationSteps = pgTable(
  "escalation_steps",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    policyId: text("policy_id")
      .notNull()
      .references(() => escalationPolicies.id, { onDelete: "cascade" }),
    stepOrder: integer("step_order").notNull(),
    // Minutes to wait before escalating to this step
    delayMinutes: integer("delay_minutes").notNull().default(15),
    // Notify the on-call person in this role
    notifyOnCallRole: onCallRoleEnum("notify_on_call_role"),
    // Or notify a specific staff member directly
    notifyStaffId: text("notify_staff_id").references(() => staffProfiles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("escalation_steps_policyId_idx").on(table.policyId),
  ],
);

// ── On-Call Overrides ──────────────────────────────────────────────────────

export const onCallOverrides = pgTable(
  "on_call_overrides",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    scheduleId: text("schedule_id")
      .notNull()
      .references(() => onCallSchedules.id, { onDelete: "cascade" }),
    originalStaffId: text("original_staff_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    overrideStaffId: text("override_staff_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    role: onCallRoleEnum("role").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    reason: text("reason"),
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
    index("on_call_overrides_scheduleId_idx").on(table.scheduleId),
    index("on_call_overrides_dateRange_idx").on(table.startDate, table.endDate),
  ],
);

// ── Relations ─────────────────────────────────────────────────────────────────

export const escalationPoliciesRelations = relations(
  escalationPolicies,
  ({ one, many }) => ({
    service: one(services, {
      fields: [escalationPolicies.serviceId],
      references: [services.id],
    }),
    department: one(departments, {
      fields: [escalationPolicies.departmentId],
      references: [departments.id],
    }),
    steps: many(escalationSteps),
  }),
);

export const escalationStepsRelations = relations(
  escalationSteps,
  ({ one }) => ({
    policy: one(escalationPolicies, {
      fields: [escalationSteps.policyId],
      references: [escalationPolicies.id],
    }),
    notifyStaff: one(staffProfiles, {
      fields: [escalationSteps.notifyStaffId],
      references: [staffProfiles.id],
    }),
  }),
);

export const onCallOverridesRelations = relations(
  onCallOverrides,
  ({ one }) => ({
    schedule: one(onCallSchedules, {
      fields: [onCallOverrides.scheduleId],
      references: [onCallSchedules.id],
    }),
    originalStaff: one(staffProfiles, {
      fields: [onCallOverrides.originalStaffId],
      references: [staffProfiles.id],
      relationName: "originalStaff",
    }),
    overrideStaff: one(staffProfiles, {
      fields: [onCallOverrides.overrideStaffId],
      references: [staffProfiles.id],
      relationName: "overrideStaff",
    }),
    createdBy: one(user, {
      fields: [onCallOverrides.createdById],
      references: [user.id],
    }),
  }),
);
