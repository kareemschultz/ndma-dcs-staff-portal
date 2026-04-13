import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db } from "@ndma-dcs-staff-portal/db";
import {
  escalationPolicies,
  escalationSteps,
  onCallOverrides,
} from "@ndma-dcs-staff-portal/db";
import { eq, asc } from "drizzle-orm";
import { protectedProcedure, requireRole } from "../index";
import { logAudit } from "../lib/audit";

// ── Input Schemas ─────────────────────────────────────────────────────────

const CreatePolicyInput = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  serviceId: z.string().optional(),
  departmentId: z.string().optional(),
  isActive: z.boolean().default(true),
});

const UpdatePolicyInput = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  serviceId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

const AddStepInput = z.object({
  policyId: z.string(),
  stepOrder: z.number().int().min(1),
  delayMinutes: z.number().int().min(0),
  notifyOnCallRole: z
    .enum(["lead_engineer", "asn_support", "core_support", "enterprise_support"])
    .optional(),
  notifyStaffId: z.string().optional(),
});

const UpdateStepInput = z.object({
  stepId: z.string(),
  delayMinutes: z.number().int().min(0).optional(),
  notifyOnCallRole: z
    .enum(["lead_engineer", "asn_support", "core_support", "enterprise_support"])
    .nullable()
    .optional(),
  notifyStaffId: z.string().nullable().optional(),
});

