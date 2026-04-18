import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db, leavePolicies } from "@ndma-dcs-staff-portal/db";

import { requireRole } from "../index";
import { logAudit } from "../lib/audit";

export const leavePoliciesRouter = {
  list: requireRole("leave_policy", "read")
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        isActive: z.boolean().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const conditions = [];
      if (input.isActive != null) {
        conditions.push(eq(leavePolicies.isActive, input.isActive));
      }

      return db.query.leavePolicies.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: { department: true, leaveType: true },
        limit: input.limit,
        offset: input.offset,
      });
    }),

  get: requireRole("leave_policy", "read")
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const policy = await db.query.leavePolicies.findFirst({
        where: eq(leavePolicies.id, input.id),
        with: { department: true, leaveType: true },
      });
      if (!policy) throw new ORPCError("NOT_FOUND");
      return policy;
    }),

  create: requireRole("leave_policy", "create")
    .input(
      z.object({
        name: z.string().min(1),
        code: z.string().min(1).max(50),
        departmentId: z.string().nullable().optional(),
        leaveTypeId: z.string().nullable().optional(),
        maxConcurrentAbsences: z.number().int().min(1).default(2),
        maxRequestsPerYear: z.number().int().min(1).nullable().optional(),
        requiresHrOverrideForSplit: z.boolean().default(false),
        allowCarryOver: z.boolean().default(false),
        notes: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const [policy] = await db
        .insert(leavePolicies)
        .values({
          ...input,
          departmentId: input.departmentId ?? null,
          leaveTypeId: input.leaveTypeId ?? null,
          maxRequestsPerYear: input.maxRequestsPerYear ?? null,
          notes: input.notes ?? null,
        })
        .returning();
      if (!policy) throw new ORPCError("INTERNAL_SERVER_ERROR");

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "leave_policy.create",
        module: "leave",
        resourceType: "leave_policy",
        resourceId: policy.id,
        afterValue: policy as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
      });

      return policy;
    }),

  update: requireRole("leave_policy", "update")
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        code: z.string().min(1).max(50).optional(),
        departmentId: z.string().nullable().optional(),
        leaveTypeId: z.string().nullable().optional(),
        maxConcurrentAbsences: z.number().int().min(1).optional(),
        maxRequestsPerYear: z.number().int().min(1).nullable().optional(),
        requiresHrOverrideForSplit: z.boolean().optional(),
        allowCarryOver: z.boolean().optional(),
        isActive: z.boolean().optional(),
        notes: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const { id, ...updates } = input;
      const before = await db.query.leavePolicies.findFirst({
        where: eq(leavePolicies.id, id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      const [policy] = await db
        .update(leavePolicies)
        .set({
          ...(updates.name !== undefined ? { name: updates.name } : {}),
          ...(updates.code !== undefined ? { code: updates.code } : {}),
          ...(updates.departmentId !== undefined ? { departmentId: updates.departmentId } : {}),
          ...(updates.leaveTypeId !== undefined ? { leaveTypeId: updates.leaveTypeId } : {}),
          ...(updates.maxConcurrentAbsences !== undefined ? { maxConcurrentAbsences: updates.maxConcurrentAbsences } : {}),
          ...(updates.maxRequestsPerYear !== undefined ? { maxRequestsPerYear: updates.maxRequestsPerYear } : {}),
          ...(updates.requiresHrOverrideForSplit !== undefined ? { requiresHrOverrideForSplit: updates.requiresHrOverrideForSplit } : {}),
          ...(updates.allowCarryOver !== undefined ? { allowCarryOver: updates.allowCarryOver } : {}),
          ...(updates.isActive !== undefined ? { isActive: updates.isActive } : {}),
          ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
        })
        .where(eq(leavePolicies.id, id))
        .returning();
      if (!policy) throw new ORPCError("INTERNAL_SERVER_ERROR");

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "leave_policy.update",
        module: "leave",
        resourceType: "leave_policy",
        resourceId: id,
        beforeValue: before as Record<string, unknown>,
        afterValue: policy as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
      });

      return policy;
    }),

  deactivate: requireRole("leave_policy", "delete")
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const before = await db.query.leavePolicies.findFirst({
        where: eq(leavePolicies.id, input.id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      const [policy] = await db
        .update(leavePolicies)
        .set({ isActive: false })
        .where(eq(leavePolicies.id, input.id))
        .returning();
      if (!policy) throw new ORPCError("INTERNAL_SERVER_ERROR");

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "leave_policy.deactivate",
        module: "leave",
        resourceType: "leave_policy",
        resourceId: input.id,
        beforeValue: before as Record<string, unknown>,
        afterValue: policy as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
      });

      return policy;
    }),
};
