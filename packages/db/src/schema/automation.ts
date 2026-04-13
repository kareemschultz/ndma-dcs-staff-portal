import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { user } from "./auth";

// ── Enums ──────────────────────────────────────────────────────────────────

export const automationTriggerModuleEnum = pgEnum(
  "automation_trigger_module",
  ["work", "incident", "leave", "temp_changes", "procurement", "rota"],
);

// ── Tables ─────────────────────────────────────────────────────────────────

/**
 * An automation rule watches for a specific event on a module,
 * evaluates optional conditions, then executes a list of actions.
 *
 * conditions — array of { field, operator, value } (all must pass)
 * actions    — array of { type, title, body, recipientField?, role?, linkUrl? }
 */
export const automationRules = pgTable(
  "automation_rules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    enabled: boolean("enabled").default(true).notNull(),
    triggerModule: automationTriggerModuleEnum("trigger_module").notNull(),
    // Module-specific event string e.g. "created", "status_changed", "overdue"
    triggerEvent: text("trigger_event").notNull(),
    conditions: jsonb("conditions")
      .$type<
        Array<{
          field: string;
          operator: "eq" | "neq" | "gt" | "lt" | "contains" | "not_contains";
          value: unknown;
        }>
      >()
      .notNull(),
    actions: jsonb("actions")
      .$type<
        Array<{
          type: "notify_in_app" | "notify_role";
          title: string;
          body: string;
          recipientField?: string; // payload key that holds the userId to notify
          role?: string; // for notify_role: which role to notify
          linkUrl?: string; // optional deep-link (supports {{field}} interpolation)
        }>
      >()
      .notNull(),
    lastFiredAt: timestamp("last_fired_at"),
    fireCount: integer("fire_count").default(0).notNull(),
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
    index("automation_rules_module_event_idx").on(
      table.triggerModule,
      table.triggerEvent,
    ),
    index("automation_rules_enabled_idx").on(table.enabled),
  ],
);

/**
 * Append-only log of every time a rule fired.
 * Kept for debugging and audit purposes.
 */
export const automationRuleLogs = pgTable(
  "automation_rule_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    ruleId: text("rule_id")
      .notNull()
      .references(() => automationRules.id, { onDelete: "cascade" }),
    firedAt: timestamp("fired_at").defaultNow().notNull(),
    triggerPayload: jsonb("trigger_payload").$type<Record<string, unknown>>(),
    actionsExecuted: jsonb("actions_executed").$type<
      Array<{ type: string; result: string }>
    >(),
    success: boolean("success").notNull(),
    error: text("error"),
  },
  (table) => [
    index("automation_rule_logs_ruleId_idx").on(table.ruleId),
    index("automation_rule_logs_firedAt_idx").on(table.firedAt),
  ],
);

// ── Relations ──────────────────────────────────────────────────────────────

export const automationRulesRelations = relations(
  automationRules,
  ({ one, many }) => ({
    createdBy: one(user, {
      fields: [automationRules.createdById],
      references: [user.id],
    }),
    logs: many(automationRuleLogs),
  }),
);

export const automationRuleLogsRelations = relations(
  automationRuleLogs,
  ({ one }) => ({
    rule: one(automationRules, {
      fields: [automationRuleLogs.ruleId],
      references: [automationRules.id],
    }),
  }),
);
