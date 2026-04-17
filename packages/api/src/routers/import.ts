import { z } from "zod";
import {
  db,
  attendanceExceptions,
  callouts,
  contracts,
  departments,
  importJobs,
  leaveRequests,
  leaveTypes,
  ppeIssuances,
  ppeItems,
  staffProfiles,
  trainingRecords,
  user,
  workItems,
} from "@ndma-dcs-staff-portal/db";
import { and, eq, sql } from "drizzle-orm";

import { protectedProcedure, requireRole } from "../index";
import { logAudit } from "../lib/audit";

// ── Row schemas ───────────────────────────────────────────────────────────

const staffRowSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  department: z.string().min(1),
  employmentType: z.enum(["full_time", "part_time", "contract", "temporary"]),
  jobTitle: z.string().optional(),
  employeeId: z.string().optional(),
});

const trainingRowSchema = z.object({
  staffEmail: z.string().email(),
  trainingName: z.string().min(1),
  provider: z.string().optional(),
  completedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const contractRowSchema = z.object({
  staffEmail: z.string().email(),
  contractType: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const workRowSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["routine", "project", "external_request", "ad_hoc"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  description: z.string().optional(),
  assignedToEmail: z.string().email().optional(),
});

// Leave import: 2026 dates only, existing staff only (never creates new staff)
const leaveRowSchema = z.object({
  staffEmail: z.string().email(),
  leaveTypeCode: z.string().min(1), // e.g. AL, SL, ML
  startDate: z.string().regex(/^2026-\d{2}-\d{2}$/, "startDate must be a 2026 date (YYYY-MM-DD)"),
  endDate: z.string().regex(/^2026-\d{2}-\d{2}$/, "endDate must be a 2026 date (YYYY-MM-DD)"),
  totalDays: z.string().regex(/^\d+$/, "totalDays must be a number"),
  reason: z.string().optional(),
});

// ── Shared helpers ────────────────────────────────────────────────────────

async function findStaffByEmail(email: string): Promise<string | null> {
  const profile = await db.query.staffProfiles.findFirst({
    where: (sp) => sql`EXISTS (
      SELECT 1 FROM ${user} u WHERE u.id = ${sp.userId} AND u.email = ${email}
    )`,
    with: { user: true },
  });
  return profile?.id ?? null;
}

async function findOrCreateDepartment(name: string): Promise<string> {
  const existing = await db.query.departments.findFirst({
    where: eq(departments.name, name),
  });
  if (existing) return existing.id;

  // Derive a unique code from the name (uppercase, alphanumeric, max 10 chars)
  const code = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) || "DEPT";

  const [dept] = await db
    .insert(departments)
    .values({ name, code })
    .returning();
  if (!dept) throw new Error("Department insert failed");
  return dept.id;
}

// ── Row processors ────────────────────────────────────────────────────────

async function processStaffRow(
  rawRow: Record<string, string>,
  rowIdx: number,
  _createdByUserId: string,
): Promise<{ success: boolean; error?: { row: number; field?: string; message: string } }> {
  const parse = staffRowSchema.safeParse({
    name: rawRow.name,
    email: rawRow.email,
    department: rawRow.department,
    employmentType: rawRow.employmentType,
    jobTitle: rawRow.jobTitle,
    employeeId: rawRow.employeeId,
  });
  if (!parse.success) {
    return {
      success: false,
      error: { row: rowIdx, message: parse.error.issues[0]?.message ?? "Validation failed" },
    };
  }
  const data = parse.data;

  // Check for duplicate email
  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, data.email),
  });
  if (existingUser) {
    return {
      success: false,
      error: { row: rowIdx, field: "email", message: `User with email ${data.email} already exists` },
    };
  }

  const departmentId = await findOrCreateDepartment(data.department);

  // Generate a sequential employee ID if not provided
  const empId = data.employeeId ?? `IMP-${Date.now()}-${rowIdx}`;

  // Create the auth user record
  const [newUser] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  if (!newUser) throw new Error("User insert failed");

  // Create staff profile
  await db.insert(staffProfiles).values({
    userId: newUser.id,
    employeeId: empId,
    departmentId,
    jobTitle: data.jobTitle ?? "Staff",
    employmentType: data.employmentType,
    status: "active",
    startDate: new Date(),
  });

  return { success: true };
}

