import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { appraisals } from "./appraisals";
import { staffProfiles } from "./staff";
import { user } from "./auth";

export const promotionRecommendationStatusEnum = pgEnum(
  "promotion_recommendation_status",
  ["draft", "submitted", "approved", "rejected", "withdrawn"],
);

export const promotionLetterStatusEnum = pgEnum("promotion_letter_status", [
  "draft",
  "issued",
  "revoked",
]);

export const journalEntryTypeEnum = pgEnum("performance_journal_entry_type", [
  "note",
  "achievement",
  "concern",
  "amendment",
]);

export const careerPathPlanStatusEnum = pgEnum("career_path_plan_status", [
  "active",
  "paused",
  "completed",
]);

export const staffFeedbackStatusEnum = pgEnum("staff_feedback_status", [
  "draft",
  "submitted",
  "reviewed",
  "closed",
]);

export const promotionRecommendations = pgTable(
  "promotion_recommendations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    appraisalId: text("appraisal_id").references(() => appraisals.id, {
      onDelete: "set null",
    }),
    requestedById: text("requested_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedById: text("reviewed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    approvedById: text("approved_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    status: promotionRecommendationStatusEnum("status").notNull().default("draft"),
    reason: text("reason"),
    details: text("details"),
    reviewNotes: text("review_notes"),
    rejectionReason: text("rejection_reason"),
    submittedAt: timestamp("submitted_at"),
    reviewedAt: timestamp("reviewed_at"),
    approvedAt: timestamp("approved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("promotion_recommendations_staffProfileId_idx").on(
      table.staffProfileId,
    ),
    index("promotion_recommendations_status_idx").on(table.status),
    index("promotion_recommendations_appraisalId_idx").on(table.appraisalId),
  ],
);

export const promotionLetters = pgTable(
  "promotion_letters",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    recommendationId: text("recommendation_id")
      .notNull()
      .references(() => promotionRecommendations.id, { onDelete: "cascade" }),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    issuedById: text("issued_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    letterNumber: text("letter_number"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    status: promotionLetterStatusEnum("status").notNull().default("draft"),
    issuedAt: timestamp("issued_at"),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("promotion_letters_recommendation_unique").on(table.recommendationId),
    index("promotion_letters_staffProfileId_idx").on(table.staffProfileId),
    index("promotion_letters_status_idx").on(table.status),
  ],
);

export const performanceJournalEntries = pgTable(
  "performance_journal_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    appraisalId: text("appraisal_id").references(() => appraisals.id, {
      onDelete: "set null",
    }),
    linkedEntryId: text("linked_entry_id"),
    authorId: text("author_id").references(() => user.id, {
      onDelete: "set null",
    }),
    entryType: journalEntryTypeEnum("entry_type").notNull().default("note"),
    body: text("body").notNull(),
    visibleToStaff: boolean("visible_to_staff").notNull().default(false),
    entryDate: date("entry_date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("performance_journal_entries_staffProfileId_idx").on(
      table.staffProfileId,
    ),
    index("performance_journal_entries_appraisalId_idx").on(table.appraisalId),
    index("performance_journal_entries_entryDate_idx").on(table.entryDate),
  ],
);

export const careerPathPlans = pgTable(
  "career_path_plans",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    currentLevel: text("current_level").notNull(),
    targetLevel: text("target_level"),
    currentTrack: text("current_track"),
    nextReviewDate: date("next_review_date"),
    status: careerPathPlanStatusEnum("status").notNull().default("active"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("career_path_plans_staffProfile_unique").on(table.staffProfileId),
    index("career_path_plans_status_idx").on(table.status),
  ],
);

export const careerPathYears = pgTable(
  "career_path_years",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    careerPathPlanId: text("career_path_plan_id")
      .notNull()
      .references(() => careerPathPlans.id, { onDelete: "cascade" }),
    yearNumber: integer("year_number").notNull(),
    title: text("title").notNull(),
    goals: jsonb("goals").$type<string[]>().default([]),
    prerequisites: jsonb("prerequisites").$type<string[]>().default([]),
    status: careerPathPlanStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("career_path_years_plan_year_unique").on(
      table.careerPathPlanId,
      table.yearNumber,
    ),
    index("career_path_years_planId_idx").on(table.careerPathPlanId),
  ],
);

