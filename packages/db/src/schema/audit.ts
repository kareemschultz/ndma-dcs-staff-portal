import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

// Append-only audit log — never updated after insert
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // Actor fields — denormalized for immutability (survives user rename/delete)
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    actorName: text("actor_name"), // denormalized copy of user.name at time of action
    actorRole: text("actor_role"),
    // Action descriptor — e.g. "work_item.create", "incident.resolve", "rota.publish"
    action: text("action").notNull(),
    // Domain context
    module: text("module").notNull(), // e.g. "work", "incident", "rota", "leave"
    resourceType: text("resource_type").notNull(), // e.g. "work_item", "incident"
    resourceId: text("resource_id"),
    // Diff snapshot — stored as JSON, not FKs, so the log is self-contained
    beforeValue: jsonb("before_value").$type<Record<string, unknown>>(),
    afterValue: jsonb("after_value").$type<Record<string, unknown>>(),
    // Request metadata for security forensics
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    // Groups related actions within a single user operation (e.g. publish schedule = 5 writes)
    correlationId: text("correlation_id"),
    // Intentionally no updatedAt — this table is append-only
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_actorId_idx").on(table.actorId),
    index("audit_logs_module_idx").on(table.module),
    index("audit_logs_resource_idx").on(table.resourceType, table.resourceId),
    index("audit_logs_createdAt_idx").on(table.createdAt),
    index("audit_logs_correlationId_idx").on(table.correlationId),
  ],
);
