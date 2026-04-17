import { ORPCError } from "@orpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import {
  attendanceExceptions,
  db,
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

const statusSchema = z.enum(["draft", "submitted", "approved", "rejected", "cancelled"]);
const typeSchema = z.enum([
  "sick",
  "medical",
  "lateness",
  "early_leave",
  "wfh",
  "absent",
  "time_off",
]);

async function assertAttendanceAccess(context: Parameters<typeof canAccessStaffPrivate>[0], staffProfileId: string) {
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
    resourceType: "attendance_exception",
    resourceId,
  });
}

export const attendanceExceptionsRouter = {
  list: requireRole("attendance", "read")
    .input(
      z.object({
        staffProfileId: z.string().optional(),
        status: statusSchema.optional(),
        exceptionType: typeSchema.optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const role = context.userRole ?? "";
      const conditions = [];

      if (input.staffProfileId) {
        await assertAttendanceAccess(context, input.staffProfileId);
        conditions.push(eq(attendanceExceptions.staffProfileId, input.staffProfileId));
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
        conditions.push(inArray(attendanceExceptions.staffProfileId, [...accessible]));
      }

      if (input.status) {
        conditions.push(eq(attendanceExceptions.status, input.status));
      }
      if (input.exceptionType) {
        conditions.push(eq(attendanceExceptions.exceptionType, input.exceptionType));
      }

      return db.query.attendanceExceptions.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: { staffProfile: { with: { user: true, department: true } }, leaveRequest: true, reviewedBy: true },
        orderBy: [desc(attendanceExceptions.exceptionDate), desc(attendanceExceptions.createdAt)],
      });
    }),

  create: requireRole("attendance", "create")
    .input(
      z.object({
        staffProfileId: z.string(),
        exceptionDate: z.string(),
        exceptionType: typeSchema,
        hours: z.string().optional(),
        reason: z.string().min(1),
        notes: z.string().optional(),
        leaveRequestId: z.string().optional(),
        status: statusSchema.optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      await assertAttendanceAccess(context, input.staffProfileId);

      const [row] = await db
        .insert(attendanceExceptions)
        .values({
          staffProfileId: input.staffProfileId,
          leaveRequestId: input.leaveRequestId ?? null,
          exceptionDate: input.exceptionDate,
          exceptionType: input.exceptionType,
          hours: input.hours ?? null,
          reason: input.reason,
          notes: input.notes ?? null,
          status: input.status ?? "draft",
        })
        .returning();
      if (!row) throw new ORPCError("INTERNAL_SERVER_ERROR");

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        actorRole: context.userRole ?? undefined,
        action: "attendance_exception.create",
        module: "compliance",
        resourceType: "attendance_exception",
        resourceId: row.id,
        afterValue: row as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        correlationId: context.requestId,
      });

      return row;
    }),

  update: requireRole("attendance", "update")
    .input(
      z.object({
        id: z.string(),
        exceptionDate: z.string().optional(),
        exceptionType: typeSchema.optional(),
        hours: z.string().optional(),
        reason: z.string().optional(),
        notes: z.string().optional(),
        leaveRequestId: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const before = await db.query.attendanceExceptions.findFirst({
        where: eq(attendanceExceptions.id, input.id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      await assertAttendanceAccess(context, before.staffProfileId);
      if (!["draft", "rejected"].includes(before.status)) {
        throw new ORPCError("CONFLICT", {
          message: "Only draft or rejected attendance exceptions can be edited.",
        });
      }

      const [row] = await db
        .update(attendanceExceptions)
        .set({
          exceptionDate: input.exceptionDate ?? before.exceptionDate,
          exceptionType: input.exceptionType ?? before.exceptionType,
          hours: input.hours ?? before.hours,
          reason: input.reason ?? before.reason,
          notes: input.notes ?? before.notes,
          leaveRequestId: input.leaveRequestId ?? before.leaveRequestId,
          updatedAt: new Date(),
        })
        .where(eq(attendanceExceptions.id, input.id))
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        actorRole: context.userRole ?? undefined,
        action: "attendance_exception.update",
        module: "compliance",
        resourceType: "attendance_exception",
        resourceId: input.id,
        beforeValue: before as Record<string, unknown>,
        afterValue: row as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        correlationId: context.requestId,
      });

      return row;
    }),

  submit: requireRole("attendance", "submit")
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const before = await db.query.attendanceExceptions.findFirst({
        where: eq(attendanceExceptions.id, input.id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      await assertAttendanceAccess(context, before.staffProfileId);
      if (!["draft", "rejected"].includes(before.status)) {
        throw new ORPCError("CONFLICT", {
          message: "Only draft or rejected attendance exceptions can be submitted.",
        });
      }

      const [row] = await db
        .update(attendanceExceptions)
        .set({ status: "submitted", updatedAt: new Date() })
        .where(eq(attendanceExceptions.id, input.id))
        .returning();

      await notifyStaff(
        before.staffProfileId,
        "Attendance exception submitted",
        "An attendance exception has been submitted for review.",
        "compliance",
        before.id,
      );

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        actorRole: context.userRole ?? undefined,
        action: "attendance_exception.submit",
        module: "compliance",
        resourceType: "attendance_exception",
        resourceId: input.id,
        beforeValue: before as Record<string, unknown>,
        afterValue: row as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        correlationId: context.requestId,
      });

      return row;
    }),

  approve: requireRole("attendance", "approve")
    .input(z.object({ id: z.string(), notes: z.string().optional() }))
    .handler(async ({ input, context }) => {
      const before = await db.query.attendanceExceptions.findFirst({
        where: eq(attendanceExceptions.id, input.id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");
      if (before.status !== "submitted") {
        throw new ORPCError("CONFLICT", {
          message: "Only submitted attendance exceptions can be approved.",
        });
      }

      const [row] = await db
        .update(attendanceExceptions)
        .set({
          status: "approved",
          reviewedById: context.session.user.id,
          reviewedAt: new Date(),
          notes: input.notes ?? before.notes,
          updatedAt: new Date(),
        })
        .where(eq(attendanceExceptions.id, input.id))
        .returning();

      await notifyStaff(
        before.staffProfileId,
        "Attendance exception approved",
        "An attendance exception has been approved.",
        "compliance",
        before.id,
      );

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        actorRole: context.userRole ?? undefined,
        action: "attendance_exception.approve",
        module: "compliance",
        resourceType: "attendance_exception",
        resourceId: input.id,
        beforeValue: before as Record<string, unknown>,
        afterValue: row as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        correlationId: context.requestId,
      });

      return row;
    }),

  reject: requireRole("attendance", "reject")
    .input(z.object({ id: z.string(), reason: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const before = await db.query.attendanceExceptions.findFirst({
        where: eq(attendanceExceptions.id, input.id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");
      if (before.status !== "submitted") {
        throw new ORPCError("CONFLICT", {
          message: "Only submitted attendance exceptions can be rejected.",
        });
      }

      const [row] = await db
        .update(attendanceExceptions)
        .set({
          status: "rejected",
          reviewedById: context.session.user.id,
          reviewedAt: new Date(),
          notes: input.reason,
          updatedAt: new Date(),
        })
        .where(eq(attendanceExceptions.id, input.id))
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        actorRole: context.userRole ?? undefined,
        action: "attendance_exception.reject",
        module: "compliance",
        resourceType: "attendance_exception",
        resourceId: input.id,
        beforeValue: before as Record<string, unknown>,
        afterValue: row as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        correlationId: context.requestId,
      });

      return row;
    }),

  stats: requireRole("attendance", "read").handler(async ({ context }) => {
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
            submitted: 0,
            approved: 0,
            rejected: 0,
            draft: 0,
            cancelled: 0,
          };
        }
      conditions.push(inArray(attendanceExceptions.staffProfileId, [...accessible]));
    }

    const rows = await db.query.attendanceExceptions.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
    });
    return rows.reduce(
      (acc, row) => {
        acc[row.status] += 1;
        return acc;
      },
      {
        draft: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
      },
    );
  }),
};
