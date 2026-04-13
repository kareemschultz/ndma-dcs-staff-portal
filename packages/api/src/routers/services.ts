import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db, services } from "@ndma-dcs-staff-portal/db";
import { eq } from "drizzle-orm";

import { protectedProcedure } from "../index";
import { logAudit } from "../lib/audit";

export const servicesRouter = {
  list: protectedProcedure.handler(async () => {
    return db.query.services.findMany({
      where: eq(services.isActive, true),
      with: {
        department: true,
        owner: { with: { user: true } },
      },
    });
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const service = await db.query.services.findFirst({
        where: eq(services.id, input.id),
        with: {
          department: true,
          owner: { with: { user: true } },
          affectedByIncidents: {
            with: { incident: true },
          },
        },
      });
      if (!service) throw new ORPCError("NOT_FOUND");
      return service;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        departmentId: z.string().optional(),
        ownerStaffId: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const [service] = await db
        .insert(services)
        .values({
          name: input.name,
          description: input.description ?? null,
          departmentId: input.departmentId ?? null,
          ownerStaffId: input.ownerStaffId ?? null,
        })
        .returning();
      if (!service) throw new ORPCError("INTERNAL_SERVER_ERROR");

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "service.create",
        module: "incident",
        resourceType: "service",
        resourceId: service.id,
        afterValue: service as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return service;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        departmentId: z.string().optional(),
        ownerStaffId: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const { id, ...updates } = input;
      const before = await db.query.services.findFirst({
        where: eq(services.id, id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      const [updated] = await db
        .update(services)
        .set(updates)
        .where(eq(services.id, id))
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "service.update",
        module: "incident",
        resourceType: "service",
        resourceId: id,
        beforeValue: before as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return updated;
    }),
};
