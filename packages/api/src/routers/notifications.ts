import { z } from "zod";
import { db, notifications } from "@ndma-dcs-staff-portal/db";
import { and, desc, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

import { protectedProcedure } from "../index";

export const notificationsRouter = {
  list: protectedProcedure
    .input(
      z.object({
        includeRead: z.boolean().default(false),
        limit: z.number().min(1).max(100).default(30),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const conditions = [eq(notifications.recipientId, userId)];
      if (!input.includeRead) {
        // Return pending + sent (unread) only
        conditions.push(
          sql`${notifications.status} IN ('pending', 'sent')`,
        );
      }

      const rows = await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit);

      const unreadCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(
          and(
            eq(notifications.recipientId, userId),
            sql`${notifications.status} IN ('pending', 'sent')`,
          ),
        );

      return {
        items: rows,
        unreadCount: Number(unreadCount[0]?.count ?? 0),
      };
    }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const [updated] = await db
        .update(notifications)
        .set({ status: "read", readAt: new Date() })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.recipientId, context.session.user.id),
          ),
        )
        .returning();
      return updated ?? null;
    }),

  markAllRead: protectedProcedure.handler(async ({ context }) => {
    await db
      .update(notifications)
      .set({ status: "read", readAt: new Date() })
      .where(
        and(
          eq(notifications.recipientId, context.session.user.id),
          sql`${notifications.status} IN ('pending', 'sent')`,
        ),
      );
    return { success: true };
  }),

  dismiss: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const [updated] = await db
        .update(notifications)
        .set({ status: "dismissed" })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.recipientId, context.session.user.id),
          ),
        )
        .returning();
      return updated ?? null;
    }),
};
