import { db, notifications } from "@ndma-dcs-staff-portal/db";

export interface CreateNotificationParams {
  recipientId: string;
  channel?: "in_app" | "email";
  title: string;
  body: string;
  module: string;
  resourceType?: string | null;
  resourceId?: string | null;
  linkUrl?: string | null;
}

/**
 * Insert a notification for a user.
 * Status defaults to "pending" — a background job or direct send changes it to "sent".
 */
export async function createNotification(
  params: CreateNotificationParams,
): Promise<void> {
  await db.insert(notifications).values({
    recipientId: params.recipientId,
    channel: params.channel ?? "in_app",
    title: params.title,
    body: params.body,
    module: params.module,
    resourceType: params.resourceType ?? null,
    resourceId: params.resourceId ?? null,
    linkUrl: params.linkUrl ?? null,
    status: "pending",
  });
}