export const staffFeedback = pgTable(
  "staff_feedback",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    appraisalId: text("appraisal_id").references(() => appraisals.id, {
      onDelete: "set null",
    }),
    authorId: text("author_id").references(() => user.id, {
      onDelete: "set null",
    }),
    category: text("category").notNull(),
    rating: integer("rating"),
    comments: text("comments").notNull(),
    status: staffFeedbackStatusEnum("status").notNull().default("submitted"),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    reviewedAt: timestamp("reviewed_at"),
    reviewedById: text("reviewed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("staff_feedback_staffProfileId_idx").on(table.staffProfileId),
    index("staff_feedback_appraisalId_idx").on(table.appraisalId),
    index("staff_feedback_status_idx").on(table.status),
  ],
);

export const promotionRecommendationsRelations = relations(
  promotionRecommendations,
  ({ one }) => ({
    staffProfile: one(staffProfiles, {
      fields: [promotionRecommendations.staffProfileId],
      references: [staffProfiles.id],
    }),
    appraisal: one(appraisals, {
      fields: [promotionRecommendations.appraisalId],
      references: [appraisals.id],
    }),
    requestedBy: one(user, {
      fields: [promotionRecommendations.requestedById],
      references: [user.id],
      relationName: "promotionRecommendationRequestedBy",
    }),
    reviewedBy: one(user, {
      fields: [promotionRecommendations.reviewedById],
      references: [user.id],
      relationName: "promotionRecommendationReviewedBy",
    }),
    approvedBy: one(user, {
      fields: [promotionRecommendations.approvedById],
      references: [user.id],
      relationName: "promotionRecommendationApprovedBy",
    }),
  }),
);

export const promotionLettersRelations = relations(promotionLetters, ({ one }) => ({
  recommendation: one(promotionRecommendations, {
    fields: [promotionLetters.recommendationId],
    references: [promotionRecommendations.id],
  }),
  staffProfile: one(staffProfiles, {
    fields: [promotionLetters.staffProfileId],
    references: [staffProfiles.id],
  }),
  issuedBy: one(user, {
    fields: [promotionLetters.issuedById],
    references: [user.id],
    relationName: "promotionLetterIssuedBy",
  }),
}));

export const performanceJournalEntriesRelations = relations(
  performanceJournalEntries,
  ({ one }) => ({
    staffProfile: one(staffProfiles, {
      fields: [performanceJournalEntries.staffProfileId],
      references: [staffProfiles.id],
    }),
    appraisal: one(appraisals, {
      fields: [performanceJournalEntries.appraisalId],
      references: [appraisals.id],
    }),
    author: one(user, {
      fields: [performanceJournalEntries.authorId],
      references: [user.id],
      relationName: "performanceJournalAuthor",
    }),
  }),
);

export const careerPathPlansRelations = relations(careerPathPlans, ({ one, many }) => ({
  staffProfile: one(staffProfiles, {
    fields: [careerPathPlans.staffProfileId],
    references: [staffProfiles.id],
  }),
  createdBy: one(user, {
    fields: [careerPathPlans.createdById],
    references: [user.id],
    relationName: "careerPathCreatedBy",
  }),
  years: many(careerPathYears),
}));

export const careerPathYearsRelations = relations(careerPathYears, ({ one }) => ({
  plan: one(careerPathPlans, {
    fields: [careerPathYears.careerPathPlanId],
    references: [careerPathPlans.id],
  }),
}));

export const staffFeedbackRelations = relations(staffFeedback, ({ one }) => ({
  staffProfile: one(staffProfiles, {
    fields: [staffFeedback.staffProfileId],
    references: [staffProfiles.id],
  }),
  appraisal: one(appraisals, {
    fields: [staffFeedback.appraisalId],
    references: [appraisals.id],
  }),
  author: one(user, {
    fields: [staffFeedback.authorId],
    references: [user.id],
    relationName: "staffFeedbackAuthor",
  }),
  reviewedBy: one(user, {
    fields: [staffFeedback.reviewedById],
    references: [user.id],
    relationName: "staffFeedbackReviewedBy",
  }),
}));
