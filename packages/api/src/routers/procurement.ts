import { ORPCError } from "@orpc/server";
import { z } from "zod";
import {
  db,
  purchaseRequisitions,
  prLineItems,
  prApprovals,
} from "@ndma-dcs-staff-portal/db";
import { and, desc, eq } from "drizzle-orm";

import { protectedProcedure } from "../index";
import { logAudit } from "../lib/audit";
import { createNotification } from "../lib/notify";

const StatusSchema = z.enum([
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "ordered",
  "received",
  "cancelled",
]);

const LineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().min(1),
  unitCost: z.string(), // numeric as string to avoid float precision issues
  unit: z.string().default("pcs"),
});

export const procurementRouter = {
  list: protectedProcedure
    .input(
      z.object({
        status: StatusSchema.optional(),
        departmentId: z.string().optional(),
        requestedById: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .handler(async ({ input }) => {
      const conditions = [];
      if (input.status) conditions.push(eq(purchaseRequisitions.status, input.status));
      if (input.departmentId)
        conditions.push(eq(purchaseRequisitions.departmentId, input.departmentId));
      if (input.requestedById)
        conditions.push(eq(purchaseRequisitions.requestedById, input.requestedById));
      if (input.priority)
        conditions.push(eq(purchaseRequisitions.priority, input.priority));

      return db.query.purchaseRequisitions.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: desc(purchaseRequisitions.createdAt),
        limit: input.limit,
        offset: input.offset,
        with: {
          requestedBy: { with: { user: true } },
          department: true,
          approvedBy: true,
        },
      });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const pr = await db.query.purchaseRequisitions.findFirst({
        where: eq(purchaseRequisitions.id, input.id),
        with: {
          requestedBy: { with: { user: true } },
          department: true,
          approvedBy: true,
          lineItems: true,
          approvals: { with: { approver: true } },
        },
      });
      if (!pr) throw new ORPCError("NOT_FOUND");
      return pr;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        justification: z.string().optional(),
        requestedById: z.string().optional(),
        departmentId: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        lineItems: z.array(LineItemSchema).min(1),
      }),
    )
    .handler(async ({ input, context }) => {
      // Compute total from line items
      const totalEstimatedCost = input.lineItems
        .reduce(
          (sum, item) => sum + parseFloat(item.unitCost) * item.quantity,
          0,
        )
        .toFixed(2);

      const [pr] = await db
        .insert(purchaseRequisitions)
        .values({
          title: input.title,
          description: input.description ?? null,
          justification: input.justification ?? null,
          requestedById: input.requestedById ?? null,
          departmentId: input.departmentId ?? null,
          priority: input.priority,
          totalEstimatedCost,
          createdById: context.session.user.id,
        })
        .returning();
      if (!pr) throw new ORPCError("INTERNAL_SERVER_ERROR");

      // Insert line items
      await db.insert(prLineItems).values(
        input.lineItems.map((item) => ({
          prId: pr.id,
          description: item.description,
          quantity: item.quantity,
          unitCost: item.unitCost,
          unit: item.unit,
          totalCost: (parseFloat(item.unitCost) * item.quantity).toFixed(2),
        })),
      );

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "pr.create",
        module: "procurement",
        resourceType: "purchase_requisition",
        resourceId: pr.id,
        afterValue: { ...pr, lineItemCount: input.lineItems.length } as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return pr;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        justification: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        vendorName: z.string().optional(),
        vendorReference: z.string().optional(),
        expectedDeliveryDate: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const { id, ...updates } = input;
      const before = await db.query.purchaseRequisitions.findFirst({
        where: eq(purchaseRequisitions.id, id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");
      if (!["draft"].includes(before.status))
        throw new ORPCError("FORBIDDEN", { message: "Only draft PRs can be edited" });

      const [updated] = await db
        .update(purchaseRequisitions)
        .set(updates)
        .where(eq(purchaseRequisitions.id, id))
        .returning();
      if (!updated) throw new ORPCError("INTERNAL_SERVER_ERROR");

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "pr.update",
        module: "procurement",
        resourceType: "purchase_requisition",
        resourceId: id,
        beforeValue: before as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return updated;
    }),

  submit: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const before = await db.query.purchaseRequisitions.findFirst({
        where: eq(purchaseRequisitions.id, input.id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");
      if (before.status !== "draft")
        throw new ORPCError("CONFLICT", { message: "Only draft PRs can be submitted" });

      const [updated] = await db
        .update(purchaseRequisitions)
        .set({ status: "submitted" })
        .where(eq(purchaseRequisitions.id, input.id))
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "pr.submit",
        module: "procurement",
        resourceType: "purchase_requisition",
        resourceId: input.id,
        beforeValue: { status: "draft" },
        afterValue: { status: "submitted" },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return updated;
    }),

  approve: protectedProcedure
    .input(z.object({ id: z.string(), notes: z.string().optional() }))
    .handler(async ({ input, context }) => {
      const before = await db.query.purchaseRequisitions.findFirst({
        where: eq(purchaseRequisitions.id, input.id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      const [updated] = await db
        .update(purchaseRequisitions)
        .set({
          status: "approved",
          approvedById: context.session.user.id,
          approvedAt: new Date(),
        })
        .where(eq(purchaseRequisitions.id, input.id))
        .returning();

      await db.insert(prApprovals).values({
        prId: input.id,
        approverId: context.session.user.id,
        action: "approved",
        notes: input.notes ?? null,
      });

      // Notify requester
      if (before.createdById) {
        await createNotification({
          recipientId: before.createdById,
          title: "PR Approved",
          body: `Your purchase requisition "${before.title}" has been approved.`,
          module: "procurement",
          resourceType: "purchase_requisition",
          resourceId: input.id,
          linkUrl: `/procurement/${input.id}`,
        });
      }

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "pr.approve",
        module: "procurement",
        resourceType: "purchase_requisition",
        resourceId: input.id,
        beforeValue: { status: before.status },
        afterValue: { status: "approved" },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return updated;
    }),

  reject: protectedProcedure
    .input(z.object({ id: z.string(), notes: z.string().optional() }))
    .handler(async ({ input, context }) => {
      const before = await db.query.purchaseRequisitions.findFirst({
        where: eq(purchaseRequisitions.id, input.id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      const [updated] = await db
        .update(purchaseRequisitions)
        .set({
          status: "rejected",
          rejectionReason: input.notes ?? null,
        })
        .where(eq(purchaseRequisitions.id, input.id))
        .returning();

      await db.insert(prApprovals).values({
        prId: input.id,
        approverId: context.session.user.id,
        action: "rejected",
        notes: input.notes ?? null,
      });

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "pr.reject",
        module: "procurement",
        resourceType: "purchase_requisition",
        resourceId: input.id,
        beforeValue: { status: before.status },
        afterValue: { status: "rejected" },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return updated;
    }),

  markOrdered: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        vendorName: z.string().optional(),
        vendorReference: z.string().optional(),
        expectedDeliveryDate: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const { id, ...updates } = input;
      const [updated] = await db
        .update(purchaseRequisitions)
        .set({ status: "ordered", ...updates })
        .where(eq(purchaseRequisitions.id, id))
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "pr.mark_ordered",
        module: "procurement",
        resourceType: "purchase_requisition",
        resourceId: id,
        afterValue: { status: "ordered", ...updates } as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return updated;
    }),

  markReceived: protectedProcedure
    .input(z.object({ id: z.string(), notes: z.string().optional() }))
    .handler(async ({ input, context }) => {
      const today = new Date().toISOString().split("T")[0];
      const [updated] = await db
        .update(purchaseRequisitions)
        .set({
          status: "received",
          actualDeliveryDate: today,
          notes: input.notes ?? null,
        })
        .where(eq(purchaseRequisitions.id, input.id))
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "pr.mark_received",
        module: "procurement",
        resourceType: "purchase_requisition",
        resourceId: input.id,
        afterValue: { status: "received", actualDeliveryDate: today } as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return updated;
    }),

  getMyRequests: protectedProcedure.handler(async ({ context }) => {
    return db.query.purchaseRequisitions.findMany({
      where: eq(purchaseRequisitions.createdById, context.session.user.id),
      orderBy: desc(purchaseRequisitions.createdAt),
      with: { department: true, lineItems: true },
    });
  }),

  getPendingApprovals: protectedProcedure.handler(async () => {
    return db.query.purchaseRequisitions.findMany({
      where: eq(purchaseRequisitions.status, "submitted"),
      orderBy: desc(purchaseRequisitions.createdAt),
      with: {
        requestedBy: { with: { user: true } },
        department: true,
        lineItems: true,
      },
    });
  }),

  stats: protectedProcedure.handler(async () => {
    const all = await db.query.purchaseRequisitions.findMany({
      columns: { id: true, status: true, totalEstimatedCost: true, priority: true },
    });

    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let totalValue = 0;

    for (const pr of all) {
      byStatus[pr.status] = (byStatus[pr.status] ?? 0) + 1;
      byPriority[pr.priority] = (byPriority[pr.priority] ?? 0) + 1;
      if (pr.totalEstimatedCost) totalValue += parseFloat(pr.totalEstimatedCost);
    }

    return { total: all.length, byStatus, byPriority, totalValue: totalValue.toFixed(2) };
  }),
};
