import {
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { user } from "./auth";
import { departments } from "./departments";
import { staffProfiles } from "./staff";

// ── Enums ─────────────────────────────────────────────────────────────────

export const prStatusEnum = pgEnum("pr_status", [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "ordered",
  "received",
  "cancelled",
]);

export const prPriorityEnum = pgEnum("pr_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

// ── Purchase Requisitions ─────────────────────────────────────────────────

export const purchaseRequisitions = pgTable(
  "purchase_requisitions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    description: text("description"),
    justification: text("justification"),
    requestedById: text("requested_by_id").references(() => staffProfiles.id, {
      onDelete: "set null",
    }),
    departmentId: text("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    priority: prPriorityEnum("priority").notNull().default("medium"),
    status: prStatusEnum("status").notNull().default("draft"),
    totalEstimatedCost: numeric("total_estimated_cost", {
      precision: 14,
      scale: 2,
    }),
    currency: text("currency").notNull().default("GHS"),
    approvedById: text("approved_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at"),
    rejectionReason: text("rejection_reason"),
    vendorName: text("vendor_name"),
    vendorReference: text("vendor_reference"),
    expectedDeliveryDate: date("expected_delivery_date"),
    actualDeliveryDate: date("actual_delivery_date"),
    notes: text("notes"),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("pr_status_idx").on(table.status),
    index("pr_requestedById_idx").on(table.requestedById),
    index("pr_departmentId_idx").on(table.departmentId),
    index("pr_createdAt_idx").on(table.createdAt),
  ],
);

// ── Line Items ────────────────────────────────────────────────────────────

export const prLineItems = pgTable("pr_line_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  prId: text("pr_id")
    .notNull()
    .references(() => purchaseRequisitions.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitCost: numeric("unit_cost", { precision: 14, scale: 2 }).notNull(),
  unit: text("unit").notNull().default("pcs"), // pcs, kg, m, l, etc.
  totalCost: numeric("total_cost", { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ── Approval History ──────────────────────────────────────────────────────

export const prApprovals = pgTable("pr_approvals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  prId: text("pr_id")
    .notNull()
    .references(() => purchaseRequisitions.id, { onDelete: "cascade" }),
  approverId: text("approver_id").references(() => user.id, {
    onDelete: "set null",
  }),
  // approved | rejected | returned
  action: text("action").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Relations ─────────────────────────────────────────────────────────────────

export const purchaseRequisitionsRelations = relations(
  purchaseRequisitions,
  ({ one, many }) => ({
    requestedBy: one(staffProfiles, {
      fields: [purchaseRequisitions.requestedById],
      references: [staffProfiles.id],
    }),
    department: one(departments, {
      fields: [purchaseRequisitions.departmentId],
      references: [departments.id],
    }),
    approvedBy: one(user, {
      fields: [purchaseRequisitions.approvedById],
      references: [user.id],
      relationName: "prApprovedBy",
    }),
    createdBy: one(user, {
      fields: [purchaseRequisitions.createdById],
      references: [user.id],
      relationName: "prCreatedBy",
    }),
    lineItems: many(prLineItems),
    approvals: many(prApprovals),
  }),
);

export const prLineItemsRelations = relations(prLineItems, ({ one }) => ({
  pr: one(purchaseRequisitions, {
    fields: [prLineItems.prId],
    references: [purchaseRequisitions.id],
  }),
}));

export const prApprovalsRelations = relations(prApprovals, ({ one }) => ({
  pr: one(purchaseRequisitions, {
    fields: [prApprovals.prId],
    references: [purchaseRequisitions.id],
  }),
  approver: one(user, {
    fields: [prApprovals.approverId],
    references: [user.id],
  }),
}));
