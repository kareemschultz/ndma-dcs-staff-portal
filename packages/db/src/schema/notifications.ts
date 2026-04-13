import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const notificationChannelEnum = pgEnum("notification_channel", [
  "in_app",
  "email",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "read",
  "dismissed",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    channel: notificationChannelEnum("channel").notNull().default("in_app"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    // Domain context — matches audit log fields for easy cross-referencing
    module: text("module").notNull(),
    resourceType: text("resource_type"),
    resourceId: text("resource_id"),
    linkUrl: text("link_url"),
    status: notificationStatusEnum("status").notNull().default("pending"),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notifications_recipientId_status_idx").on(
      table.recipientId,
      table.status,
    ),
    index("notifications_createdAt_idx").on(table.createdAt),
  ],
);
