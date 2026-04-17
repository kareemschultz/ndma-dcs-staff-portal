import { ORPCError } from "@orpc/server";
import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import {
  careerPathPlans,
  careerPathYears,
  db,
  performanceJournalEntries,
  promotionLetters,
  promotionRecommendations,
  staffFeedback,
  staffProfiles,
} from "@ndma-dcs-staff-portal/db";

import { requireRole } from "../index";
import { logAudit } from "../lib/audit";
import { canAccessStaffPrivate, getManagedStaffIds } from "../lib/scope";
import { createNotification } from "../lib/notify";

async function assertStaffAccess(context: Parameters<typeof canAccessStaffPrivate>[0], staffProfileId: string) {
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
    resourceType: "staff",
    resourceId,
  });
}

export const hrDocsRouter = {
  promotionRecommendations: {
    list: requireRole("career_path", "read").handler(async ({ context }) => {
      const role = context.userRole ?? "";
      if (role === "admin" || role === "hrAdminOps") {
        return db.query.promotionRecommendations.findMany({
          with: {
            staffProfile: { with: { user: true, department: true } },
            appraisal: true,
          },
          orderBy: [desc(promotionRecommendations.createdAt)],
        });
      }

      const managed = await getManagedStaffIds(context);
      if (managed.length === 0) {
        return [];
      }

      return db.query.promotionRecommendations.findMany({
        where: inArray(promotionRecommendations.staffProfileId, managed),
        with: {
          staffProfile: { with: { user: true, department: true } },
          appraisal: true,
        },
        orderBy: [desc(promotionRecommendations.createdAt)],
      });
    }),

    get: requireRole("career_path", "read")
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const recommendation = await db.query.promotionRecommendations.findFirst({
          where: eq(promotionRecommendations.id, input.id),
          with: {
            staffProfile: { with: { user: true, department: true } },
            appraisal: true,
          },
        });
        if (!recommendation) {
          throw new ORPCError("NOT_FOUND");
        }

        await assertStaffAccess(context, recommendation.staffProfileId);
        return recommendation;
      }),

    create: requireRole("career_path", "update")
      .input(
        z.object({
          staffProfileId: z.string(),
          appraisalId: z.string().optional(),
          reason: z.string().optional(),
          details: z.string().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        await assertStaffAccess(context, input.staffProfileId);

        const [row] = await db
          .insert(promotionRecommendations)
          .values({
            staffProfileId: input.staffProfileId,
            appraisalId: input.appraisalId ?? null,
            requestedById: context.session.user.id,
            reason: input.reason ?? null,
            details: input.details ?? null,
            status: "draft",
          })
          .returning();
        if (!row) {
          throw new ORPCError("INTERNAL_SERVER_ERROR");
        }

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          actorRole: context.userRole ?? undefined,
          action: "promotion_recommendation.create",
          module: "staff",
          resourceType: "promotion_recommendation",
          resourceId: row.id,
          afterValue: row as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          correlationId: context.requestId,
        });

        return row;
      }),

    submit: requireRole("career_path", "update")
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const before = await db.query.promotionRecommendations.findFirst({
          where: eq(promotionRecommendations.id, input.id),
        });
        if (!before) throw new ORPCError("NOT_FOUND");

        await assertStaffAccess(context, before.staffProfileId);

        const [row] = await db
          .update(promotionRecommendations)
          .set({
            status: "submitted",
            submittedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(promotionRecommendations.id, input.id))
          .returning();

        await notifyStaff(
          before.staffProfileId,
          "Promotion recommendation submitted",
          "A promotion recommendation has been submitted for review.",
          "staff",
          before.id,
        );

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          actorRole: context.userRole ?? undefined,
          action: "promotion_recommendation.submit",
          module: "staff",
          resourceType: "promotion_recommendation",
          resourceId: before.id,
          beforeValue: before as Record<string, unknown>,
          afterValue: row as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          correlationId: context.requestId,
        });

        return row;
      }),

    approve: requireRole("career_path", "update")
      .input(z.object({ id: z.string(), reviewNotes: z.string().optional() }))
      .handler(async ({ input, context }) => {
        const before = await db.query.promotionRecommendations.findFirst({
          where: eq(promotionRecommendations.id, input.id),
        });
        if (!before) throw new ORPCError("NOT_FOUND");

        const [row] = await db
          .update(promotionRecommendations)
          .set({
            status: "approved",
            reviewedById: context.session.user.id,
            reviewedAt: new Date(),
            approvedById: context.session.user.id,
            approvedAt: new Date(),
            reviewNotes: input.reviewNotes ?? before.reviewNotes,
            updatedAt: new Date(),
          })
          .where(eq(promotionRecommendations.id, input.id))
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          actorRole: context.userRole ?? undefined,
          action: "promotion_recommendation.approve",
          module: "staff",
          resourceType: "promotion_recommendation",
          resourceId: before.id,
          beforeValue: before as Record<string, unknown>,
          afterValue: row as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          correlationId: context.requestId,
        });

        return row;
      }),

    reject: requireRole("career_path", "update")
      .input(z.object({ id: z.string(), rejectionReason: z.string().min(1) }))
      .handler(async ({ input, context }) => {
        const before = await db.query.promotionRecommendations.findFirst({
          where: eq(promotionRecommendations.id, input.id),
        });
        if (!before) throw new ORPCError("NOT_FOUND");

        const [row] = await db
          .update(promotionRecommendations)
          .set({
            status: "rejected",
            reviewedById: context.session.user.id,
            reviewedAt: new Date(),
            rejectionReason: input.rejectionReason,
            updatedAt: new Date(),
          })
          .where(eq(promotionRecommendations.id, input.id))
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          actorRole: context.userRole ?? undefined,
          action: "promotion_recommendation.reject",
          module: "staff",
          resourceType: "promotion_recommendation",
          resourceId: before.id,
          beforeValue: before as Record<string, unknown>,
          afterValue: row as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          correlationId: context.requestId,
        });

        return row;
      }),
  },

  promotionLetters: {
    list: requireRole("promotion_letter", "read").handler(async ({ context }) => {
      const role = context.userRole ?? "";
      if (role === "admin" || role === "hrAdminOps") {
        return db.query.promotionLetters.findMany({
          with: {
            recommendation: true,
            staffProfile: { with: { user: true, department: true } },
          },
          orderBy: [desc(promotionLetters.createdAt)],
        });
      }

      const managed = await getManagedStaffIds(context);
      if (managed.length === 0) {
        return [];
      }

      return db.query.promotionLetters.findMany({
        where: inArray(promotionLetters.staffProfileId, managed),
        with: {
          recommendation: true,
          staffProfile: { with: { user: true, department: true } },
        },
        orderBy: [desc(promotionLetters.createdAt)],
      });
    }),

    get: requireRole("promotion_letter", "read")
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const letter = await db.query.promotionLetters.findFirst({
          where: eq(promotionLetters.id, input.id),
          with: {
            recommendation: true,
            staffProfile: { with: { user: true, department: true } },
          },
        });
        if (!letter) throw new ORPCError("NOT_FOUND");

        await assertStaffAccess(context, letter.staffProfileId);
        return letter;
      }),

    create: requireRole("promotion_letter", "create")
      .input(
        z.object({
          recommendationId: z.string(),
          title: z.string().min(1),
          body: z.string().min(1),
          letterNumber: z.string().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const recommendation = await db.query.promotionRecommendations.findFirst({
          where: eq(promotionRecommendations.id, input.recommendationId),
        });
        if (!recommendation) {
          throw new ORPCError("NOT_FOUND");
        }
        if (recommendation.status !== "approved") {
          throw new ORPCError("CONFLICT", {
            message: "Approved recommendation required before issuing a letter.",
          });
        }

        const [row] = await db
          .insert(promotionLetters)
          .values({
            recommendationId: input.recommendationId,
            staffProfileId: recommendation.staffProfileId,
            issuedById: context.session.user.id,
            title: input.title,
            body: input.body,
            letterNumber: input.letterNumber ?? null,
            status: "issued",
            issuedAt: new Date(),
          })
          .returning();
        if (!row) {
          throw new ORPCError("INTERNAL_SERVER_ERROR");
        }

        await notifyStaff(
          recommendation.staffProfileId,
          "Promotion letter issued",
          "A promotion letter has been issued for your record.",
          "staff",
          row.id,
        );

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          actorRole: context.userRole ?? undefined,
          action: "promotion_letter.create",
          module: "staff",
          resourceType: "promotion_letter",
          resourceId: row.id,
          afterValue: row as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          correlationId: context.requestId,
        });

        return row;
      }),
  },

  performanceJournal: {
    list: requireRole("performance_journal", "read")
      .input(z.object({ staffProfileId: z.string().optional() }))
      .handler(async ({ input, context }) => {
        const role = context.userRole ?? "";
        if (input.staffProfileId) {
          await assertStaffAccess(context, input.staffProfileId);
          return db.query.performanceJournalEntries.findMany({
            where: eq(performanceJournalEntries.staffProfileId, input.staffProfileId),
            orderBy: [desc(performanceJournalEntries.entryDate)],
            with: { staffProfile: { with: { user: true } }, author: true, appraisal: true },
          });
        }

        if (role !== "admin" && role !== "hrAdminOps") {
          const managed = await getManagedStaffIds(context);
          if (managed.length === 0) {
            return [];
          }
          return db.query.performanceJournalEntries.findMany({
            where: inArray(performanceJournalEntries.staffProfileId, managed),
            orderBy: [desc(performanceJournalEntries.entryDate)],
            with: { staffProfile: { with: { user: true } }, author: true, appraisal: true },
          });
        }

        return db.query.performanceJournalEntries.findMany({
          orderBy: [desc(performanceJournalEntries.entryDate)],
          with: { staffProfile: { with: { user: true } }, author: true, appraisal: true },
        });
      }),

    append: requireRole("performance_journal", "create")
      .input(
        z.object({
          staffProfileId: z.string(),
          appraisalId: z.string().optional(),
          linkedEntryId: z.string().optional(),
          entryType: z.enum(["note", "achievement", "concern", "amendment"]).default("note"),
          body: z.string().min(1),
          visibleToStaff: z.boolean().default(false),
          entryDate: z.string(),
        }),
      )
      .handler(async ({ input, context }) => {
        await assertStaffAccess(context, input.staffProfileId);

        const [row] = await db
          .insert(performanceJournalEntries)
          .values({
            staffProfileId: input.staffProfileId,
            appraisalId: input.appraisalId ?? null,
            linkedEntryId: input.linkedEntryId ?? null,
            authorId: context.session.user.id,
            entryType: input.entryType,
            body: input.body,
            visibleToStaff: input.visibleToStaff,
            entryDate: input.entryDate,
          })
          .returning();

        if (!row) throw new ORPCError("INTERNAL_SERVER_ERROR");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          actorRole: context.userRole ?? undefined,
          action: "performance_journal.append",
          module: "staff",
          resourceType: "performance_journal_entry",
          resourceId: row.id,
          afterValue: row as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          correlationId: context.requestId,
        });

        return row;
      }),
  },

  careerPath: {
    list: requireRole("career_path", "read").handler(async ({ context }) => {
      const role = context.userRole ?? "";
      if (role === "admin" || role === "hrAdminOps") {
        return db.query.careerPathPlans.findMany({
          with: { staffProfile: { with: { user: true, department: true } }, years: true },
          orderBy: [desc(careerPathPlans.createdAt)],
        });
      }

      const managed = await getManagedStaffIds(context);
      if (managed.length === 0) {
        return [];
      }

      return db.query.careerPathPlans.findMany({
        where: inArray(careerPathPlans.staffProfileId, managed),
        with: { staffProfile: { with: { user: true, department: true } }, years: true },
        orderBy: [desc(careerPathPlans.createdAt)],
      });
    }),

    create: requireRole("career_path", "update")
      .input(
        z.object({
          staffProfileId: z.string(),
          currentLevel: z.string().min(1),
          targetLevel: z.string().optional(),
          currentTrack: z.string().optional(),
          nextReviewDate: z.string().optional(),
          notes: z.string().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        await assertStaffAccess(context, input.staffProfileId);

        const [row] = await db
          .insert(careerPathPlans)
          .values({
            staffProfileId: input.staffProfileId,
            createdById: context.session.user.id,
            currentLevel: input.currentLevel,
            targetLevel: input.targetLevel ?? null,
            currentTrack: input.currentTrack ?? null,
            nextReviewDate: input.nextReviewDate ?? null,
            notes: input.notes ?? null,
          })
          .returning();

        if (!row) throw new ORPCError("INTERNAL_SERVER_ERROR");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          actorRole: context.userRole ?? undefined,
          action: "career_path.create",
          module: "staff",
          resourceType: "career_path_plan",
          resourceId: row.id,
          afterValue: row as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          correlationId: context.requestId,
        });

        return row;
      }),

    addYear: requireRole("career_path", "update")
      .input(
        z.object({
          careerPathPlanId: z.string(),
          yearNumber: z.number().int().min(1).max(20),
          title: z.string().min(1),
          goals: z.array(z.string()).default([]),
          prerequisites: z.array(z.string()).default([]),
        }),
      )
      .handler(async ({ input, context }) => {
        const plan = await db.query.careerPathPlans.findFirst({
          where: eq(careerPathPlans.id, input.careerPathPlanId),
        });
        if (!plan) throw new ORPCError("NOT_FOUND");

        await assertStaffAccess(context, plan.staffProfileId);

        const [row] = await db
          .insert(careerPathYears)
          .values({
            careerPathPlanId: input.careerPathPlanId,
            yearNumber: input.yearNumber,
            title: input.title,
            goals: input.goals,
            prerequisites: input.prerequisites,
          })
          .returning();

        return row;
      }),
  },

  feedback: {
    list: requireRole("feedback", "read")
      .input(z.object({ staffProfileId: z.string().optional() }))
      .handler(async ({ input, context }) => {
        const role = context.userRole ?? "";
        if (input.staffProfileId) {
          await assertStaffAccess(context, input.staffProfileId);
          return db.query.staffFeedback.findMany({
            where: eq(staffFeedback.staffProfileId, input.staffProfileId),
            with: { staffProfile: { with: { user: true } }, author: true, appraisal: true },
            orderBy: [desc(staffFeedback.submittedAt)],
          });
        }

        if (role !== "admin" && role !== "hrAdminOps") {
          const managed = await getManagedStaffIds(context);
          if (managed.length === 0) {
            return [];
          }
          return db.query.staffFeedback.findMany({
            where: inArray(staffFeedback.staffProfileId, managed),
            with: { staffProfile: { with: { user: true } }, author: true, appraisal: true },
            orderBy: [desc(staffFeedback.submittedAt)],
          });
        }

        return db.query.staffFeedback.findMany({
          with: { staffProfile: { with: { user: true } }, author: true, appraisal: true },
          orderBy: [desc(staffFeedback.submittedAt)],
        });
      }),

    create: requireRole("feedback", "create")
      .input(
        z.object({
          staffProfileId: z.string(),
          appraisalId: z.string().optional(),
          category: z.string().min(1),
          rating: z.number().int().min(1).max(5).optional(),
          comments: z.string().min(1),
        }),
      )
      .handler(async ({ input, context }) => {
        await assertStaffAccess(context, input.staffProfileId);
        const [row] = await db
          .insert(staffFeedback)
          .values({
            staffProfileId: input.staffProfileId,
            appraisalId: input.appraisalId ?? null,
            authorId: context.session.user.id,
            category: input.category,
            rating: input.rating ?? null,
            comments: input.comments,
            status: "submitted",
          })
          .returning();

        if (!row) throw new ORPCError("INTERNAL_SERVER_ERROR");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          actorRole: context.userRole ?? undefined,
          action: "feedback.create",
          module: "staff",
          resourceType: "staff_feedback",
          resourceId: row.id,
          afterValue: row as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          correlationId: context.requestId,
        });

        return row;
      }),

    updateStatus: requireRole("feedback", "update")
      .input(
        z.object({
          id: z.string(),
          status: z.enum(["draft", "submitted", "reviewed", "closed"]),
        }),
      )
      .handler(async ({ input, context }) => {
        const before = await db.query.staffFeedback.findFirst({
          where: eq(staffFeedback.id, input.id),
        });
        if (!before) throw new ORPCError("NOT_FOUND");

        await assertStaffAccess(context, before.staffProfileId);

        const [row] = await db
          .update(staffFeedback)
          .set({
            status: input.status,
            reviewedAt: input.status === "reviewed" || input.status === "closed" ? new Date() : before.reviewedAt,
            reviewedById: input.status === "reviewed" || input.status === "closed" ? context.session.user.id : before.reviewedById,
            updatedAt: new Date(),
          })
          .where(eq(staffFeedback.id, input.id))
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          actorRole: context.userRole ?? undefined,
          action: "feedback.update_status",
          module: "staff",
          resourceType: "staff_feedback",
          resourceId: input.id,
          beforeValue: before as Record<string, unknown>,
          afterValue: row as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          correlationId: context.requestId,
        });

        return row;
      }),
  },
};
