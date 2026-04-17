import {
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { appraisalCycles } from "./appraisal-cycles";
import { user } from "./auth";
import { staffProfiles } from "./staff";

export const appraisalStatusEnum = pgEnum("appraisal_status", [
  "draft",
  "scheduled",
  "in_progress",
  "submitted",
  "approved",
  "rejected",
  "completed",
  "overdue",
]);

export const appraisals = pgTable(
  "appraisals",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    cycleId: text("cycle_id").references(() => appraisalCycles.id, {
      onDelete: "set null",
    }),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    // The reviewer / line manager conducting the appraisal
    reviewerId: text("reviewer_id").references(() => staffProfiles.id, {
      onDelete: "set null",
    }),
    teamLeadId: text("team_lead_id").references(() => staffProfiles.id, {
      onDelete: "set null",
    }),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    scheduledDate: date("scheduled_date"),
    completedDate: date("completed_date"),
    status: appraisalStatusEnum("status").notNull().default("scheduled"),
    submittedAt: timestamp("submitted_at"),
    submittedById: text("submitted_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at"),
    approvedById: text("approved_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    rejectedAt: timestamp("rejected_at"),
    rejectedById: text("rejected_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    rejectionReason: text("rejection_reason"),
    percentageScore: integer("percentage_score"),
    location: text("location"),
    typeOfReview: text("type_of_review"),
    achievements: jsonb("achievements").$type<string[]>(),
    goals: jsonb("goals").$type<string[]>(),
    staffFeedback: text("staff_feedback"),
    supervisorComments: text("supervisor_comments"),
    managerComments: text("manager_comments"),
    immutableFrom: timestamp("immutable_from"),
    // 1–5 rating
    overallRating: integer("overall_rating"),
    summary: text("summary"),
    ratingMatrix: jsonb("rating_matrix").$type<Record<string, number>>(),
    objectives: jsonb("objectives").$type<
      { title: string; rating?: number; comments?: string }[]
    >(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("appraisals_cycleId_idx").on(table.cycleId),
    index("appraisals_staffProfileId_idx").on(table.staffProfileId),
    index("appraisals_status_idx").on(table.status),
    index("appraisals_scheduledDate_idx").on(table.scheduledDate),
  ],
);

export const appraisalsRelations = relations(appraisals, ({ one }) => ({
  cycle: one(appraisalCycles, {
    fields: [appraisals.cycleId],
    references: [appraisalCycles.id],
  }),
  staffProfile: one(staffProfiles, {
    fields: [appraisals.staffProfileId],
    references: [staffProfiles.id],
    relationName: "staffAppraisals",
  }),
  reviewer: one(staffProfiles, {
    fields: [appraisals.reviewerId],
    references: [staffProfiles.id],
    relationName: "reviewerAppraisals",
  }),
  teamLead: one(staffProfiles, {
    fields: [appraisals.teamLeadId],
    references: [staffProfiles.id],
    relationName: "teamLeadAppraisals",
  }),
  submittedBy: one(user, {
    fields: [appraisals.submittedById],
    references: [user.id],
    relationName: "appraisalSubmittedBy",
  }),
  approvedBy: one(user, {
    fields: [appraisals.approvedById],
    references: [user.id],
    relationName: "appraisalApprovedBy",
  }),
  rejectedBy: one(user, {
    fields: [appraisals.rejectedById],
    references: [user.id],
    relationName: "appraisalRejectedBy",
  }),
}));
