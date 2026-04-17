import { ORPCError } from "@orpc/server";
import { and, asc, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";

import {
  appraisals,
  appraisalFollowups,
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

const ratingMatrixSchema = z.object({
  organisational_skills: z.number().min(1).max(5),
  quality_of_work: z.number().min(1).max(5),
  dependability: z.number().min(1).max(5),
  communication_skills: z.number().min(1).max(5),
  cooperation: z.number().min(1).max(5),
  initiative: z.number().min(1).max(5),
  technical_skills: z.number().min(1).max(5),
  attendance_punctuality: z.number().min(1).max(5),
});

const appraisalStatusSchema = z.enum([
  "draft",
  "scheduled",
  "in_progress",
  "submitted",
  "approved",
  "rejected",
  "completed",
  "overdue",
]);

function computePercentage(ratingMatrix: Record<string, number>) {
  const values = Object.values(ratingMatrix);
  if (values.length === 0) {
    return null;
  }
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round((average / 5) * 100);
}

async function canAccessAppraisal(context: Parameters<typeof canAccessStaffPrivate>[0], staffProfileId: string) {
  const role = context.userRole ?? "";
  if (role === "admin" || role === "hrAdminOps") {
    return true;
  }
  return canAccessStaffPrivate(context, staffProfileId);
}

async function notifyRelatedPeople(appraisal: {
  staffProfileId: string;
  reviewerId: string | null;
  teamLeadId: string | null;
}, title: string, body: string, module: string, resourceId: string) {
  const recipients = new Set<string>();

  const staff = await db.query.staffProfiles.findFirst({
    where: eq(staffProfiles.id, appraisal.staffProfileId),
    with: { user: true },
  });
  if (staff?.user?.id) {
    recipients.add(staff.user.id);
  }

  if (appraisal.reviewerId) {
    const reviewer = await db.query.staffProfiles.findFirst({
      where: eq(staffProfiles.id, appraisal.reviewerId),
      with: { user: true },
    });
    if (reviewer?.user?.id) {
      recipients.add(reviewer.user.id);
    }
  }

  if (appraisal.teamLeadId) {
    const lead = await db.query.staffProfiles.findFirst({
      where: eq(staffProfiles.id, appraisal.teamLeadId),
      with: { user: true },
    });
    if (lead?.user?.id) {
      recipients.add(lead.user.id);
    }
  }

  await Promise.all(
    [...recipients].map((recipientId) =>
      createNotification({
        recipientId,
        title,
        body,
        module,
        resourceType: "appraisal",
        resourceId,
      }),
    ),
  );
}

async function fetchAppraisal(id: string) {
  return db.query.appraisals.findFirst({
    where: eq(appraisals.id, id),
    with: {
      staffProfile: { with: { user: true, department: true, teamLead: true } },
      reviewer: { with: { user: true } },
      teamLead: { with: { user: true } },
      submittedBy: true,
      approvedBy: true,
      rejectedBy: true,
      cycle: true,
    },
  });
}

async function assertVisibleOrThrow(
  context: Parameters<typeof canAccessStaffPrivate>[0],
  staffProfileId: string,
) {
  const allowed = await canAccessAppraisal(context, staffProfileId);
  if (!allowed) {
    throw new ORPCError("FORBIDDEN");
  }
}

export const appraisalsRouter = {
  list: requireRole("appraisal", "read")
    .input(
      z.object({
        staffProfileId: z.string().optional(),
        cycleId: z.string().optional(),
        status: appraisalStatusSchema.optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .handler(async ({ input, context }) => {
      const caller = await getCallerStaffProfile(context);
      const role = context.userRole ?? "";

      const conditions = [];
      if (input.staffProfileId) {
        await assertVisibleOrThrow(context, input.staffProfileId);
        conditions.push(eq(appraisals.staffProfileId, input.staffProfileId));
      } else if (role !== "admin" && role !== "hrAdminOps") {
        const accessible = new Set(await getManagedStaffIds(context));
        if (caller?.id) {
          accessible.add(caller.id);
        }
        if (accessible.size === 0) {
          return [];
        }
        conditions.push(inArray(appraisals.staffProfileId, [...accessible]));
      }

      if (input.cycleId) {
        conditions.push(eq(appraisals.cycleId, input.cycleId));
      }
      if (input.status) {
        conditions.push(eq(appraisals.status, input.status));
      }

      return db.query.appraisals.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
          staffProfile: { with: { user: true, department: true, teamLead: true } },
          reviewer: { with: { user: true } },
          teamLead: { with: { user: true } },
          cycle: true,
        },
        orderBy: [desc(appraisals.updatedAt), desc(appraisals.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });
    }),

  get: requireRole("appraisal", "read")
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const appraisal = await fetchAppraisal(input.id);
      if (!appraisal) {
        throw new ORPCError("NOT_FOUND");
      }

      await assertVisibleOrThrow(context, appraisal.staffProfileId);
      return appraisal;
    }),

  getByStaff: requireRole("appraisal", "read")
    .input(z.object({ staffProfileId: z.string() }))
    .handler(async ({ input, context }) => {
      await assertVisibleOrThrow(context, input.staffProfileId);
      return db.query.appraisals.findMany({
        where: eq(appraisals.staffProfileId, input.staffProfileId),
        with: {
          reviewer: { with: { user: true } },
          teamLead: { with: { user: true } },
          cycle: true,
        },
        orderBy: [desc(appraisals.createdAt)],
      });
    }),

  getOverdue: requireRole("appraisal", "read").handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const caller = await getCallerStaffProfile(context);
    const role = context.userRole ?? "";

    const conditions = [
      sql`${appraisals.scheduledDate} IS NOT NULL`,
      lte(appraisals.scheduledDate, today),
      sql`${appraisals.status} NOT IN ('completed', 'approved', 'rejected')`,
    ];

    if (role !== "admin" && role !== "hrAdminOps") {
      const accessible = new Set(await getManagedStaffIds(context));
      if (caller?.id) {
        accessible.add(caller.id);
      }
      if (accessible.size === 0) {
        return [];
      }
      conditions.push(inArray(appraisals.staffProfileId, [...accessible]));
    }

    return db.query.appraisals.findMany({
      where: and(...conditions),
      with: {
        staffProfile: { with: { user: true, department: true, teamLead: true } },
        reviewer: { with: { user: true } },
        teamLead: { with: { user: true } },
      },
      orderBy: [asc(appraisals.scheduledDate)],
    });
  }),

  create: requireRole("appraisal", "create")
    .input(
      z.object({
        staffProfileId: z.string(),
        cycleId: z.string().optional(),
        reviewerId: z.string().optional(),
        periodStart: z.string(),
        periodEnd: z.string(),
        scheduledDate: z.string().optional(),
        location: z.string().optional(),
        typeOfReview: z.string().optional(),
        objectives: z
          .array(
            z.object({
              title: z.string(),
              rating: z.number().optional(),
              comments: z.string().optional(),
            }),
          )
          .optional(),
        achievements: z.array(z.string()).optional(),
        goals: z.array(z.string()).optional(),
        ratingMatrix: ratingMatrixSchema.optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      await assertVisibleOrThrow(context, input.staffProfileId);

      const staffProfile = await db.query.staffProfiles.findFirst({
        where: eq(staffProfiles.id, input.staffProfileId),
      });
      if (!staffProfile) {
        throw new ORPCError("NOT_FOUND", { message: "Staff profile not found." });
      }

      const [appraisal] = await db
        .insert(appraisals)
        .values({
          cycleId: input.cycleId ?? null,
          staffProfileId: input.staffProfileId,
          reviewerId: input.reviewerId ?? null,
          teamLeadId: staffProfile.teamLeadId ?? null,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          scheduledDate: input.scheduledDate ?? null,
          status: input.scheduledDate ? "scheduled" : "draft",
          objectives: input.objectives ?? null,
          achievements: input.achievements ?? null,
          goals: input.goals ?? null,
          ratingMatrix: input.ratingMatrix ?? null,
          percentageScore: input.ratingMatrix
            ? computePercentage(input.ratingMatrix)
            : null,
          location: input.location ?? null,
          typeOfReview: input.typeOfReview ?? null,
          submittedById: null,
          approvedById: null,
          rejectedById: null,
          rejectionReason: null,
          immutableFrom: null,
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
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
      });

      return fetchAppraisal(appraisal.id);
    }),

  update: requireRole("appraisal", "update")
    .input(
      z.object({
        id: z.string(),
        cycleId: z.string().optional(),
        reviewerId: z.string().optional(),
        scheduledDate: z.string().optional(),
        completedDate: z.string().optional(),
        status: appraisalStatusSchema.optional(),
        overallRating: z.number().min(1).max(5).optional(),
        summary: z.string().optional(),
        location: z.string().optional(),
        typeOfReview: z.string().optional(),
        objectives: z
          .array(
            z.object({
              title: z.string(),
              rating: z.number().optional(),
              comments: z.string().optional(),
            }),
          )
          .optional(),
        achievements: z.array(z.string()).optional(),
        goals: z.array(z.string()).optional(),
        staffFeedback: z.string().optional(),
        supervisorComments: z.string().optional(),
        managerComments: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const { id, ...updates } = input;
      const before = await db.query.appraisals.findFirst({
        where: eq(appraisals.id, id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      if (before.immutableFrom && context.userRole !== "admin" && context.userRole !== "hrAdminOps") {
        throw new ORPCError("CONFLICT", {
          message: "Approved appraisals are immutable.",
        });
      }

      if (!(await canAccessAppraisal(context, before.staffProfileId))) {
        throw new ORPCError("FORBIDDEN");
      }

      const [updated] = await db
        .update(appraisals)
        .set({
          ...updates,
          ratingMatrix: before.ratingMatrix ?? null,
          percentageScore: before.percentageScore ?? null,
        })
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
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
      });

      return fetchAppraisal(id);
    }),

  setRatings: requireRole("appraisal", "update")
    .input(
      z.object({
        id: z.string(),
        ratingMatrix: ratingMatrixSchema,
        achievements: z.array(z.string()).optional(),
        goals: z.array(z.string()).optional(),
        staffFeedback: z.string().optional(),
        supervisorComments: z.string().optional(),
        managerComments: z.string().optional(),
        location: z.string().optional(),
        typeOfReview: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const before = await db.query.appraisals.findFirst({
        where: eq(appraisals.id, input.id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      if (before.immutableFrom && context.userRole !== "admin" && context.userRole !== "hrAdminOps") {
        throw new ORPCError("CONFLICT", {
          message: "Approved appraisals are immutable.",
        });
      }

      if (!(await canAccessAppraisal(context, before.staffProfileId))) {
        throw new ORPCError("FORBIDDEN");
      }

      const [updated] = await db
        .update(appraisals)
        .set({
          ratingMatrix: input.ratingMatrix,
          percentageScore: computePercentage(input.ratingMatrix),
          achievements: input.achievements ?? before.achievements ?? null,
          goals: input.goals ?? before.goals ?? null,
          staffFeedback: input.staffFeedback ?? before.staffFeedback,
          supervisorComments: input.supervisorComments ?? before.supervisorComments,
          managerComments: input.managerComments ?? before.managerComments,
          location: input.location ?? before.location,
          typeOfReview: input.typeOfReview ?? before.typeOfReview,
          updatedAt: new Date(),
        })
        .where(eq(appraisals.id, input.id))
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "appraisal.set_ratings",
        module: "staff",
        resourceType: "appraisal",
        resourceId: input.id,
        beforeValue: before as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
      });

      return fetchAppraisal(input.id);
    }),

  submit: requireRole("appraisal", "submit")
    .input(
      z.object({
        id: z.string(),
        staffFeedback: z.string().optional(),
        supervisorComments: z.string().optional(),
        managerComments: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const before = await db.query.appraisals.findFirst({
        where: eq(appraisals.id, input.id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      if (!(await canAccessAppraisal(context, before.staffProfileId))) {
        throw new ORPCError("FORBIDDEN");
      }

      if (before.status === "approved" || before.status === "rejected") {
        throw new ORPCError("CONFLICT", {
          message: "Approved or rejected appraisals cannot be resubmitted.",
        });
      }

      const now = new Date();
      const [updated] = await db
        .update(appraisals)
        .set({
          status: "submitted",
          submittedAt: now,
          submittedById: context.session.user.id,
          staffFeedback: input.staffFeedback ?? before.staffFeedback,
          supervisorComments: input.supervisorComments ?? before.supervisorComments,
          managerComments: input.managerComments ?? before.managerComments,
          immutableFrom: null,
          updatedAt: now,
        })
        .where(eq(appraisals.id, input.id))
        .returning();

      if (!updated) {
        throw new ORPCError("INTERNAL_SERVER_ERROR");
      }

      await notifyRelatedPeople(
        {
          staffProfileId: updated.staffProfileId,
          reviewerId: updated.reviewerId,
          teamLeadId: updated.teamLeadId,
        },
        "Appraisal submitted",
        `Appraisal for ${updated.staffProfileId} has been submitted for review.`,
        "staff",
        updated.id,
      );

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "appraisal.submit",
        module: "staff",
        resourceType: "appraisal",
        resourceId: input.id,
        beforeValue: before as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
      });

      return fetchAppraisal(input.id);
    }),

  approve: requireRole("appraisal", "approve")
    .input(
      z.object({
        id: z.string(),
        managerComments: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const before = await db.query.appraisals.findFirst({
        where: eq(appraisals.id, input.id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      if (before.status !== "submitted") {
        throw new ORPCError("CONFLICT", {
          message: "Only submitted appraisals can be approved.",
        });
      }

      if (!(await canAccessAppraisal(context, before.staffProfileId))) {
        throw new ORPCError("FORBIDDEN");
      }

      const now = new Date();
      const [updated] = await db
        .update(appraisals)
        .set({
          status: "approved",
          approvedAt: now,
          approvedById: context.session.user.id,
          completedDate: now.toISOString().slice(0, 10),
          immutableFrom: now,
          managerComments: input.managerComments ?? before.managerComments,
          updatedAt: now,
        })
        .where(eq(appraisals.id, input.id))
        .returning();

      if (!updated) {
        throw new ORPCError("INTERNAL_SERVER_ERROR");
      }

      const followups = [
        {
          appraisalId: updated.id,
          followUpType: "three_month" as const,
          dueDate: new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()),
        },
        {
          appraisalId: updated.id,
          followUpType: "six_month" as const,
          dueDate: new Date(now.getFullYear(), now.getMonth() + 6, now.getDate()),
        },
      ];

      await db
        .insert(appraisalFollowups)
        .values(
          followups.map((followUp) => ({
            ...followUp,
            dueDate: followUp.dueDate.toISOString().slice(0, 10),
          })),
        )
        .onConflictDoNothing();

      await notifyRelatedPeople(
        {
          staffProfileId: updated.staffProfileId,
          reviewerId: updated.reviewerId,
          teamLeadId: updated.teamLeadId,
        },
        "Appraisal approved",
        `Appraisal for ${updated.staffProfileId} has been approved.`,
        "staff",
        updated.id,
      );

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "appraisal.approve",
        module: "staff",
        resourceType: "appraisal",
        resourceId: input.id,
        beforeValue: before as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
      });

      return fetchAppraisal(input.id);
    }),

  reject: requireRole("appraisal", "reject")
    .input(
      z.object({
        id: z.string(),
        rejectionReason: z.string().min(1),
      }),
    )
    .handler(async ({ input, context }) => {
      const before = await db.query.appraisals.findFirst({
        where: eq(appraisals.id, input.id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      if (before.status !== "submitted" && before.status !== "in_progress") {
        throw new ORPCError("CONFLICT", {
          message: "Only submitted or in-progress appraisals can be rejected.",
        });
      }

      if (!(await canAccessAppraisal(context, before.staffProfileId))) {
        throw new ORPCError("FORBIDDEN");
      }

      const now = new Date();
      const [updated] = await db
        .update(appraisals)
        .set({
          status: "rejected",
          rejectedAt: now,
          rejectedById: context.session.user.id,
          rejectionReason: input.rejectionReason,
          immutableFrom: now,
          updatedAt: now,
        })
        .where(eq(appraisals.id, input.id))
        .returning();

      if (!updated) throw new ORPCError("INTERNAL_SERVER_ERROR");

      await notifyRelatedPeople(
        {
          staffProfileId: updated.staffProfileId,
          reviewerId: updated.reviewerId,
          teamLeadId: updated.teamLeadId,
        },
        "Appraisal rejected",
        `Appraisal for ${updated.staffProfileId} was rejected.`,
        "staff",
        updated.id,
      );

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "appraisal.reject",
        module: "staff",
        resourceType: "appraisal",
        resourceId: input.id,
        beforeValue: before as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
      });

      return fetchAppraisal(input.id);
    }),
};
