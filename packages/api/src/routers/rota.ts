import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db } from "@ndma-dcs-staff-portal/db";
import {
  onCallSchedules,
  onCallAssignments,
  onCallSwaps,
  onCallOverrides,
  assignmentHistory,
  staffProfiles,
  departments,
} from "@ndma-dcs-staff-portal/db";
import { eq, desc, asc, and, gte, lte } from "drizzle-orm";
import { protectedProcedure } from "../index";
import { logAudit } from "../lib/audit";

// ── Input Schemas ──────────────────────────────────────────────────────────
const OnCallRoleSchema = z.enum([
  "lead_engineer",
  "asn_support",
  "core_support",
  "enterprise_support",
]);

const CreateScheduleInput = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  notes: z.string().optional(),
});

const AssignStaffInput = z.object({
  scheduleId: z.string(),
  staffProfileId: z.string(),
  role: OnCallRoleSchema,
});

const RemoveAssignmentInput = z.object({
  assignmentId: z.string(),
});

const PublishScheduleInput = z.object({
  scheduleId: z.string(),
});

const RequestSwapInput = z.object({
  assignmentId: z.string(),
  targetStaffProfileId: z.string(),
  reason: z.string().optional(),
});

const ReviewSwapInput = z.object({
  swapId: z.string(),
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional(),
});

const HistoryFilterInput = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  staffProfileId: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
});

// ── Helper: compute ISO week Sunday from Monday ────────────────────────────
function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

