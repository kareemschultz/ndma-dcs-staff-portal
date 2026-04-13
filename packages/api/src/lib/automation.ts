import { and, eq } from "drizzle-orm";
import {
  db,
  automationRules,
  automationRuleLogs,
} from "@ndma-dcs-staff-portal/db";

import { createNotification } from "./notify";

// ── Types ──────────────────────────────────────────────────────────────────

export type TriggerModule =
  | "work"
  | "incident"
  | "leave"
  | "temp_changes"
  | "procurement"
  | "rota";

type Condition = {
  field: string;
  operator: "eq" | "neq" | "gt" | "lt" | "contains" | "not_contains";
  value: unknown;
};

type Action = {
  type: "notify_in_app" | "notify_role";
  title: string;
  body: string;
  recipientField?: string;
  role?: string;
  linkUrl?: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Replace {{fieldName}} placeholders with values from the trigger payload. */
function interpolate(template: string, payload: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = payload[key];
    return val !== undefined && val !== null ? String(val) : "";
  });
}

/** Evaluate a single condition against the trigger payload. Returns true if the condition passes. */
function evaluateCondition(
  condition: Condition,
  payload: Record<string, unknown>,
): boolean {
  const actual = payload[condition.field];
  const expected = condition.value;

  switch (condition.operator) {
    case "eq":
      return actual === expected;
    case "neq":
      return actual !== expected;
    case "gt":
      return (
        typeof actual === "number" &&
        typeof expected === "number" &&
        actual > expected
      );
    case "lt":
      return (
        typeof actual === "number" &&
        typeof expected === "number" &&
        actual < expected
      );
    case "contains":
      return (
        typeof actual === "string" &&
        typeof expected === "string" &&
        actual.includes(expected)
      );
    case "not_contains":
      return (
        typeof actual === "string" &&
        typeof expected === "string" &&
        !actual.includes(expected)
      );
    default:
      return false;
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

/**
 * Fire all enabled automation rules that match the given module + event.
 *
 * Call this after every significant mutation — e.g. after creating a work item,
 * changing an incident status, or approving leave.
 *
 * @param module  The domain that triggered the event (e.g. "work", "incident")
 * @param event   The specific event (e.g. "created", "status_changed", "overdue")
 * @param payload Flat object of the resource fields — used for condition evaluation
 *                and {{field}} interpolation in action titles/bodies.
 */
export async function fireAutomationRules(
  module: TriggerModule,
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const rules = await db.query.automationRules.findMany({
    where: and(
      eq(automationRules.triggerModule, module),
      eq(automationRules.triggerEvent, event),
      eq(automationRules.enabled, true),
    ),
  });

  if (rules.length === 0) return;

  for (const rule of rules) {
    const conditions = (rule.conditions as Condition[]) ?? [];
    const conditionsMet = conditions.every((c) =>
      evaluateCondition(c, payload),
    );

    // All conditions must pass — skip without logging if they don't
    if (!conditionsMet) continue;

    const actions = (rule.actions as Action[]) ?? [];
    const actionsExecuted: Array<{ type: string; result: string }> = [];
    let success = true;
    let errorMsg: string | null = null;

    try {
      for (const action of actions) {
        const title = interpolate(action.title, payload);
        const body = interpolate(action.body, payload);
        const linkUrl = action.linkUrl
          ? interpolate(action.linkUrl, payload)
          : null;
        const resourceId = String(payload.id ?? "");

        if (action.type === "notify_in_app" && action.recipientField) {
          const recipientId = payload[action.recipientField] as
            | string
            | undefined;
          if (recipientId) {
            await createNotification({
              recipientId,
              title,
              body,
              module,
              linkUrl,
              resourceType: module,
              resourceId,
            });
            actionsExecuted.push({
              type: action.type,
              result: `notified ${recipientId}`,
            });
          }
        } else if (action.type === "notify_role") {
          // Role-based notification is a future enhancement that requires
          // querying all users by role. Logged as queued for now.
          actionsExecuted.push({
            type: action.type,
            result: `role_notify_queued:${action.role ?? "unknown"}`,
          });
        }
      }
    } catch (err) {
      success = false;
      errorMsg = err instanceof Error ? err.message : String(err);
    }

    await Promise.all([
      db.insert(automationRuleLogs).values({
        ruleId: rule.id,
        triggerPayload: payload,
        actionsExecuted,
        success,
        error: errorMsg,
      }),
      db
        .update(automationRules)
        .set({
          lastFiredAt: new Date(),
          fireCount: (rule.fireCount ?? 0) + 1,
        })
        .where(eq(automationRules.id, rule.id)),
    ]);
  }
}
