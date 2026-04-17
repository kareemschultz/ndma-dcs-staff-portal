import { relations } from "drizzle-orm";
import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { appraisals } from "./appraisals";
import { user } from "./auth";

export const appraisalFollowupTypeEnum = pgEnum("appraisal_followup_type", [
  "three_month",
  "six_month",
  "custom",
]);

export const appraisalFollowups = pgTable(
  "appraisal_followups",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    appraisalId: text("appraisal_id")
      .notNull()
      .references(() => appraisals.id, { onDelete: "cascade" }),
    followUpType: appraisalFollowupTypeEnum("follow_up_type").notNull(),
    dueDate: date("due_date").notNull(),
    completedAt: timestamp("completed_at"),
    completedById: text("completed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("appraisal_followups_appraisal_followup_type_unique").on(
      table.appraisalId,
      table.followUpType,
    ),
    index("appraisal_followups_appraisalId_idx").on(table.appraisalId),
    index("appraisal_followups_dueDate_idx").on(table.dueDate),
  ],
);

export const appraisalFollowupsRelations = relations(
  appraisalFollowups,
  ({ one }) => ({
    appraisal: one(appraisals, {
      fields: [appraisalFollowups.appraisalId],
      references: [appraisals.id],
    }),
    completedBy: one(user, {
      fields: [appraisalFollowups.completedById],
      references: [user.id],
      relationName: "appraisalFollowupCompletedBy",
    }),
  }),
);