// ── Helper: log history event ──────────────────────────────────────────────
async function logHistory(params: {
  scheduleId: string;
  assignmentId?: string;
  staffProfileId?: string;
  role?: string;
  action: string;
  performedById: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(assignmentHistory).values({
    scheduleId: params.scheduleId,
    assignmentId: params.assignmentId,
    staffProfileId: params.staffProfileId,
    role: params.role as
      | "lead_engineer"
      | "asn_support"
      | "core_support"
      | "enterprise_support"
      | undefined,
    action: params.action,
    performedById: params.performedById,
    metadata: params.metadata ?? {},
  });
}

// ── Router ─────────────────────────────────────────────────────────────────
export const rotaRouter = {
  // Get the currently published (active) schedule
  getCurrent: protectedProcedure.handler(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const schedule = await db.query.onCallSchedules.findFirst({
      where: and(
        eq(onCallSchedules.status, "published"),
        lte(onCallSchedules.weekStart, today),
        gte(onCallSchedules.weekEnd, today),
      ),
      with: {
        assignments: {
          with: {
            staffProfile: { with: { user: true, department: true } },
          },
        },
      },
    });
    return schedule ?? null;
  }),

  // Get upcoming published schedules (next 4 weeks)
  getUpcoming: protectedProcedure.handler(async () => {
    const today = new Date().toISOString().slice(0, 10);
    return db.query.onCallSchedules.findMany({
      where: and(
        eq(onCallSchedules.status, "published"),
        gte(onCallSchedules.weekStart, today),
      ),
      orderBy: asc(onCallSchedules.weekStart),
      limit: 4,
      with: {
        assignments: {
          with: {
            staffProfile: { with: { user: true, department: true } },
          },
        },
      },
    });
  }),

  // Get all schedules (drafts + published) for the planner view
  list: protectedProcedure.handler(async () => {
    return db.query.onCallSchedules.findMany({
      orderBy: desc(onCallSchedules.weekStart),
      limit: 12,
      with: {
        assignments: {
          with: {
            staffProfile: { with: { user: true, department: true } },
          },
        },
      },
    });
  }),

  // Create a new draft schedule for a given week
  create: protectedProcedure
    .input(CreateScheduleInput)
    .handler(async ({ input, context }) => {
      const weekEnd = getWeekEnd(input.weekStart);

      const existing = await db.query.onCallSchedules.findFirst({
        where: eq(onCallSchedules.weekStart, input.weekStart),
      });
      if (existing) {
        throw new ORPCError("CONFLICT", {
          message: "Schedule already exists for this week",
        });
      }

      const [schedule] = await db
        .insert(onCallSchedules)
        .values({ weekStart: input.weekStart, weekEnd, notes: input.notes, status: "draft" })
        .returning();
      if (!schedule) throw new ORPCError("INTERNAL_SERVER_ERROR");

      await logHistory({
        scheduleId: schedule.id,
        action: "created",
        performedById: context.session.user.id,
      });

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "rota.schedule.create",
        module: "rota",
        resourceType: "on_call_schedule",
        resourceId: schedule.id,
        afterValue: schedule as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return schedule;
    }),

  // Assign a staff member to a role in a draft schedule
  assign: protectedProcedure
    .input(AssignStaffInput)
    .handler(async ({ input, context }) => {
      const schedule = await db.query.onCallSchedules.findFirst({
        where: eq(onCallSchedules.id, input.scheduleId),
      });
      if (!schedule) throw new ORPCError("NOT_FOUND", { message: "Schedule not found" });
      if (schedule.status !== "draft") {
        throw new ORPCError("FORBIDDEN", {
          message: "Cannot modify a published or archived schedule",
        });
      }

      // Replace any existing assignment for this role
      await db.delete(onCallAssignments).where(
        and(
          eq(onCallAssignments.scheduleId, input.scheduleId),
          eq(onCallAssignments.role, input.role),
        ),
      );

      const [assignment] = await db
        .insert(onCallAssignments)
        .values({
          scheduleId: input.scheduleId,
          staffProfileId: input.staffProfileId,
          role: input.role,
        })
        .returning();
      if (!assignment) throw new ORPCError("INTERNAL_SERVER_ERROR");

      await logHistory({
        scheduleId: input.scheduleId,
        assignmentId: assignment.id,
        staffProfileId: input.staffProfileId,
        role: input.role,
        action: "assigned",
        performedById: context.session.user.id,
      });

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "rota.assignment.assign",
        module: "rota",
        resourceType: "on_call_assignment",
        resourceId: assignment.id,
        afterValue: { scheduleId: input.scheduleId, staffProfileId: input.staffProfileId, role: input.role },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return assignment;
    }),

  // Remove an assignment from a draft schedule
  removeAssignment: protectedProcedure
    .input(RemoveAssignmentInput)
    .handler(async ({ input, context }) => {
      const existing = await db.query.onCallAssignments.findFirst({
        where: eq(onCallAssignments.id, input.assignmentId),
        with: { schedule: true },
      });
      if (!existing) throw new ORPCError("NOT_FOUND");
      if (existing.schedule.status !== "draft") {
        throw new ORPCError("FORBIDDEN", {
          message: "Cannot modify a published schedule",
        });
      }

      await db
        .delete(onCallAssignments)
        .where(eq(onCallAssignments.id, input.assignmentId));

      await logHistory({
        scheduleId: existing.scheduleId,
        staffProfileId: existing.staffProfileId,
        role: existing.role,
        action: "removed",
        performedById: context.session.user.id,
      });

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "rota.assignment.remove",
        module: "rota",
        resourceType: "on_call_assignment",
        resourceId: input.assignmentId,
        beforeValue: { scheduleId: existing.scheduleId, staffProfileId: existing.staffProfileId, role: existing.role },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return { success: true };
    }),

  // Publish a schedule — validates all 4 roles are filled first
  publish: protectedProcedure
    .input(PublishScheduleInput)
    .handler(async ({ input, context }) => {
      const schedule = await db.query.onCallSchedules.findFirst({
        where: eq(onCallSchedules.id, input.scheduleId),
        with: { assignments: true },
      });
      if (!schedule) throw new ORPCError("NOT_FOUND");
      if (schedule.status !== "draft") {
        throw new ORPCError("CONFLICT", { message: "Schedule is not in draft status" });
      }

      const roles = schedule.assignments.map((a) => a.role);
      const requiredRoles = [
        "lead_engineer",
        "asn_support",
        "core_support",
        "enterprise_support",
      ] as const;
      const missingRoles = requiredRoles.filter((r) => !roles.includes(r));
      if (missingRoles.length > 0) {
        throw new ORPCError("UNPROCESSABLE_CONTENT", {
          message: `Missing roles: ${missingRoles.join(", ")}`,
        });
      }

      const [published] = await db
        .update(onCallSchedules)
        .set({
          status: "published",
          publishedAt: new Date(),
          publishedById: context.session.user.id,
        })
        .where(eq(onCallSchedules.id, input.scheduleId))
        .returning();
      if (!published) throw new ORPCError("INTERNAL_SERVER_ERROR");

      await logHistory({
        scheduleId: input.scheduleId,
        action: "published",
        performedById: context.session.user.id,
      });

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "rota.schedule.publish",
        module: "rota",
        resourceType: "on_call_schedule",
        resourceId: input.scheduleId,
        afterValue: { status: "published", publishedAt: published.publishedAt },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return published;
    }),

  // Get eligible staff for a role (used by assign modal + rotation engine)
  getEligibleStaff: protectedProcedure
    .input(z.object({ role: OnCallRoleSchema }))
    .handler(async ({ input }) => {
      const departmentCodeMap: Record<string, string> = {
        asn_support: "ASN",
        core_support: "CORE",
        enterprise_support: "ENT",
      };

      if (input.role === "lead_engineer") {
        return db.query.staffProfiles.findMany({
          where: and(
            eq(staffProfiles.isLeadEngineerEligible, true),
            eq(staffProfiles.isOnCallEligible, true),
            eq(staffProfiles.status, "active"),
          ),
          with: { user: true, department: true },
        });
      }

      const deptCode = departmentCodeMap[input.role] ?? "";
      return db
        .select()
        .from(staffProfiles)
        .innerJoin(departments, eq(staffProfiles.departmentId, departments.id))
        .where(
          and(
            eq(departments.code, deptCode),
            eq(staffProfiles.isOnCallEligible, true),
            eq(staffProfiles.status, "active"),
          ),
        );
    }),

  // Assignment counts per person — used by workload cards + rotation engine
  getAssignmentCounts: protectedProcedure.handler(async () => {
    const all = await db.query.onCallAssignments.findMany({
      with: { staffProfile: { with: { user: true } } },
    });
    const counts: Record<
      string,
      { name: string; total: number; byRole: Record<string, number> }
    > = {};
    for (const a of all) {
      const id = a.staffProfileId;
      if (!counts[id]) {
        counts[id] = { name: a.staffProfile.user.name, total: 0, byRole: {} };
      }
      counts[id].total++;
      counts[id].byRole[a.role] = (counts[id].byRole[a.role] ?? 0) + 1;
    }
    return Object.entries(counts).map(([id, data]) => ({
      staffProfileId: id,
      ...data,
    }));
  }),

  // ── Swap sub-router ────────────────────────────────────────────────────
  swap: {
    request: protectedProcedure
      .input(RequestSwapInput)
      .handler(async ({ input, context }) => {
        const assignment = await db.query.onCallAssignments.findFirst({
          where: eq(onCallAssignments.id, input.assignmentId),
          with: { schedule: true },
        });
        if (!assignment) throw new ORPCError("NOT_FOUND");
        if (assignment.schedule.status !== "published") {
          throw new ORPCError("FORBIDDEN", {
            message: "Can only swap published assignments",
          });
        }

        const requesterProfile = await db.query.staffProfiles.findFirst({
          where: eq(staffProfiles.userId, context.session.user.id),
        });
        if (!requesterProfile) {
          throw new ORPCError("NOT_FOUND", { message: "Staff profile not found" });
        }

        const [swap] = await db
          .insert(onCallSwaps)
          .values({
            assignmentId: input.assignmentId,
            requesterId: requesterProfile.id,
            targetId: input.targetStaffProfileId,
            reason: input.reason,
          })
          .returning();
        if (!swap) throw new ORPCError("INTERNAL_SERVER_ERROR");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: "rota.swap.request",
          module: "rota",
          resourceType: "on_call_swap",
          resourceId: swap.id,
          afterValue: { assignmentId: input.assignmentId, targetStaffProfileId: input.targetStaffProfileId },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return swap;
      }),

    review: protectedProcedure
      .input(ReviewSwapInput)
      .handler(async ({ input, context }) => {
        const swap = await db.query.onCallSwaps.findFirst({
          where: eq(onCallSwaps.id, input.swapId),
          with: { assignment: { with: { schedule: true } } },
        });
        if (!swap) throw new ORPCError("NOT_FOUND");
        if (swap.status !== "pending") {
          throw new ORPCError("CONFLICT", { message: "Swap is no longer pending" });
        }

        if (input.action === "approve") {
          await db
            .update(onCallAssignments)
            .set({ staffProfileId: swap.targetId, updatedAt: new Date() })
            .where(eq(onCallAssignments.id, swap.assignmentId));

          await logHistory({
            scheduleId: swap.assignment.scheduleId,
            assignmentId: swap.assignmentId,
            staffProfileId: swap.targetId,
            role: swap.assignment.role,
            action: "swapped",
            performedById: context.session.user.id,
            metadata: { swapId: swap.id, fromStaff: swap.requesterId },
          });
        }

        const [updated] = await db
          .update(onCallSwaps)
          .set({
            status: input.action === "approve" ? "approved" : "rejected",
            reviewedById: context.session.user.id,
            reviewedAt: new Date(),
            reviewNotes: input.notes,
          })
          .where(eq(onCallSwaps.id, input.swapId))
          .returning();
        if (!updated) throw new ORPCError("INTERNAL_SERVER_ERROR");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          action: `rota.swap.${input.action}`,
          module: "rota",
          resourceType: "on_call_swap",
          resourceId: input.swapId,
          afterValue: { status: updated.status, reviewNotes: input.notes },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return updated;
      }),

    list: protectedProcedure
      .input(
        z.object({
          status: z
            .enum(["pending", "approved", "rejected", "cancelled"])
            .optional(),
        }),
      )
      .handler(async ({ input }) => {
        return db.query.onCallSwaps.findMany({
          where: input.status
            ? eq(onCallSwaps.status, input.status)
            : undefined,
          orderBy: desc(onCallSwaps.createdAt),
          with: {
            assignment: {
              with: {
                schedule: true,
                staffProfile: { with: { user: true } },
              },
            },
            requester: { with: { user: true } },
            target: { with: { user: true } },
          },
        });
      }),
  },

  // Resolve effective on-call for a given date, applying any active overrides
  getEffectiveOnCall: protectedProcedure
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
    .handler(async ({ input }) => {
      const schedule = await db.query.onCallSchedules.findFirst({
        where: and(
          eq(onCallSchedules.status, "published"),
          lte(onCallSchedules.weekStart, input.date),
          gte(onCallSchedules.weekEnd, input.date),
        ),
        with: {
          assignments: {
            with: { staffProfile: { with: { user: true, department: true } } },
          },
        },
      });

      if (!schedule) return null;

      // Fetch all overrides active on this date for this schedule
      const overrides = await db.query.onCallOverrides.findMany({
        where: and(
          eq(onCallOverrides.scheduleId, schedule.id),
          lte(onCallOverrides.startDate, input.date),
          gte(onCallOverrides.endDate, input.date),
        ),
        with: {
          overrideStaff: { with: { user: true, department: true } },
        },
      });

      // Apply overrides: replace originalStaffId with overrideStaff for the role
      const effectiveAssignments = schedule.assignments.map((a) => {
        const override = overrides.find(
          (o) => o.originalStaffId === a.staffProfileId && o.role === a.role,
        );
        if (override) {
          return { ...a, staffProfile: override.overrideStaff, overridden: true, overrideReason: override.reason };
        }
        return { ...a, overridden: false };
      });

      return { ...schedule, assignments: effectiveAssignments };
    }),

  // Assignment history with optional filters
  history: protectedProcedure
    .input(HistoryFilterInput)
    .handler(async ({ input }) => {
      return db.query.assignmentHistory.findMany({
        where: input.staffProfileId
          ? eq(assignmentHistory.staffProfileId, input.staffProfileId)
          : undefined,
        orderBy: desc(assignmentHistory.createdAt),
        limit: input.limit,
        with: {
          staffProfile: { with: { user: true } },
          schedule: true,
        },
      });
    }),
};
