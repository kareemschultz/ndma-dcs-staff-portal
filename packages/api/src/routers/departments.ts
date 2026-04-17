import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db, departments } from "@ndma-dcs-staff-portal/db";
import { eq } from "drizzle-orm";

import { protectedProcedure, requireRole } from "../index";
import { logAudit } from "../lib/audit";

export const departmentsRouter = {
  list: protectedProcedure.handler(async () => {
    return db.query.departments.findMany({
      with: { children: true, parent: true },
      orderBy: (d, { asc }) => [asc(d.name)],
    });
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const dept = await db.query.departments.findFirst({
        where: eq(departments.id, input.id),
        with: { children: true, parent: true, staffProfiles: { with: { user: true } } },
      });
      if (!dept) throw new ORPCError("NOT_FOUND");
      return dept;
    }),

  create: requireRole("staff", "create")
    .input(
      z.object({
        name: z.string().min(1).max(100),
        code: z.string().min(1).max(20).toUpperCase(),
        description: z.string().optional(),
        parentId: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const existing = await db.query.departments.findFirst({
        where: eq(departments.code, input.code.toUpperCase()),
      });
      if (existing)
        throw new ORPCError("CONFLICT", { message: `Department code '${input.code}' already exists.` });

      const [dept] = await db
        .insert(departments)
        .values({
          name: input.name,
          code: input.code.toUpperCase(),
          description: input.description ?? null,
          parentId: input.parentId ?? null,
        })
        .returning();
      if (!dept) throw new ORPCError("INTERNAL_SERVER_ERROR");

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "department.create",
        module: "staff",
        resourceType: "department",
        resourceId: dept.id,
        afterValue: dept as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
      });

      return dept;
    }),

  update: requireRole("staff", "update")
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        parentId: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const { id, ...updates } = input;
      const before = await db.query.departments.findFirst({
        where: eq(departments.id, id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      const [updated] = await db
        .update(departments)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(departments.id, id))
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "department.update",
        module: "staff",
        resourceType: "department",
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

  deactivate: requireRole("staff", "delete")
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const before = await db.query.departments.findFirst({
        where: eq(departments.id, input.id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      const [updated] = await db
        .update(departments)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(departments.id, input.id))
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "department.deactivate",
        module: "staff",
        resourceType: "department",
        resourceId: input.id,
        beforeValue: { isActive: true },
        afterValue: { isActive: false },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
      });

      return updated;
    }),
};
