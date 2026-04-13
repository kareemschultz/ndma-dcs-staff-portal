import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db, appraisals } from "@ndma-dcs-staff-portal/db";
import { and, eq, lte, sql } from "drizzle-orm";

import { protectedProcedure, requireRole } from "../index";
import { logAudit } from "../lib/audit";

export const appraisalsRouter = {
  list: protectedProcedure
    .input(
      z.object({
        staffProfileId: z.string().optional(),
        status: z
          .enum(["scheduled", "in_progress", "completed", "overdue"])
          .optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .handler(async ({ input }) => {
      const conditions = [];
      if (input.staffProfileId)
        conditions.push(eq(appraisals.staffProfileId, input.staffProfileId));
      if (input.status) conditions.push(eq(appraisals.status, input.status));

      return db.query.appraisals.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
          staffProfile: { with: { user: true, department: true } },
          reviewer: { with: { user: true } },
        },
        limit: input.limit,
        offset: input.offset,
      });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const appraisal = await db.query.appraisals.findFirst({
        where: eq(appraisals.id, input.id),
        with: {
          staffProfile: { with: { user: true, department: true } },
          reviewer: { with: { user: true } },
        },
      });
      if (!appraisal) throw new ORPCError("NOT_FOUND");
      return appraisal;
    }),

  create: requireRole("appraisal", "create")
    .input(
      z.object({
        staffProfileId: z.string(),
        reviewerId: z.string().optional(),
        periodStart: z.string(),
        periodEnd: z.string(),
        scheduledDate: z.string().optional(),
        objectives: z
          .array(
            z.object({
              title: z.string(),
              rating: z.number().optional(),
              comments: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const [appraisal] = await db
        .insert(appraisals)
        .values({
          ...input,
          reviewerId: input.reviewerId ?? null,
          scheduledDate: input.scheduledDate ?? null,
          objectives: input.objectives ?? null,
        })
        .returning();
      if (!appraisal) throw new ORPCError("INTERNAL_SERVER_ERROR");

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "appraisal.create",
        module: "staff",
        resourceType: "appraisal",
        resourceId: appraisal.id,
        afterValue: appraisal as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return appraisal;
    }),

  update: requireRole("appraisal", "update")
    .input(
      z.object({
        id: z.string(),
        reviewerId: z.string().optional(),
        scheduledDate: z.string().optional(),
        completedDate: z.string().optional(),
        status: z
          .enum(["scheduled", "in_progress", "completed", "overdue"])
          .optional(),
        overallRating: z.number().min(1).max(5).optional(),
        summary: z.string().optional(),
        objectives: z
          .array(
            z.object({
              title: z.string(),
              rating: z.number().optional(),
              comments: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const { id, ...updates } = input;
      const before = await db.query.appraisals.findFirst({
        where: eq(appraisals.id, id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      const [updated] = await db
        .update(appraisals)
        .set(updates)
        .where(eq(appraisals.id, id))
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "appraisal.update",
        module: "staff",
        resourceType: "appraisal",
        resourceId: id,
        beforeValue: before as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return updated;
    }),

  getOverdue: protectedProcedure.handler(async () => {
    const today = new Date().toISOString().slice(0, 10);
    return db.query.appraisals.findMany({
      where: and(
        sql`${appraisals.scheduledDate} IS NOT NULL`,
        lte(appraisals.scheduledDate, today),
        sql`${appraisals.status} NOT IN ('completed')`,
      ),
      with: {
        staffProfile: { with: { user: true, department: true } },
        reviewer: { with: { user: true } },
      },
    });
  }),

  getByStaff: protectedProcedure
    .input(z.object({ staffProfileId: z.string() }))
    .handler(async ({ input }) => {
      return db.query.appraisals.findMany({
        where: eq(appraisals.staffProfileId, input.staffProfileId),
        with: { reviewer: { with: { user: true } } },
      });
    }),
};
