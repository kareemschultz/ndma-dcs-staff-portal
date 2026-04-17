import { ORPCError } from "@orpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import {
  callouts,
  db,
  incidents,
  staffProfiles,
} from "@ndma-dcs-staff-portal/db";

import { requireRole } from "../index";
import { logAudit } from "../lib/audit";
import {
  canAccessStaffPrivate,
  getCallerStaffProfile,
  getManagedStaffIds,
} from "../lib/scope";
import { createNotification } from "../lib/notify";

const calloutTypeSchema = z.enum(["phone", "sms", "whatsapp", "email", "manual"]);

async function assertCalloutAccess(context: Parameters<typeof canAccessStaffPrivate>[0], staffProfileId: string) {
  const role = context.userRole ?? "";
  if (role === "admin" || role === "hrAdminOps") {
    return;
  }
  const allowed = await canAccessStaffPrivate(context, staffProfileId);
  if (!allowed) {
    throw new ORPCError("FORBIDDEN");
  }
}

async function notifyStaff(staffProfileId: string, title: string, body: string, module: string, resourceId: string) {
  const staff = await db.query.staffProfiles.findFirst({
    where: eq(staffProfiles.id, staffProfileId),
    with: { user: true },
  });
  if (!staff?.user?.id) {
    return;
  }
  await createNotification({
    recipientId: staff.user.id,
    title,
    body,
    module,
    resourceType: "callout",
    resourceId,
  });
}

export const calloutsRouter = {
  list: requireRole("callout", "read")
    .input(
      z.object({
        staffProfileId: z.string().optional(),
        relatedIncidentId: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const role = context.userRole ?? "";
      const conditions = [];

      if (input.staffProfileId) {
        await assertCalloutAccess(context, input.staffProfileId);
        conditions.push(eq(callouts.staffProfileId, input.staffProfileId));
      } else if (role !== "admin" && role !== "hrAdminOps") {
        const managed = await getManagedStaffIds(context);
        const caller = await getCallerStaffProfile(context);
        const accessible = new Set(managed);
        if (caller?.id) {
          accessible.add(caller.id);
        }
        if (accessible.size === 0) {
          return [];
        }
        conditions.push(inArray(callouts.staffProfileId, [...accessible]));
      }

      if (input.relatedIncidentId) {
        conditions.push(eq(callouts.relatedIncidentId, input.relatedIncidentId));
      }

      return db.query.callouts.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
          staffProfile: { with: { user: true, department: true } },
          relatedIncident: true,
          reviewedBy: true,
        },
        orderBy: [desc(callouts.calloutAt), desc(callouts.createdAt)],
      });
    }),

  create: requireRole("callout", "create")
    .input(
      z.object({
        staffProfileId: z.string(),
        relatedIncidentId: z.string().optional(),
        calloutAt: z.string(),
        calloutType: calloutTypeSchema.optional(),
        reason: z.string().min(1),
        outcome: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      await assertCalloutAccess(context, input.staffProfileId);

      const [row] = await db
        .insert(callouts)
        .values({
          staffProfileId: input.staffProfileId,
          relatedIncidentId: input.relatedIncidentId ?? null,
          calloutAt: input.calloutAt,
          calloutType: input.calloutType ?? "manual",
          reason: input.reason,
          outcome: input.outcome ?? null,
          status: "logged",
        })
        .returning();
      if (!row) throw new ORPCError("INTERNAL_SERVER_ERROR");

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        actorRole: context.userRole ?? undefined,
        action: "callout.create",
        module: "operations",
        resourceType: "callout",
        resourceId: row.id,
        afterValue: row as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        correlationId: context.requestId,
      });

      return row;
    }),

  update: requireRole("callout", "update")
    .input(
      z.object({
        id: z.string(),
        relatedIncidentId: z.string().optional(),
        calloutAt: z.string().optional(),
        calloutType: calloutTypeSchema.optional(),
        reason: z.string().optional(),
        outcome: z.string().optional(),
        status: z.enum(["logged", "reviewed", "closed"]).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const before = await db.query.callouts.findFirst({
        where: eq(callouts.id, input.id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");
      if (before.status === "closed") {
        throw new ORPCError("CONFLICT", {
          message: "Closed callouts cannot be edited.",
        });
      }

      await assertCalloutAccess(context, before.staffProfileId);

      const [row] = await db
        .update(callouts)
        .set({
          relatedIncidentId: input.relatedIncidentId ?? before.relatedIncidentId,
          calloutAt: input.calloutAt ?? before.calloutAt,
          calloutType: input.calloutType ?? before.calloutType,
          reason: input.reason ?? before.reason,
          outcome: input.outcome ?? before.outcome,
          status: input.status ?? before.status,
          updatedAt: new Date(),
        })
        .where(eq(callouts.id, input.id))
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        actorRole: context.userRole ?? undefined,
        action: "callout.update",
        module: "operations",
        resourceType: "callout",
        resourceId: input.id,
        beforeValue: before as Record<string, unknown>,
        afterValue: row as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        correlationId: context.requestId,
      });

      return row;
    }),

  close: requireRole("callout", "update")
    .input(z.object({ id: z.string(), outcome: z.string().optional() }))
    .handler(async ({ input, context }) => {
      const before = await db.query.callouts.findFirst({
        where: eq(callouts.id, input.id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");
      if (before.status === "closed") {
        throw new ORPCError("CONFLICT", {
          message: "Closed callouts cannot be closed again.",
        });
      }

      const [row] = await db
        .update(callouts)
        .set({
          status: "closed",
          outcome: input.outcome ?? before.outcome,
          reviewedById: context.session.user.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(callouts.id, input.id))
        .returning();

      await notifyStaff(
        before.staffProfileId,
        "Callout closed",
        "A callout record has been closed.",
        "operations",
        before.id,
      );

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        actorRole: context.userRole ?? undefined,
        action: "callout.close",
        module: "operations",
        resourceType: "callout",
        resourceId: input.id,
        beforeValue: before as Record<string, unknown>,
        afterValue: row as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        correlationId: context.requestId,
      });

      return row;
    }),

  stats: requireRole("callout", "read").handler(async ({ context }) => {
    const role = context.userRole ?? "";
    const conditions = [];
    if (role !== "admin" && role !== "hrAdminOps") {
      const managed = await getManagedStaffIds(context);
      const caller = await getCallerStaffProfile(context);
      const accessible = new Set(managed);
      if (caller?.id) {
        accessible.add(caller.id);
      }
      if (accessible.size === 0) {
        return {
          logged: 0,
          reviewed: 0,
          closed: 0,
        };
      }
      conditions.push(inArray(callouts.staffProfileId, [...accessible]));
    }

    const rows = await db.query.callouts.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
    });
    return rows.reduce(
      (acc, row) => {
        acc[row.status] += 1;
        return acc;
      },
      { logged: 0, reviewed: 0, closed: 0 },
    );
  }),
};
