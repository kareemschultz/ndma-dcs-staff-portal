import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { and, desc, eq, gte } from "drizzle-orm";
import {
  db,
  automationRules,
  automationRuleLogs,
} from "@ndma-dcs-staff-portal/db";

import { protectedProcedure, requireRole } from "../index";
import { logAudit } from "../lib/audit";

// ── Input Schemas ──────────────────────────────────────────────────────────

const TriggerModuleSchema = z.enum([
  "work",
  "incident",
  "leave",
  "temp_changes",
  "procurement",
  "rota",
]);

const ConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(["eq", "neq", "gt", "lt", "contains", "not_contains"]),
  value: z.unknown(),
});

const ActionSchema = z.object({
  type: z.enum(["notify_in_app", "notify_role"]),
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  recipientField: z.string().optional(),
  role: z.string().optional(),
  linkUrl: z.string().optional(),
});

const CreateRuleInput = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  enabled: z.boolean(),
  triggerModule: TriggerModuleSchema,
  triggerEvent: z.string().min(1).max(100),
  conditions: z.array(ConditionSchema),
  actions: z.array(ActionSchema).min(1),
});

const UpdateRuleInput = z.object({
  id: z.string(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  triggerModule: TriggerModuleSchema.optional(),
  triggerEvent: z.string().min(1).max(100).optional(),
  conditions: z.array(ConditionSchema).optional(),
  actions: z.array(ActionSchema).optional(),
});

// ── Router ─────────────────────────────────────────────────────────────────

export const automationRouter = {
  list: protectedProcedure
    .input(
      z.object({
        module: TriggerModuleSchema.optional(),
        enabled: z.boolean().optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .handler(async ({ input }) => {
      const conditions = [];
      if (input.module !== undefined)
        conditions.push(eq(automationRules.triggerModule, input.module));
      if (input.enabled !== undefined)
        conditions.push(eq(automationRules.enabled, input.enabled));

      return db.query.automationRules.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [automationRules.triggerModule, automationRules.name],
        limit: input.limit,
        offset: input.offset,
        with: { createdBy: true },
      });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const rule = await db.query.automationRules.findFirst({
        where: eq(automationRules.id, input.id),
        with: {
          createdBy: true,
          logs: {
            orderBy: desc(automationRuleLogs.firedAt),
            limit: 20,
          },
        },
      });
      if (!rule) throw new ORPCError("NOT_FOUND");
      return rule;
    }),

  create: requireRole("settings", "create")
    .input(CreateRuleInput)
    .handler(async ({ input, context }) => {
      const [rule] = await db
        .insert(automationRules)
        .values({
          name: input.name,
          description: input.description ?? null,
          enabled: input.enabled,
          triggerModule: input.triggerModule,
          triggerEvent: input.triggerEvent,
          conditions: input.conditions,
          actions: input.actions,
          createdById: context.session.user.id,
        })
        .returning();
      if (!rule) throw new ORPCError("INTERNAL_SERVER_ERROR");

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
        action: "automation.rule.create",
        module: "settings",
        resourceType: "automation_rule",
        resourceId: rule.id,
        afterValue: rule as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return rule;
    }),

  update: requireRole("settings", "update")
    .input(UpdateRuleInput)
    .handler(async ({ input, context }) => {
      const { id, ...updates } = input;

      const before = await db.query.automationRules.findFirst({
        where: eq(automationRules.id, id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      const [updated] = await db
        .update(automationRules)
        .set(updates)
        .where(eq(automationRules.id, id))
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
        action: "automation.rule.update",
        module: "settings",
        resourceType: "automation_rule",
        resourceId: id,
        beforeValue: before as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return updated;
    }),

  toggle: requireRole("settings", "update")
    .input(z.object({ id: z.string(), enabled: z.boolean() }))
    .handler(async ({ input, context }) => {
      const [updated] = await db
        .update(automationRules)
        .set({ enabled: input.enabled })
        .where(eq(automationRules.id, input.id))
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
        action: input.enabled
          ? "automation.rule.enable"
          : "automation.rule.disable",
        module: "settings",
        resourceType: "automation_rule",
        resourceId: input.id,
        afterValue: { enabled: input.enabled },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return updated;
    }),

  delete: requireRole("settings", "delete")
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const before = await db.query.automationRules.findFirst({
        where: eq(automationRules.id, input.id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      await db
        .delete(automationRules)
        .where(eq(automationRules.id, input.id));

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
        action: "automation.rule.delete",
        module: "settings",
        resourceType: "automation_rule",
        resourceId: input.id,
        beforeValue: before as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return { success: true };
    }),

  getLogs: protectedProcedure
    .input(
      z.object({
        ruleId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .handler(async ({ input }) => {
      return db.query.automationRuleLogs.findMany({
        where: eq(automationRuleLogs.ruleId, input.ruleId),
        orderBy: desc(automationRuleLogs.firedAt),
        limit: input.limit,
        offset: input.offset,
      });
    }),

  stats: protectedProcedure.handler(async () => {
    const [allRules, recentLogs] = await Promise.all([
      db.query.automationRules.findMany({
        columns: { id: true, enabled: true, triggerModule: true, fireCount: true },
      }),
      db.query.automationRuleLogs.findMany({
        where: gte(
          automationRuleLogs.firedAt,
          new Date(Date.now() - 24 * 60 * 60 * 1000),
        ),
        columns: { id: true, success: true },
      }),
    ]);

    const byModule: Record<string, number> = {};
    let enabled = 0;
    for (const r of allRules) {
      if (r.enabled) enabled++;
      byModule[r.triggerModule] = (byModule[r.triggerModule] ?? 0) + 1;
    }

    return {
      total: allRules.length,
      enabled,
      disabled: allRules.length - enabled,
      byModule,
      firesLast24h: recentLogs.length,
      failuresLast24h: recentLogs.filter((l) => !l.success).length,
    };
  }),
};