async function processTrainingRow(
  rawRow: Record<string, string>,
  rowIdx: number,
): Promise<{ success: boolean; error?: { row: number; field?: string; message: string } }> {
  const parse = trainingRowSchema.safeParse({
    staffEmail: rawRow.staffEmail,
    trainingName: rawRow.trainingName,
    provider: rawRow.provider,
    completedDate: rawRow.completedDate,
    expiryDate: rawRow.expiryDate || undefined,
  });
  if (!parse.success) {
    return { success: false, error: { row: rowIdx, message: parse.error.issues[0]?.message ?? "Validation failed" } };
  }
  const data = parse.data;

  const staffProfileId = await findStaffByEmail(data.staffEmail);
  if (!staffProfileId) {
    return { success: false, error: { row: rowIdx, field: "staffEmail", message: `No staff found with email ${data.staffEmail}` } };
  }

  await db.insert(trainingRecords).values({
    staffProfileId,
    trainingName: data.trainingName,
    provider: data.provider ?? null,
    completedDate: data.completedDate,
    expiryDate: data.expiryDate ?? null,
    status: "current",
  });

  return { success: true };
}

async function processContractRow(
  rawRow: Record<string, string>,
  rowIdx: number,
): Promise<{ success: boolean; error?: { row: number; field?: string; message: string } }> {
  const parse = contractRowSchema.safeParse({
    staffEmail: rawRow.staffEmail,
    contractType: rawRow.contractType,
    startDate: rawRow.startDate,
    endDate: rawRow.endDate || undefined,
  });
  if (!parse.success) {
    return { success: false, error: { row: rowIdx, message: parse.error.issues[0]?.message ?? "Validation failed" } };
  }
  const data = parse.data;

  const staffProfileId = await findStaffByEmail(data.staffEmail);
  if (!staffProfileId) {
    return { success: false, error: { row: rowIdx, field: "staffEmail", message: `No staff found with email ${data.staffEmail}` } };
  }

  await db.insert(contracts).values({
    staffProfileId,
    contractType: data.contractType,
    startDate: data.startDate,
    endDate: data.endDate ?? null,
    status: "active",
  });

  return { success: true };
}

async function processWorkRow(
  rawRow: Record<string, string>,
  rowIdx: number,
  createdById: string,
): Promise<{ success: boolean; error?: { row: number; field?: string; message: string } }> {
  const parse = workRowSchema.safeParse({
    title: rawRow.title,
    type: rawRow.type,
    priority: rawRow.priority,
    description: rawRow.description,
    assignedToEmail: rawRow.assignedToEmail || undefined,
  });
  if (!parse.success) {
    return { success: false, error: { row: rowIdx, message: parse.error.issues[0]?.message ?? "Validation failed" } };
  }
  const data = parse.data;

  let assignedToId: string | null = null;
  if (data.assignedToEmail) {
    assignedToId = await findStaffByEmail(data.assignedToEmail);
  }

  await db.insert(workItems).values({
    title: data.title,
    type: data.type,
    priority: data.priority,
    description: data.description ?? null,
    status: "todo",
    assignedToId,
    createdById,
  });

  return { success: true };
}

async function processLeaveRow(
  rawRow: Record<string, string>,
  rowIdx: number,
): Promise<{ success: boolean; error?: { row: number; field?: string; message: string } }> {
  const parse = leaveRowSchema.safeParse({
    staffEmail: rawRow.staffEmail,
    leaveTypeCode: rawRow.leaveTypeCode,
    startDate: rawRow.startDate,
    endDate: rawRow.endDate,
    totalDays: rawRow.totalDays,
    reason: rawRow.reason || undefined,
  });
  if (!parse.success) {
    return {
      success: false,
      error: { row: rowIdx, message: parse.error.issues[0]?.message ?? "Validation failed" },
    };
  }
  const data = parse.data;

  // Must match an existing staff member — never create new staff
  const staffProfileId = await findStaffByEmail(data.staffEmail);
  if (!staffProfileId) {
    return {
      success: false,
      error: {
        row: rowIdx,
        field: "staffEmail",
        message: `No existing staff found with email ${data.staffEmail} — new staff cannot be created via leave import`,
      },
    };
  }

  // Must match an existing leave type by code
  const leaveType = await db.query.leaveTypes.findFirst({
    where: and(eq(leaveTypes.code, data.leaveTypeCode), eq(leaveTypes.isActive, true)),
  });
  if (!leaveType) {
    return {
      success: false,
      error: {
        row: rowIdx,
        field: "leaveTypeCode",
        message: `No active leave type found with code "${data.leaveTypeCode}"`,
      },
    };
  }

  await db.insert(leaveRequests).values({
    staffProfileId,
    leaveTypeId: leaveType.id,
    startDate: data.startDate,
    endDate: data.endDate,
    totalDays: parseInt(data.totalDays, 10),
    reason: data.reason ?? null,
    status: "approved", // Historical imports are auto-approved
  });

  return { success: true };
}

