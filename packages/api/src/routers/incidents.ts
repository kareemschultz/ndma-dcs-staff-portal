import { ORPCError } from "@orpc/server";
import { z } from "zod";
import {
  db,
  incidents,
  incidentAffectedServices,
  incidentResponders,
  incidentTimeline,
  postIncidentReviews,
} from "@ndma-dcs-staff-portal/db";
import { and, desc, eq, sql } from "drizzle-orm";

import { protectedProcedure } from "../index";
import { logAudit } from "../lib/audit";
import { createNotification } from "../lib/notify";

// ── Input Schemas ──────────────────────────────────────────────────────────

const SeveritySchema = z.enum(["sev1", "sev2", "sev3", "sev4"]);

const CreateIncidentInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  severity: SeveritySchema,
  commanderId: z.string().optional(),
  detectedAt: z.string().optional(), // ISO timestamp — defaults to now
});

const UpdateIncidentInput = z.object({
  id: z.string(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  severity: SeveritySchema.optional(),
  commanderId: z.string().optional(),
  impactSummary: z.string().optional(),
  rootCause: z.string().optional(),
  status: z
    .enum([
      "detected",
      "investigating",
      "identified",
      "mitigating",
      "resolved",
      "post_mortem",
      "closed",
    ])
    .optional(),
});

const AddTimelineInput = z.object({
  incidentId: z.string(),
  eventType: z.enum(["status_change", "note", "escalation", "action_taken"]),
  content: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const AddResponderInput = z.object({
  incidentId: z.string(),
  staffProfileId: z.string(),
  role: z
    .enum(["commander", "comms", "technical", "observer"])
    .default("technical"),
});

const CreatePIRInput = z.object({
  incidentId: z.string(),
  ledById: z.string().optional(),
  reviewDate: z.string().optional(),
  summary: z.string().optional(),
  lessonsLearned: z.string().optional(),
  actionItems: z
    .array(
      z.object({
        description: z.string(),
        ownerId: z.string().optional(),
        dueDate: z.string().optional(),
      }),
    )
    .optional(),
});

// ── Router ─────────────────────────────────────────────────────────────────

export const incidentsRouter = {
  list: protectedProcedure
    .input(
      z.object({
        status: z
          .enum([
            "detected",
            "investigating",
            "identified",
            "mitigating",
            "resolved",
            "post_mortem",
            "closed",
          ])
          .optional(),
        severity: SeveritySchema.optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .handler(async ({ input }) => {
      const conditions = [];
      if (input.status) conditions.push(eq(incidents.status, input.status));
      if (input.severity)
        conditions.push(eq(incidents.severity, input.severity));

      return db.query.incidents.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: desc(incidents.detectedAt),
        limit: input.limit,
        offset: input.offset,
        with: {
          reportedBy: true,
          commander: { with: { user: true } },
          affectedServices: { with: { service: true } },
          responders: { with: { staffProfile: { with: { user: true } } } },
        },
      });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const incident = await db.query.incidents.findFirst({
        where: eq(incidents.id, input.id),
        with: {
          reportedBy: true,
          commander: { with: { user: true } },
          affectedServices: { with: { service: true } },
          responders: { with: { staffProfile: { with: { user: true } } } },
          timeline: {
            with: { author: true },
            orderBy: desc(incidentTimeline.createdAt),
          },
          pir: { with: { ledBy: { with: { user: true } } } },
        },
      });
      if (!incident) throw new ORPCError("NOT_FOUND");
      return incident;
    }),

  create: protectedProcedure
    .input(CreateIncidentInput)
    .handler(async ({ input, context }) => {
      const [incident] = await db
        .insert(incidents)
        .values({
          title: input.title,
          description: input.description ?? null,
          severity: input.severity,
          commanderId: input.commanderId ?? null,
          reportedById: context.session.user.id,
          detectedAt: input.detectedAt ? new Date(input.detectedAt) : new Date(),
        })
        .returning();

      // Auto-add first timeline entry
      await db.insert(incidentTimeline).values({
        incidentId: incident.id,
        authorId: context.session.user.id,
        eventType: "status_change",
        content: `Incident declared: ${input.severity.toUpperCase()} — ${input.title}`,
        metadata: { severity: input.severity },
      });

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "incident.create",
        module: "incident",
        resourceType: "incident",
        resourceId: incident.id,
        afterValue: incident as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return incident;
    }),

  update: protectedProcedure
    .input(UpdateIncidentInput)
    .handler(async ({ input, context }) => {
      const { id, ...updates } = input;

      const before = await db.query.incidents.findFirst({
        where: eq(incidents.id, id),
      });
      if (!before) throw new ORPCError("NOT_FOUND");

      const now = new Date();
      const statusTimestamps: Record<string, Date | undefined> = {};
      if (updates.status === "resolved" && before.status !== "resolved")
        statusTimestamps.resolvedAt = now;
      if (updates.status === "closed" && before.status !== "closed")
        statusTimestamps.closedAt = now;

      const [updated] = await db
        .update(incidents)
        .set({ ...updates, ...statusTimestamps })
        .where(eq(incidents.id, id))
        .returning();

      // Add timeline entry for status change
      if (updates.status && updates.status !== before.status) {
        await db.insert(incidentTimeline).values({
          incidentId: id,
          authorId: context.session.user.id,
          eventType: "status_change",
          content: `Status changed: ${before.status} → ${updates.status}`,
          metadata: { from: before.status, to: updates.status },
        });
      }

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "incident.update",
        module: "incident",
        resourceType: "incident",
        resourceId: id,
        beforeValue: before as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return updated;
    }),

  addTimelineEntry: protectedProcedure
    .input(AddTimelineInput)
    .handler(async ({ input, context }) => {
      const exists = await db.query.incidents.findFirst({
        where: eq(incidents.id, input.incidentId),
      });
      if (!exists) throw new ORPCError("NOT_FOUND");

      const [entry] = await db
        .insert(incidentTimeline)
        .values({
          incidentId: input.incidentId,
          authorId: context.session.user.id,
          eventType: input.eventType,
          content: input.content,
          metadata: input.metadata ?? null,
        })
        .returning();

      return entry;
    }),

  addResponder: protectedProcedure
    .input(AddResponderInput)
    .handler(async ({ input }) => {
      const [responder] = await db
        .insert(incidentResponders)
        .values({
          incidentId: input.incidentId,
          staffProfileId: input.staffProfileId,
          role: input.role,
        })
        .onConflictDoUpdate({
          target: [
            incidentResponders.incidentId,
            incidentResponders.staffProfileId,
          ],
          set: { role: input.role, leftAt: null },
        })
        .returning();
      return responder;
    }),

  removeResponder: protectedProcedure
    .input(z.object({ incidentId: z.string(), staffProfileId: z.string() }))
    .handler(async ({ input }) => {
      await db
        .update(incidentResponders)
        .set({ leftAt: new Date() })
        .where(
          and(
            eq(incidentResponders.incidentId, input.incidentId),
            eq(incidentResponders.staffProfileId, input.staffProfileId),
          ),
        );
      return { success: true };
    }),

  linkService: protectedProcedure
    .input(
      z.object({
        incidentId: z.string(),
        serviceId: z.string(),
        impactDescription: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const [link] = await db
        .insert(incidentAffectedServices)
        .values({
          incidentId: input.incidentId,
          serviceId: input.serviceId,
          impactDescription: input.impactDescription ?? null,
        })
        .onConflictDoNothing()
        .returning();
      return link;
    }),

  unlinkService: protectedProcedure
    .input(z.object({ incidentId: z.string(), serviceId: z.string() }))
    .handler(async ({ input }) => {
      await db
        .delete(incidentAffectedServices)
        .where(
          and(
            eq(incidentAffectedServices.incidentId, input.incidentId),
            eq(incidentAffectedServices.serviceId, input.serviceId),
          ),
        );
      return { success: true };
    }),

  createPIR: protectedProcedure
    .input(CreatePIRInput)
    .handler(async ({ input, context }) => {
      const [pir] = await db
        .insert(postIncidentReviews)
        .values({
          incidentId: input.incidentId,
          ledById: input.ledById ?? null,
          reviewDate: input.reviewDate ?? null,
          summary: input.summary ?? null,
          lessonsLearned: input.lessonsLearned ?? null,
          actionItems: input.actionItems ?? null,
          status: "scheduled",
        })
        .onConflictDoUpdate({
          target: [postIncidentReviews.incidentId],
          set: {
            ledById: input.ledById ?? null,
            reviewDate: input.reviewDate ?? null,
            summary: input.summary ?? null,
            lessonsLearned: input.lessonsLearned ?? null,
            actionItems: input.actionItems ?? null,
          },
        })
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: "incident.pir.create",
        module: "incident",
        resourceType: "post_incident_review",
        resourceId: pir.id,
        afterValue: pir as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return pir;
    }),

  getActive: protectedProcedure.handler(async () => {
    return db.query.incidents.findMany({
      where: sql`${incidents.status} NOT IN ('resolved', 'post_mortem', 'closed')`,
      orderBy: [incidents.severity, desc(incidents.detectedAt)],
      with: {
        commander: { with: { user: true } },
        affectedServices: { with: { service: true } },
      },
    });
  }),

  stats: protectedProcedure.handler(async () => {
    const all = await db.query.incidents.findMany({
      columns: {
        id: true,
        severity: true,
        status: true,
        detectedAt: true,
        resolvedAt: true,
      },
    });

    const byStatus: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const mttrMs: number[] = [];

    for (const i of all) {
      byStatus[i.status] = (byStatus[i.status] ?? 0) + 1;
      bySeverity[i.severity] = (bySeverity[i.severity] ?? 0) + 1;
      if (i.resolvedAt) {
        mttrMs.push(i.resolvedAt.getTime() - i.detectedAt.getTime());
      }
    }

    const mttrMinutes =
      mttrMs.length > 0
        ? Math.round(
            mttrMs.reduce((a, b) => a + b, 0) / mttrMs.length / 60000,
          )
        : null;

    return { total: all.length, byStatus, bySeverity, mttrMinutes };
  }),
};
