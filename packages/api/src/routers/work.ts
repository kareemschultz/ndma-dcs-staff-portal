import { ORPCError } from "@orpc/server";
import { z } from "zod";
import {
  db,
  workItems,
  workItemComments,
  workItemWeeklyUpdates,
  staffProfiles,
} from "@ndma-dcs-staff-portal/db";
import { and, desc, eq, lt, sql, isNotNull } from "drizzle-orm";

import { protectedProcedure } from "../index";
import { logAudit } from "../lib/audit";
import { createNotification } from "../lib/notify";

// ── Input Schemas ──────────────────────────────────────────────────────────

const WorkItemTypeSchema = z.enum([
  "routine",
  "project",
  "external_request",
  "ad_hoc",
]);

const WorkItemStatusSchema = z.enum([
  "backlog",
  "todo",
  "in_progress",
  "blocked",
  "review",
  "done",
  "cancelled",
]);

const WorkItemPrioritySchema = z.enum(["low", "medium", "high", "critical"]);

const CreateWorkItemInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: WorkItemTypeSchema.default("routine"),
  priority: WorkItemPrioritySchema.default("medium"),
  assignedToId: z.string().optional(),
  departmentId: z.string().optional(),
  requesterName: z.string().optional(),
  requesterEmail: z.string().email().optional(),
  sourceSystem: z.string().optional(),
  sourceReference: z.string().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const UpdateWorkItemInput = z.object({
  id: z.string(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  type: WorkItemTypeSchema.optional(),
  status: WorkItemStatusSchema.optional(),
  priority: WorkItemPrioritySchema.optional(),
  departmentId: z.string().optional(),
  requesterName: z.string().optional(),
  requesterEmail: z.string().email().optional(),
  sourceSystem: z.string().optional(),
  sourceReference: z.string().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const ListWorkItemsInput = z.object({
  status: WorkItemStatusSchema.optional(),
  type: WorkItemTypeSchema.optional(),
  priority: WorkItemPrioritySchema.optional(),
  assignedToId: z.string().optional(),
  departmentId: z.string().optional(),
  overdueOnly: z.boolean().optional(),
  limit: z.number().min(1).max(200).default(50),
  offset: z.number().min(0).default(0),
});

const AddCommentInput = z.object({
  workItemId: z.string(),
  body: z.string().min(1),
});

const AddWeeklyUpdateInput = z.object({
  workItemId: z.string(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  statusSummary: z.string().min(1),
  blockers: z.string().optional(),
  nextSteps: z.string().optional(),
});

// ── Router ─────────────────────────────────────────────────────────────────

export const workRouter = {
  list: protectedProcedure
    .input(ListWorkItemsInput)
    .handler(async ({ input }) => {
      const conditions = [];
      const today = new Date().toISOString().slice(0, 10);

      if (input.status) conditions.push(eq(workItems.status, input.status));
      if (input.type) conditions.push(eq(workItems.type, input.type));
      if (input.priority) conditions.push(eq(workItems.priority, input.priority));
      if (input.assignedToId)
        conditions.push(eq(workItems.assignedToId, input.assignedToId));
      if (input.departmentId)
        conditions.push(eq(workItems.departmentId, input.departmentId));
      if (input.overdueOnly) {
        conditions.push(
          and(
            isNotNull(workItems.dueDate),
            lt(workItems.dueDate, today),
            sql`${workItems.status} NOT IN ('done', 'cancelled')`,
          )!,
        );
      }

      return db.query.workItems.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(workItems.updatedAt)],
        limit: input.limit,
        offset: input.offset,
        with: {
          assignedTo: { with: { user: true } },
          department: true,
          createdBy: true,
        },
      });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const item = await db.query.workItems.findFirst({
        where: eq(workItems.id, input.id),
        with: {
          assignedTo: { with: { user: true } },
          department: true,
          createdBy: true,
          comments: {
            with: { author: true },
            orderBy: desc(workItemComments.createdAt),
          },
          weeklyUpdates: {
            with: { author: true },
            orderBy: desc(workItemWeeklyUpdates.weekStart),
          },
        },
      });
      if (!item) throw new ORPCError("NOT_FOUND", { message: "Work item not found" });
      return item;
    }),

  create: protectedProcedure
    .input(CreateWorkItemInput)
    .handler(async ({ input, context }) => {
      const [item] = await db
        .insert(workItems)
        .values({
          ...input,
          dueDate: input.dueDate ?? null,
          createdById: context.session.user.id,
        })
        .returning();

      if (!item) throw new ORPCError("INTERNAL_SERVER_ERROR");

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "work_item.create",
        module: "work",
        resourceType: "work_item",
        resourceId: item.id,
        afterValue: item as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      // Notify assignee if set
      if (item.assignedToId) {
        const profile = await db.query.staffProfiles.findFirst({
          where: eq(staffProfiles.id, item.assignedToId),
        });
        if (profile) {
          await createNotification({
            recipientId: profile.userId,
            title: "Work item assigned to you",
            body: item.title,
            module: "work",
            resourceType: "work_item",
            resourceId: item.id,
            linkUrl: `/work/${item.id}`,
          });
        }
      }

      return item;
    }),

  update: protectedProcedure
    .input(UpdateWorkItemInput)
    .handler(async ({ input, context }) => {
      const { id, ...updates } = input;

      const before = await db.query.workItems.findFirst({
        where: eq(workItems.id, id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      const completedAt =
        updates.status === "done" && before.status !== "done"
          ? new Date()
          : undefined;

      const [updated] = await db
        .update(workItems)
        .set({ ...updates, ...(completedAt ? { completedAt } : {}) })
        .where(eq(workItems.id, id))
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "work_item.update",
        module: "work",
        resourceType: "work_item",
        resourceId: id,
        beforeValue: before as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return updated;
    }),

  assign: protectedProcedure
    .input(z.object({ id: z.string(), staffProfileId: z.string() }))
    .handler(async ({ input, context }) => {
      const before = await db.query.workItems.findFirst({
        where: eq(workItems.id, input.id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      const [updated] = await db
        .update(workItems)
        .set({ assignedToId: input.staffProfileId })
        .where(eq(workItems.id, input.id))
        .returning();

      if (!updated) throw new ORPCError("INTERNAL_SERVER_ERROR");

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "work_item.assign",
        module: "work",
        resourceType: "work_item",
        resourceId: input.id,
        beforeValue: { assignedToId: before.assignedToId },
        afterValue: { assignedToId: input.staffProfileId },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      // Notify the new assignee
      const profile = await db.query.staffProfiles.findFirst({
        where: eq(staffProfiles.id, input.staffProfileId),
      });
      if (profile) {
        await createNotification({
          recipientId: profile.userId,
          title: "Work item assigned to you",
          body: updated.title,
          module: "work",
          resourceType: "work_item",
          resourceId: input.id,
          linkUrl: `/work/${input.id}`,
        });
      }

      return updated;
    }),

  addComment: protectedProcedure
    .input(AddCommentInput)
    .handler(async ({ input, context }) => {
      const exists = await db.query.workItems.findFirst({
        where: eq(workItems.id, input.workItemId),
      });
      if (!exists) throw new ORPCError("NOT_FOUND");

      const [comment] = await db
        .insert(workItemComments)
        .values({
          workItemId: input.workItemId,
          authorId: context.session.user.id,
          body: input.body,
        })
        .returning();

      return comment;
    }),

  addWeeklyUpdate: protectedProcedure
    .input(AddWeeklyUpdateInput)
    .handler(async ({ input, context }) => {
      const exists = await db.query.workItems.findFirst({
        where: eq(workItems.id, input.workItemId),
      });
      if (!exists) throw new ORPCError("NOT_FOUND");

      // Upsert — one update per work item per week
      const [update] = await db
        .insert(workItemWeeklyUpdates)
        .values({
          workItemId: input.workItemId,
          authorId: context.session.user.id,
          weekStart: input.weekStart,
          statusSummary: input.statusSummary,
          blockers: input.blockers ?? null,
          nextSteps: input.nextSteps ?? null,
        })
        .onConflictDoUpdate({
          target: [
            workItemWeeklyUpdates.workItemId,
            workItemWeeklyUpdates.weekStart,
          ],
          set: {
            statusSummary: input.statusSummary,
            blockers: input.blockers ?? null,
            nextSteps: input.nextSteps ?? null,
            authorId: context.session.user.id,
          },
        })
        .returning();

      return update;
    }),

  getOverdue: protectedProcedure.handler(async () => {
    const today = new Date().toISOString().slice(0, 10);
    return db.query.workItems.findMany({
      where: and(
        isNotNull(workItems.dueDate),
        lt(workItems.dueDate, today),
        sql`${workItems.status} NOT IN ('done', 'cancelled')`,
      ),
      orderBy: [workItems.dueDate],
      with: {
        assignedTo: { with: { user: true } },
        department: true,
      },
    });
  }),

  getWeeklyReport: protectedProcedure
    .input(z.object({ weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
    .handler(async ({ input }) => {
      // All weekly updates for the given week, with their parent work item
      const updates = await db.query.workItemWeeklyUpdates.findMany({
        where: eq(workItemWeeklyUpdates.weekStart, input.weekStart),
        orderBy: desc(workItemWeeklyUpdates.createdAt),
        with: {
          workItem: {
            with: {
              assignedTo: { with: { user: true } },
              department: true,
            },
          },
          author: true,
        },
      });
      return updates;
    }),

  stats: protectedProcedure.handler(async () => {
    const today = new Date().toISOString().slice(0, 10);

    const all = await db.query.workItems.findMany({
      columns: { id: true, status: true, type: true, dueDate: true },
    });

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let overdue = 0;

    for (const item of all) {
      byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
      byType[item.type] = (byType[item.type] ?? 0) + 1;
      if (
        item.dueDate &&
        item.dueDate < today &&
        item.status !== "done" &&
        item.status !== "cancelled"
      ) {
        overdue++;
      }
    }

    return { total: all.length, byStatus, byType, overdue };
  }),
};
