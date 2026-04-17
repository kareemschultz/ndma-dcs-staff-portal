import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db, staffProfiles, departments } from "@ndma-dcs-staff-portal/db";
import { and, desc, eq } from "drizzle-orm";

import { protectedProcedure, requireRole } from "../index";
import { logAudit } from "../lib/audit";
import {
  canAccessStaffPrivate,
  getDirectReports,
  getCallerStaffProfile,
} from "../lib/scope";

export const staffRouter = {
  list: requireRole("staff", "read")
    .input(
      z.object({
        departmentId: z.string().optional(),
        status: z
          .enum(["active", "inactive", "on_leave", "terminated"])
          .optional(),
        limit: z.number().min(1).max(200).default(100),
        offset: z.number().min(0).default(0),
      }),
    )
    .handler(async ({ input }) => {
      const conditions = [];
      if (input.status) conditions.push(eq(staffProfiles.status, input.status));
      if (input.departmentId)
        conditions.push(eq(staffProfiles.departmentId, input.departmentId));

      return db.query.staffProfiles.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: desc(staffProfiles.createdAt),
        limit: input.limit,
        offset: input.offset,
        with: { user: true, department: true },
      });
    }),

  get: requireRole("staff", "read")
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const profile = await db.query.staffProfiles.findFirst({
        where: eq(staffProfiles.id, input.id),
        with: { user: true, department: true },
      });
      if (!profile) throw new ORPCError("NOT_FOUND");
      return profile;
    }),

  create: requireRole("staff", "create")
    .input(
      z.object({
        userId: z.string(),
        employeeId: z.string().min(1),
        departmentId: z.string(),
        jobTitle: z.string().min(1),
        employmentType: z
          .enum(["full_time", "part_time", "contract", "temporary"])
          .default("full_time"),
        startDate: z.string(), // ISO date string
        isTeamLead: z.boolean().default(false),
        isLeadEngineerEligible: z.boolean().default(false),
        isOnCallEligible: z.boolean().default(true),
      }),
    )
    .handler(async ({ input, context }) => {
      const [profile] = await db
        .insert(staffProfiles)
        .values({
          ...input,
          startDate: new Date(input.startDate),
        })
        .returning();
      if (!profile) throw new ORPCError("INTERNAL_SERVER_ERROR");

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "staff.create",
        module: "staff",
        resourceType: "staff_profile",
        resourceId: profile.id,
        afterValue: profile as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
      });

      return profile;
    }),

  update: requireRole("staff", "update")
    .input(
      z.object({
        id: z.string(),
        departmentId: z.string().optional(),
        jobTitle: z.string().min(1).optional(),
        employmentType: z
          .enum(["full_time", "part_time", "contract", "temporary"])
          .optional(),
        status: z
          .enum(["active", "inactive", "on_leave", "terminated"])
          .optional(),
        isTeamLead: z.boolean().optional(),
        isLeadEngineerEligible: z.boolean().optional(),
        isOnCallEligible: z.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const { id, ...updates } = input;
      const before = await db.query.staffProfiles.findFirst({
        where: eq(staffProfiles.id, id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      const [updated] = await db
        .update(staffProfiles)
        .set(updates)
        .where(eq(staffProfiles.id, id))
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "staff.update",
        module: "staff",
        resourceType: "staff_profile",
        resourceId: id,
        beforeValue: before as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
      });

      return updated;
    }),

  deactivate: requireRole("staff", "delete")
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const before = await db.query.staffProfiles.findFirst({
        where: eq(staffProfiles.id, input.id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      const [updated] = await db
        .update(staffProfiles)
        .set({ status: "terminated" })
        .where(eq(staffProfiles.id, input.id))
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "staff.deactivate",
        module: "staff",
        resourceType: "staff_profile",
        resourceId: input.id,
        beforeValue: { status: before.status },
        afterValue: { status: "terminated" },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
      });

      return updated;
    }),

  setTeamLead: requireRole("staff", "update")
    .input(
      z.object({
        id: z.string(),
        teamLeadId: z.string().nullable(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (
        !["manager", "hrAdminOps", "admin"].includes(
          context.userRole ?? "",
        )
      ) {
        throw new ORPCError("FORBIDDEN", {
          message: "Only managers and HR/admin can reassign team leads.",
        });
      }

      const before = await db.query.staffProfiles.findFirst({
        where: eq(staffProfiles.id, input.id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      if (input.teamLeadId === before.id) {
        throw new ORPCError("CONFLICT", {
          message: "A staff member cannot be their own team lead.",
        });
      }

      if (input.teamLeadId) {
        const teamLead = await db.query.staffProfiles.findFirst({
          where: eq(staffProfiles.id, input.teamLeadId),
        });
        if (!teamLead) {
          throw new ORPCError("NOT_FOUND", {
            message: "Team lead staff profile not found.",
          });
        }
      }

      const [updated] = await db
        .update(staffProfiles)
        .set({
          teamLeadId: input.teamLeadId,
          updatedAt: new Date(),
        })
        .where(eq(staffProfiles.id, input.id))
        .returning();

      if (!updated) {
        throw new ORPCError("INTERNAL_SERVER_ERROR");
      }

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "staff.team_lead.update",
        module: "staff",
        resourceType: "staff_profile",
        resourceId: input.id,
        beforeValue: before as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
      });

      return updated;
    }),

  canAccessPrivate: requireRole("staff", "read")
    .input(z.object({ staffProfileId: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      return {
        allowed: await canAccessStaffPrivate(context, input.staffProfileId),
      };
    }),

  getMyDirectReports: requireRole("staff", "read").handler(async ({ context }) => {
    const caller = await getCallerStaffProfile(context);
    if (!caller) {
      return [];
    }

    return getDirectReports(context);
  }),

  getDepartments: protectedProcedure.handler(async () => {
    return db.query.departments.findMany({
      where: eq(departments.isActive, true),
    });
  }),
};
