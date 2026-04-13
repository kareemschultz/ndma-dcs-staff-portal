import { z } from "zod";
import { db, auditLogs } from "@ndma-dcs-staff-portal/db";
import { and, desc, eq, gte, lte } from "drizzle-orm";

import { protectedProcedure } from "../index";

const ListAuditInput = z.object({
  module: z.string().optional(),
  actorId: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  from: z.string().optional(), // ISO date string
  to: z.string().optional(),
  limit: z.number().min(1).max(200).default(50),
  offset: z.number().min(0).default(0),
});

export const auditRouter = {
  list: protectedProcedure
    .input(ListAuditInput)
    .handler(async ({ input }) => {
      const conditions = [];

      if (input.module) conditions.push(eq(auditLogs.module, input.module));
      if (input.actorId) conditions.push(eq(auditLogs.actorId, input.actorId));
      if (input.resourceType)
        conditions.push(eq(auditLogs.resourceType, input.resourceType));
      if (input.resourceId)
        conditions.push(eq(auditLogs.resourceId, input.resourceId));
      if (input.from)
        conditions.push(gte(auditLogs.createdAt, new Date(input.from)));
      if (input.to)
        conditions.push(lte(auditLogs.createdAt, new Date(input.to)));

      const rows = await db
        .select()
        .from(auditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(auditLogs.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return rows;
    }),

  getByResource: protectedProcedure
    .input(
      z.object({
        resourceType: z.string(),
        resourceId: z.string(),
      }),
    )
    .handler(async ({ input }) => {
      return db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.resourceType, input.resourceType),
            eq(auditLogs.resourceId, input.resourceId),
          ),
        )
        .orderBy(desc(auditLogs.createdAt));
    }),
};
