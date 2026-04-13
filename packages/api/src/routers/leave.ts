import { ORPCError } from "@orpc/server";
import { z } from "zod";
import {
  db,
  leaveTypes,
  leaveBalances,
  leaveRequests,
} from "@ndma-dcs-staff-portal/db";
import { and, eq, gte, lte, sql } from "drizzle-orm";

import { protectedProcedure, requireRole } from "../index";
import { logAudit } from "../lib/audit";
import { createNotification } from "../lib/notify";

export const leaveRouter = {
  // ── Leave Types ───────────────────────────────────────────────────────────
  types: {
    list: protectedProcedure.handler(async () => {
      return db.query.leaveTypes.findMany({
        where: eq(leaveTypes.isActive, true),
      });
    }),

    create: requireRole("leave", "create")
      .input(
        z.object({
          name: z.string().min(1),
          code: z.string().min(1).max(10),
          defaultAnnualAllowance: z.number().default(20),
          requiresApproval: z.boolean().default(true),
        }),
      )
      .handler(async ({ input, context }) => {
        const [type] = await db.insert(leaveTypes).values(input).returning();
        if (!type) throw new ORPCError("INTERNAL_SERVER_ERROR");
        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "leave_type.create",
          module: "leave",
          resourceType: "leave_type",
          resourceId: type.id,
          afterValue: type as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });
        return type;
      }),

    update: requireRole("leave", "update")
      .input(
        z.object({
          id: z.string(),
          name: z.string().optional(),
          defaultAnnualAllowance: z.number().optional(),
          requiresApproval: z.boolean().optional(),
          isActive: z.boolean().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const { id, ...updates } = input;
        const [updated] = await db
          .update(leaveTypes)
          .set(updates)
          .where(eq(leaveTypes.id, id))
          .returning();
        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "leave_type.update",
          module: "leave",
          resourceType: "leave_type",
          resourceId: id,
          afterValue: updated as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });
        return updated;
      }),
  },

  // ── Leave Balances ────────────────────────────────────────────────────────
  balances: {
    getByStaff: protectedProcedure
      .input(z.object({ staffProfileId: z.string() }))
      .handler(async ({ input }) => {
        return db.query.leaveBalances.findMany({
          where: eq(leaveBalances.staffProfileId, input.staffProfileId),
          with: { leaveType: true },
        });
      }),

    adjust: requireRole("leave", "update")
      .input(
        z.object({
          staffProfileId: z.string(),
          leaveTypeId: z.string(),
          contractYearStart: z.string(),
          contractYearEnd: z.string(),
          entitlement: z.number(),
          adjustment: z.number().default(0),
          carriedOver: z.number().default(0),
        }),
      )
      .handler(async ({ input, context }) => {
        const [balance] = await db
          .insert(leaveBalances)
          .values(input)
          .onConflictDoUpdate({
            target: [
              leaveBalances.staffProfileId,
              leaveBalances.leaveTypeId,
              leaveBalances.contractYearStart,
            ],
            set: {
              entitlement: input.entitlement,
              adjustment: input.adjustment,
              carriedOver: input.carriedOver,
            },
          })
          .returning();
        if (!balance) throw new ORPCError("INTERNAL_SERVER_ERROR");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "leave_balance.adjust",
          module: "leave",
          resourceType: "leave_balance",
          resourceId: balance.id,
          afterValue: balance as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return balance;
      }),
  },

  // ── Leave Requests ────────────────────────────────────────────────────────
  requests: {
    list: protectedProcedure
      .input(
        z.object({
          staffProfileId: z.string().optional(),
          status: z
            .enum(["pending", "approved", "rejected", "cancelled"])
            .optional(),
          from: z.string().optional(),
          to: z.string().optional(),
          limit: z.number().min(1).max(200).default(50),
        }),
      )
      .handler(async ({ input }) => {
        const conditions = [];
        if (input.staffProfileId)
          conditions.push(eq(leaveRequests.staffProfileId, input.staffProfileId));
        if (input.status)
          conditions.push(eq(leaveRequests.status, input.status));
        if (input.from)
          conditions.push(gte(leaveRequests.startDate, input.from));
        if (input.to)
          conditions.push(lte(leaveRequests.endDate, input.to));

        return db.query.leaveRequests.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          with: {
            staffProfile: { with: { user: true, department: true } },
            leaveType: true,
            approvedBy: true,
          },
          limit: input.limit,
        });
      }),

    create: requireRole("leave", "create")
      .input(
        z.object({
          staffProfileId: z.string(),
          leaveTypeId: z.string(),
          startDate: z.string(),
          endDate: z.string(),
          totalDays: z.number().min(1),
          reason: z.string().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        // Check sufficient leave balance
        const balance = await db.query.leaveBalances.findFirst({
          where: and(
            eq(leaveBalances.staffProfileId, input.staffProfileId),
            eq(leaveBalances.leaveTypeId, input.leaveTypeId),
          ),
          orderBy: (t, { desc }) => [desc(t.contractYearStart)],
        });

        if (balance) {
          const available =
            balance.entitlement +
            balance.carriedOver +
            balance.adjustment -
            balance.used;
          if (input.totalDays > available) {
            throw new ORPCError("BAD_REQUEST", {
              message: `Insufficient leave balance: ${available} days available, ${input.totalDays} requested`,
            });
          }
        }

        // Check for overlapping approved/pending requests
        const overlapping = await db.query.leaveRequests.findFirst({
          where: and(
            eq(leaveRequests.staffProfileId, input.staffProfileId),
            sql`${leaveRequests.status} IN ('pending', 'approved')`,
            lte(leaveRequests.startDate, input.endDate),
            gte(leaveRequests.endDate, input.startDate),
          ),
        });

        if (overlapping) {
          throw new ORPCError("CONFLICT", {
            message: `Overlapping leave request exists (${overlapping.startDate} to ${overlapping.endDate})`,
          });
        }

        const [request] = await db
          .insert(leaveRequests)
          .values({ ...input, reason: input.reason ?? null })
          .returning();
        if (!request) throw new ORPCError("INTERNAL_SERVER_ERROR");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "leave_request.create",
          module: "leave",
          resourceType: "leave_request",
          resourceId: request.id,
          afterValue: request as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return request;
      }),

    approve: requireRole("leave", "approve")
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const before = await db.query.leaveRequests.findFirst({
          where: eq(leaveRequests.id, input.id),
          with: { staffProfile: true },
        });
        if (!before) throw new ORPCError("NOT_FOUND");
        if (before.status !== "pending")
          throw new ORPCError("CONFLICT", { message: "Request is not pending" });

        const [updated] = await db
          .update(leaveRequests)
          .set({
            status: "approved",
            approvedById: context.session.user.id,
            approvedAt: new Date(),
          })
          .where(eq(leaveRequests.id, input.id))
          .returning();

        // Update used balance
        await db
          .update(leaveBalances)
          .set({ used: sql`${leaveBalances.used} + ${before.totalDays}` })
          .where(
            and(
              eq(leaveBalances.staffProfileId, before.staffProfileId),
              eq(leaveBalances.leaveTypeId, before.leaveTypeId),
            ),
          );

        await createNotification({
          recipientId: before.staffProfile.userId,
          title: "Leave request approved",
          body: `Your leave from ${before.startDate} to ${before.endDate} has been approved.`,
          module: "leave",
          resourceType: "leave_request",
          resourceId: input.id,
          linkUrl: `/leave`,
        });

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "leave_request.approve",
          module: "leave",
          resourceType: "leave_request",
          resourceId: input.id,
          beforeValue: { status: before.status },
          afterValue: { status: "approved" },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return updated;
      }),

    reject: requireRole("leave", "reject")
      .input(z.object({ id: z.string(), rejectionReason: z.string().optional() }))
      .handler(async ({ input, context }) => {
        const before = await db.query.leaveRequests.findFirst({
          where: eq(leaveRequests.id, input.id),
          with: { staffProfile: true },
        });
        if (!before) throw new ORPCError("NOT_FOUND");
        if (before.status !== "pending")
          throw new ORPCError("CONFLICT", { message: "Request is not pending" });

        const [updated] = await db
          .update(leaveRequests)
          .set({
            status: "rejected",
            approvedById: context.session.user.id,
            approvedAt: new Date(),
            rejectionReason: input.rejectionReason ?? null,
          })
          .where(eq(leaveRequests.id, input.id))
          .returning();

        await createNotification({
          recipientId: before.staffProfile.userId,
          title: "Leave request rejected",
          body: input.rejectionReason ?? `Your leave request has been rejected.`,
          module: "leave",
          resourceType: "leave_request",
          resourceId: input.id,
        });

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "leave_request.reject",
          module: "leave",
          resourceType: "leave_request",
          resourceId: input.id,
          beforeValue: { status: before.status },
          afterValue: { status: "rejected", rejectionReason: input.rejectionReason },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return updated;
      }),

    cancel: requireRole("leave", "cancel")
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const before = await db.query.leaveRequests.findFirst({
          where: eq(leaveRequests.id, input.id),
        });
        if (!before) throw new ORPCError("NOT_FOUND");
        if (!["pending", "approved"].includes(before.status))
          throw new ORPCError("CONFLICT", { message: "Cannot cancel this request" });

        const [updated] = await db
          .update(leaveRequests)
          .set({ status: "cancelled" })
          .where(eq(leaveRequests.id, input.id))
          .returning();

        // Return days to balance if cancelling an approved request
        if (before.status === "approved") {
          await db
            .update(leaveBalances)
            .set({ used: sql`GREATEST(0, ${leaveBalances.used} - ${before.totalDays})` })
            .where(
              and(
                eq(leaveBalances.staffProfileId, before.staffProfileId),
                eq(leaveBalances.leaveTypeId, before.leaveTypeId),
              ),
            );
        }

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "leave_request.cancel",
          module: "leave",
          resourceType: "leave_request",
          resourceId: input.id,
          beforeValue: { status: before.status },
          afterValue: { status: "cancelled" },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return updated;
      }),
  },

  // ── Team calendar: approved leave for a date range ─────────────────────
  getTeamCalendar: protectedProcedure
    .input(z.object({ from: z.string(), to: z.string(), departmentId: z.string().optional() }))
    .handler(async ({ input }) => {
      const conditions = [
        eq(leaveRequests.status, "approved"),
        lte(leaveRequests.startDate, input.to),
        gte(leaveRequests.endDate, input.from),
      ];

      return db.query.leaveRequests.findMany({
        where: and(...conditions),
        with: {
          staffProfile: { with: { user: true, department: true } },
          leaveType: true,
        },
      });
    }),
};