const CreateOverrideInput = z.object({
  scheduleId: z.string(),
  originalStaffId: z.string(),
  overrideStaffId: z.string(),
  role: z.enum(["lead_engineer", "asn_support", "core_support", "enterprise_support"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
});

const UpdateOverrideInput = z.object({
  id: z.string(),
  overrideStaffId: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  reason: z.string().optional(),
});

// ── Router ─────────────────────────────────────────────────────────────────

export const escalationRouter = {
  // ── Policies ─────────────────────────────────────────────────────────

  policies: {
    list: protectedProcedure.handler(async () => {
      return db.query.escalationPolicies.findMany({
        orderBy: asc(escalationPolicies.name),
        with: {
          steps: { orderBy: asc(escalationSteps.stepOrder) },
          service: true,
          department: true,
        },
      });
    }),

    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        const policy = await db.query.escalationPolicies.findFirst({
          where: eq(escalationPolicies.id, input.id),
          with: {
            steps: {
              orderBy: asc(escalationSteps.stepOrder),
              with: { notifyStaff: { with: { user: true } } },
            },
            service: true,
            department: true,
          },
        });
        if (!policy) throw new ORPCError("NOT_FOUND", { message: "Policy not found" });
        return policy;
      }),

    create: requireRole("rota", "create")
      .input(CreatePolicyInput)
      .handler(async ({ input, context }) => {
        const [policy] = await db
          .insert(escalationPolicies)
          .values(input)
          .returning();
        if (!policy) throw new ORPCError("INTERNAL_SERVER_ERROR");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "escalation.policy.create",
          module: "escalation",
          resourceType: "escalation_policy",
          resourceId: policy.id,
          afterValue: policy as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return policy;
      }),

    update: requireRole("rota", "update")
      .input(UpdatePolicyInput)
      .handler(async ({ input, context }) => {
        const { id, ...values } = input;

        const before = await db.query.escalationPolicies.findFirst({
          where: eq(escalationPolicies.id, id),
        });
        if (!before) throw new ORPCError("NOT_FOUND", { message: "Policy not found" });

        const [updated] = await db
          .update(escalationPolicies)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(escalationPolicies.id, id))
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "escalation.policy.update",
          module: "escalation",
          resourceType: "escalation_policy",
          resourceId: id,
          beforeValue: before as Record<string, unknown>,
          afterValue: updated as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return updated;
      }),

    delete: requireRole("rota", "delete")
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const existing = await db.query.escalationPolicies.findFirst({
          where: eq(escalationPolicies.id, input.id),
        });
        if (!existing) throw new ORPCError("NOT_FOUND", { message: "Policy not found" });

        await db.delete(escalationPolicies).where(eq(escalationPolicies.id, input.id));

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "escalation.policy.delete",
          module: "escalation",
          resourceType: "escalation_policy",
          resourceId: input.id,
          beforeValue: existing as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return { success: true };
      }),
  },

  // ── Steps ─────────────────────────────────────────────────────────────

  steps: {
    add: requireRole("rota", "update")
      .input(AddStepInput)
      .handler(async ({ input, context }) => {
        const policy = await db.query.escalationPolicies.findFirst({
          where: eq(escalationPolicies.id, input.policyId),
        });
        if (!policy) throw new ORPCError("NOT_FOUND", { message: "Policy not found" });

        const [step] = await db.insert(escalationSteps).values(input).returning();
        if (!step) throw new ORPCError("INTERNAL_SERVER_ERROR");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "escalation.step.add",
          module: "escalation",
          resourceType: "escalation_step",
          resourceId: step.id,
          afterValue: step as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return step;
      }),

    update: requireRole("rota", "update")
      .input(UpdateStepInput)
      .handler(async ({ input, context }) => {
        const { stepId, ...values } = input;

        const existing = await db.query.escalationSteps.findFirst({
          where: eq(escalationSteps.id, stepId),
        });
        if (!existing) throw new ORPCError("NOT_FOUND", { message: "Step not found" });

        const [updated] = await db
          .update(escalationSteps)
          .set(values)
          .where(eq(escalationSteps.id, stepId))
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "escalation.step.update",
          module: "escalation",
          resourceType: "escalation_step",
          resourceId: stepId,
          beforeValue: existing as Record<string, unknown>,
          afterValue: updated as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return updated;
      }),

    delete: requireRole("rota", "update")
      .input(z.object({ stepId: z.string() }))
      .handler(async ({ input, context }) => {
        const existing = await db.query.escalationSteps.findFirst({
          where: eq(escalationSteps.id, input.stepId),
        });
        if (!existing) throw new ORPCError("NOT_FOUND", { message: "Step not found" });

        await db.delete(escalationSteps).where(eq(escalationSteps.id, input.stepId));

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "escalation.step.delete",
          module: "escalation",
          resourceType: "escalation_step",
          resourceId: input.stepId,
          beforeValue: existing as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return { success: true };
      }),
  },

  // ── Overrides ─────────────────────────────────────────────────────────

  overrides: {
    list: protectedProcedure
      .input(z.object({ scheduleId: z.string().optional() }))
      .handler(async ({ input }) => {
        return db.query.onCallOverrides.findMany({
          where: input.scheduleId
            ? eq(onCallOverrides.scheduleId, input.scheduleId)
            : undefined,
          orderBy: asc(onCallOverrides.startDate),
          with: {
            originalStaff: { with: { user: true } },
            overrideStaff: { with: { user: true } },
          },
        });
      }),

    create: requireRole("rota", "update")
      .input(CreateOverrideInput)
      .handler(async ({ input, context }) => {
        const [override] = await db
          .insert(onCallOverrides)
          .values({ ...input, createdById: context.session.user.id })
          .returning();
        if (!override) throw new ORPCError("INTERNAL_SERVER_ERROR");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "escalation.override.create",
          module: "escalation",
          resourceType: "on_call_override",
          resourceId: override.id,
          afterValue: override as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return override;
      }),

    update: requireRole("rota", "update")
      .input(UpdateOverrideInput)
      .handler(async ({ input, context }) => {
        const { id, ...values } = input;

        const before = await db.query.onCallOverrides.findFirst({
          where: eq(onCallOverrides.id, id),
        });
        if (!before) throw new ORPCError("NOT_FOUND", { message: "Override not found" });

        const [updated] = await db
          .update(onCallOverrides)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(onCallOverrides.id, id))
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "escalation.override.update",
          module: "escalation",
          resourceType: "on_call_override",
          resourceId: id,
          beforeValue: before as Record<string, unknown>,
          afterValue: updated as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return updated;
      }),

    delete: requireRole("rota", "update")
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const existing = await db.query.onCallOverrides.findFirst({
          where: eq(onCallOverrides.id, input.id),
        });
        if (!existing) throw new ORPCError("NOT_FOUND", { message: "Override not found" });

        await db.delete(onCallOverrides).where(eq(onCallOverrides.id, input.id));

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "escalation.override.delete",
          module: "escalation",
          resourceType: "on_call_override",
          resourceId: input.id,
          beforeValue: existing as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          actorRole: context.userRole ?? undefined,
          correlationId: context.requestId,
        });

        return { success: true };
      }),
  },
};