// ── PPE + Attendance + Callout row schemas ────────────────────────────────

const ppeRowSchema = z.object({
  staffEmail: z.string().email(),
  ppeItemCode: z.string().min(1),
  status: z.enum(["issued", "returned", "lost", "damaged", "replaced"]),
  issuedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serialNumber: z.string().optional(),
  size: z.string().optional(),
  notes: z.string().optional(),
});

const attendanceRowSchema = z.object({
  staffEmail: z.string().email(),
  exceptionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  exceptionType: z.enum(["reported_sick", "medical", "absent", "lateness", "wfh", "early_leave", "other"]),
  reason: z.string().optional(),
  hours: z.string().optional(),
  minutesLate: z.string().optional(),
  notes: z.string().optional(),
});

const calloutRowSchema = z.object({
  staffEmail: z.string().email(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  hours: z.string().regex(/^\d+(\.\d+)?$/, "hours must be a number"),
  comments: z.string().optional(),
  relatedIncidentRef: z.string().optional(),
});

async function processPpeRow(
  rawRow: Record<string, string>,
  rowIdx: number,
  actorUserId: string,
): Promise<{ success: boolean; error?: { row: number; field?: string; message: string } }> {
  const parse = ppeRowSchema.safeParse({
    staffEmail: rawRow.staffEmail,
    ppeItemCode: rawRow.ppeItemCode,
    status: rawRow.status,
    issuedDate: rawRow.issuedDate,
    serialNumber: rawRow.serialNumber || undefined,
    size: rawRow.size || undefined,
    notes: rawRow.notes || undefined,
  });
  if (!parse.success) {
    return { success: false, error: { row: rowIdx, message: parse.error.issues[0]?.message ?? "Validation failed" } };
  }
  const data = parse.data;

  const staffProfileId = await findStaffByEmail(data.staffEmail);
  if (!staffProfileId) {
    return { success: false, error: { row: rowIdx, field: "staffEmail", message: `Staff not found: ${data.staffEmail}` } };
  }

  const item = await db.query.ppeItems.findFirst({ where: eq(ppeItems.code, data.ppeItemCode) });
  if (!item) {
    return { success: false, error: { row: rowIdx, field: "ppeItemCode", message: `PPE item not found: ${data.ppeItemCode}` } };
  }

  await db
    .insert(ppeIssuances)
    .values({
      staffProfileId,
      ppeItemId: item.id,
      issuedById: actorUserId,
      issuedDate: data.issuedDate,
      status: data.status,
      serialNumber: data.serialNumber ?? null,
      size: data.size ?? null,
      notes: data.notes ?? null,
    })
    .onConflictDoNothing();

  return { success: true };
}

async function processAttendanceRow(
  rawRow: Record<string, string>,
  rowIdx: number,
  _actorUserId: string,
): Promise<{ success: boolean; error?: { row: number; field?: string; message: string } }> {
  const parse = attendanceRowSchema.safeParse({
    staffEmail: rawRow.staffEmail,
    exceptionDate: rawRow.exceptionDate ?? rawRow.date,
    exceptionType: rawRow.exceptionType ?? rawRow.type,
    reason: rawRow.reason || undefined,
    hours: rawRow.hours || undefined,
    minutesLate: rawRow.minutesLate || undefined,
    notes: rawRow.notes || undefined,
  });
  if (!parse.success) {
    return { success: false, error: { row: rowIdx, message: parse.error.issues[0]?.message ?? "Validation failed" } };
  }
  const data = parse.data;

  const staffProfileId = await findStaffByEmail(data.staffEmail);
  if (!staffProfileId) {
    return { success: false, error: { row: rowIdx, field: "staffEmail", message: `Staff not found: ${data.staffEmail}` } };
  }

  await db
    .insert(attendanceExceptions)
    .values({
      staffProfileId,
      exceptionDate: data.exceptionDate,
      exceptionType: data.exceptionType,
      reason: data.reason ?? null,
      hours: data.hours ?? null,
      minutesLate: data.minutesLate ? parseInt(data.minutesLate, 10) : null,
      notes: data.notes ?? null,
    })
    .onConflictDoNothing();

  return { success: true };
}

async function processCalloutRow(
  rawRow: Record<string, string>,
  rowIdx: number,
  actorUserId: string,
): Promise<{ success: boolean; error?: { row: number; field?: string; message: string } }> {
  const parse = calloutRowSchema.safeParse({
    staffEmail: rawRow.staffEmail,
    date: rawRow.date,
    startTime: rawRow.startTime || undefined,
    endTime: rawRow.endTime || undefined,
    hours: rawRow.hours,
    comments: rawRow.comments || undefined,
    relatedIncidentRef: rawRow.relatedIncidentRef || undefined,
  });
  if (!parse.success) {
    return { success: false, error: { row: rowIdx, message: parse.error.issues[0]?.message ?? "Validation failed" } };
  }
  const data = parse.data;

  const staffProfileId = await findStaffByEmail(data.staffEmail);
  if (!staffProfileId) {
    return { success: false, error: { row: rowIdx, field: "staffEmail", message: `Staff not found: ${data.staffEmail}` } };
  }

  await db
    .insert(callouts)
    .values({
      staffProfileId,
      calloutAt: new Date(`${data.date}T${data.startTime ?? "00:00"}:00`),
      calloutType: "manual",
      reason: data.comments ?? "Imported callout",
      outcome: data.endTime ? `End: ${data.endTime}, Hours: ${data.hours}` : `Hours: ${data.hours}`,
    })
    .onConflictDoNothing();

  return { success: true };
}

// ── Router ────────────────────────────────────────────────────────────────

export const importRouter = {
  /** Execute a validated import. Rows are processed one at a time; failures are
   * recorded in the job errors array without aborting the whole batch. */
  execute: requireRole("staff", "import")
    .input(
      z.object({
        importType: z.enum(["staff", "training", "contracts", "work", "leave", "ppe", "attendance", "callouts"]),
        fileName: z.string().optional(),
        rows: z.array(z.record(z.string(), z.string())).max(500),
      }),
    )
    .handler(async ({ input, context }) => {
      const { importType, rows, fileName } = input;

      // Create job record
      const [job] = await db
        .insert(importJobs)
        .values({
          importType: importType as "staff" | "training" | "contracts" | "work" | "leave" | "ppe" | "attendance" | "callouts",
          fileName: fileName ?? null,
          status: "running",
          totalRows: rows.length,
          createdByUserId: context.session.user.id,
        })
        .returning();
      if (!job) throw new Error("Import job creation failed");

      const errors: { row: number; field?: string; message: string }[] = [];
      let successCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        let result: { success: boolean; error?: { row: number; field?: string; message: string } };

        try {
          switch (importType) {
            case "staff":
              result = await processStaffRow(row, i + 1, context.session.user.id);
              break;
            case "training":
              result = await processTrainingRow(row, i + 1);
              break;
            case "contracts":
              result = await processContractRow(row, i + 1);
              break;
            case "work":
              result = await processWorkRow(row, i + 1, context.session.user.id);
              break;
            case "leave":
              result = await processLeaveRow(row, i + 1);
              break;
            case "ppe":
              result = await processPpeRow(row, i + 1, context.session.user.id);
              break;
            case "attendance":
              result = await processAttendanceRow(row, i + 1, context.session.user.id);
              break;
            case "callouts":
              result = await processCalloutRow(row, i + 1, context.session.user.id);
              break;
            default:
              result = { success: false, error: { row: i + 1, message: "Unknown import type" } };
          }
        } catch (err) {
          result = {
            success: false,
            error: { row: i + 1, message: err instanceof Error ? err.message : "Unexpected error" },
          };
        }

        if (result.success) {
          successCount++;
        } else if (result.error) {
          errors.push(result.error);
        }
      }

      const errorCount = errors.length;
      const status = errorCount === 0 ? "completed" : successCount > 0 ? "partial" : "failed";

      // Update job record
      const [updatedJob] = await db
        .update(importJobs)
        .set({
          status,
          successCount,
          errorCount,
          errors: errors.length > 0 ? errors : null,
          completedAt: new Date(),
        })
        .where(eq(importJobs.id, job.id))
        .returning();

      await logAudit({
        actorId: context.session.user.id,
        actorName: context.session.user.name,
        action: `import.${importType}.execute`,
        module: "import",
        resourceType: "import_job",
        resourceId: job.id,
        afterValue: { importType, totalRows: rows.length, successCount, errorCount, status } as Record<string, unknown>,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        actorRole: context.userRole ?? undefined,
        correlationId: context.requestId,
      });

      return updatedJob;
    }),

  /** List past import runs, most recent first. */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
        importType: z.enum(["staff", "training", "contracts", "work", "platform_accounts", "leave"]).optional(),
      }),
    )
    .handler(async ({ input }) => {
      const conditions = [];
      if (input.importType) {
        conditions.push(eq(importJobs.importType, input.importType));
      }

      return db.query.importJobs.findMany({
        where: conditions.length > 0 ? conditions[0] : undefined,
        with: { createdBy: true },
        orderBy: (t, { desc }) => [desc(t.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });
    }),
};
