import { db, auditLogs } from "@ndma-dcs-staff-portal/db";

export interface LogAuditParams {
  actorId?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  action: string; // e.g. "work_item.create", "rota.publish", "incident.resolve"
  module: string; // e.g. "work", "rota", "incident", "procurement"
  resourceType: string; // e.g. "work_item", "on_call_schedule", "purchase_requisition"
  resourceId?: string | null;
  beforeValue?: Record<string, unknown> | null;
  afterValue?: Record<string, unknown> | null;
  // From Hono request context
  ipAddress?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
}

/**
 * Append a row to the global audit log.
 * Call this from every mutation procedure — never update or delete audit rows.
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  await db.insert(auditLogs).values({
    actorId: params.actorId ?? null,
    actorName: params.actorName ?? null,
    actorRole: params.actorRole ?? null,
    action: params.action,
    module: params.module,
    resourceType: params.resourceType,
    resourceId: params.resourceId ?? null,
    beforeValue: params.beforeValue ?? null,
    afterValue: params.afterValue ?? null,
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
    correlationId: params.correlationId ?? null,
  });
}
