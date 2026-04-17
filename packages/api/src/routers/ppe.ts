import { ORPCError } from "@orpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import {
  db,
  ppeIssuances,
  ppeItems,
  staffProfiles,
} from "@ndma-dcs-staff-portal/db";

import { requireRole } from "../index";
import { logAudit } from "../lib/audit";
import {
  canAccessStaffPrivate,
  getCallerStaffProfile,
  getManagedStaffIds,
} from "../lib/scope";

async function assertPpeAccess(context: Parameters<typeof canAccessStaffPrivate>[0], staffProfileId: string) {
  const role = context.userRole ?? "";
  if (role === "admin" || role === "hrAdminOps") {
    return;
  }
  const allowed = await canAccessStaffPrivate(context, staffProfileId);
  if (!allowed) {
    throw new ORPCError("FORBIDDEN");
  }
}

export const ppeRouter = {
  catalog: {
    list: requireRole("ppe", "read").handler(async () => {
      return db.query.ppeItems.findMany({
        orderBy: [desc(ppeItems.isActive), desc(ppeItems.createdAt)],
      });
    }),

    create: requireRole("ppe", "create")
      .input(
        z.object({
          code: z.string().min(1),
          name: z.string().min(1),
          category: z.string().optional(),
          description: z.string().optional(),
          defaultSize: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const [item] = await db.insert(ppeItems).values({
          ...input,
          category: input.category ?? null,
          description: input.description ?? null,
          defaultSize: input.defaultSize ?? null,
          isActive: input.isActive ?? true,
        }).returning();
        if (!item) throw new ORPCError("INTERNAL_SERVER_ERROR");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          actorRole: context.userRole ?? undefined,
          action: "ppe_item.create",
          module: "compliance",
          resourceType: "ppe_item",
          resourceId: item.id,
          afterValue: item as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          correlationId: context.requestId,
        });

        return item;
      }),

    update: requireRole("ppe", "update")
      .input(
        z.object({
          id: z.string(),
          code: z.string().optional(),
          name: z.string().optional(),
          category: z.string().optional(),
          description: z.string().optional(),
          defaultSize: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const before = await db.query.ppeItems.findFirst({
          where: eq(ppeItems.id, input.id),
        });
        if (!before) throw new ORPCError("NOT_FOUND");

        const [item] = await db
          .update(ppeItems)
          .set({
            code: input.code ?? before.code,
            name: input.name ?? before.name,
            category: input.category ?? before.category,
            description: input.description ?? before.description,
            defaultSize: input.defaultSize ?? before.defaultSize,
            isActive: input.isActive ?? before.isActive,
            updatedAt: new Date(),
          })
          .where(eq(ppeItems.id, input.id))
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          actorRole: context.userRole ?? undefined,
          action: "ppe_item.update",
          module: "compliance",
          resourceType: "ppe_item",
          resourceId: input.id,
          beforeValue: before as Record<string, unknown>,
          afterValue: item as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          correlationId: context.requestId,
        });

        return item;
      }),
  },

  issuances: {
    list: requireRole("ppe", "read")
      .input(
        z.object({
          staffProfileId: z.string().optional(),
          status: z.enum(["issued", "returned", "lost", "damaged", "replaced"]).optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const role = context.userRole ?? "";
        const conditions = [];

        if (input.staffProfileId) {
          await assertPpeAccess(context, input.staffProfileId);
          conditions.push(eq(ppeIssuances.staffProfileId, input.staffProfileId));
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
          conditions.push(inArray(ppeIssuances.staffProfileId, [...accessible]));
        }

        if (input.status) {
          conditions.push(eq(ppeIssuances.status, input.status));
        }

        return db.query.ppeIssuances.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          with: {
            staffProfile: { with: { user: true, department: true } },
            ppeItem: true,
            issuedBy: true,
            returnedBy: true,
          },
          orderBy: [desc(ppeIssuances.issuedDate), desc(ppeIssuances.createdAt)],
        });
      }),

    create: requireRole("ppe", "assign")
      .input(
        z.object({
          staffProfileId: z.string(),
          ppeItemId: z.string(),
          issuedDate: z.string(),
          dueDate: z.string().optional(),
          serialNumber: z.string().optional(),
          size: z.string().optional(),
          condition: z.string().optional(),
          notes: z.string().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        await assertPpeAccess(context, input.staffProfileId);

        const [row] = await db
          .insert(ppeIssuances)
          .values({
            staffProfileId: input.staffProfileId,
            ppeItemId: input.ppeItemId,
            issuedById: context.session.user.id,
            serialNumber: input.serialNumber ?? null,
            size: input.size ?? null,
            issuedDate: input.issuedDate,
            dueDate: input.dueDate ?? null,
            condition: input.condition ?? "good",
            notes: input.notes ?? null,
            status: "issued",
          })
          .returning();
        if (!row) throw new ORPCError("INTERNAL_SERVER_ERROR");

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          actorRole: context.userRole ?? undefined,
          action: "ppe_issuance.create",
          module: "compliance",
          resourceType: "ppe_issuance",
          resourceId: row.id,
          afterValue: row as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          correlationId: context.requestId,
        });

        return row;
      }),

    update: requireRole("ppe", "update")
      .input(
        z.object({
          id: z.string(),
          ppeItemId: z.string().optional(),
          serialNumber: z.string().optional(),
          size: z.string().optional(),
          dueDate: z.string().optional(),
          condition: z.string().optional(),
          notes: z.string().optional(),
          status: z.enum(["issued", "returned", "lost", "damaged", "replaced"]).optional(),
        }),
      )
      .handler(async ({ input, context }) => {
      const before = await db.query.ppeIssuances.findFirst({
        where: eq(ppeIssuances.id, input.id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");
      if (before.status === "returned") {
        throw new ORPCError("CONFLICT", {
          message: "Returned PPE issuances cannot be edited.",
        });
      }

      await assertPpeAccess(context, before.staffProfileId);

        const [row] = await db
          .update(ppeIssuances)
          .set({
            ppeItemId: input.ppeItemId ?? before.ppeItemId,
            serialNumber: input.serialNumber ?? before.serialNumber,
            size: input.size ?? before.size,
            dueDate: input.dueDate ?? before.dueDate,
            condition: input.condition ?? before.condition,
            notes: input.notes ?? before.notes,
            status: input.status ?? before.status,
            updatedAt: new Date(),
          })
          .where(eq(ppeIssuances.id, input.id))
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          actorRole: context.userRole ?? undefined,
          action: "ppe_issuance.update",
          module: "compliance",
          resourceType: "ppe_issuance",
          resourceId: input.id,
          beforeValue: before as Record<string, unknown>,
          afterValue: row as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          correlationId: context.requestId,
        });

        return row;
      }),

    return: requireRole("ppe", "update")
      .input(z.object({ id: z.string(), returnedDate: z.string(), condition: z.string().optional(), notes: z.string().optional() }))
      .handler(async ({ input, context }) => {
      const before = await db.query.ppeIssuances.findFirst({
        where: eq(ppeIssuances.id, input.id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");
      if (before.status === "returned") {
        throw new ORPCError("CONFLICT", {
          message: "Returned PPE cannot be returned again.",
        });
      }

      await assertPpeAccess(context, before.staffProfileId);

        const [row] = await db
          .update(ppeIssuances)
          .set({
            returnedDate: input.returnedDate,
            returnedById: context.session.user.id,
            condition: input.condition ?? before.condition,
            notes: input.notes ?? before.notes,
            status: "returned",
            updatedAt: new Date(),
          })
          .where(eq(ppeIssuances.id, input.id))
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          actorRole: context.userRole ?? undefined,
          action: "ppe_issuance.return",
          module: "compliance",
          resourceType: "ppe_issuance",
          resourceId: input.id,
          beforeValue: before as Record<string, unknown>,
          afterValue: row as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          correlationId: context.requestId,
        });

        return row;
      }),

    markDamaged: requireRole("ppe", "update")
      .input(z.object({ id: z.string(), notes: z.string().optional() }))
      .handler(async ({ input, context }) => {
        const before = await db.query.ppeIssuances.findFirst({
          where: eq(ppeIssuances.id, input.id),
        });
        if (!before) throw new ORPCError("NOT_FOUND");
        if (before.status === "returned") {
          throw new ORPCError("CONFLICT", {
            message: "Returned PPE cannot be marked as damaged.",
          });
        }

        await assertPpeAccess(context, before.staffProfileId);

        const [row] = await db
          .update(ppeIssuances)
          .set({
            status: "damaged",
            notes: input.notes ?? before.notes,
            updatedAt: new Date(),
          })
          .where(eq(ppeIssuances.id, input.id))
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          actorRole: context.userRole ?? undefined,
          action: "ppe_issuance.mark_damaged",
          module: "compliance",
          resourceType: "ppe_issuance",
          resourceId: input.id,
          beforeValue: before as Record<string, unknown>,
          afterValue: row as Record<string, unknown>,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          correlationId: context.requestId,
        });

        return row;
      }),

    markLost: requireRole("ppe", "update")
      .input(z.object({ id: z.string(), notes: z.string().optional() }))
      .handler(async ({ input, context }) => {
        const before = await db.query.ppeIssuances.findFirst({
          where: eq(ppeIssuances.id, input.id),
        });
        if (!before) throw new ORPCError("NOT_FOUND");
        if (before.status === "returned") {
          throw new ORPCError("CONFLICT", {
            message: "Returned PPE cannot be marked as lost.",
          });
        }

        await assertPpeAccess(context, before.staffProfileId);

        const [row] = await db
          .update(ppeIssuances)
          .set({
            status: "lost",
            notes: input.notes ?? before.notes,
            updatedAt: new Date(),
          })
          .where(eq(ppeIssuances.id, input.id))
          .returning();

        await logAudit({
          actorId: context.session.user.id,
          actorName: context.session.user.name,
          actorRole: context.userRole ?? undefined,
          action: "ppe_issuance.mark_lost",
          module: "compliance",
          resourceType: "ppe_issuance",
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
