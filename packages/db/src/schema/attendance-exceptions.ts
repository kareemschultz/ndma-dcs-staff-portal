import { relations } from "drizzle-orm";
import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { leaveRequests } from "./leave";
import { staffProfiles } from "./staff";
import { user } from "./auth";

export const attendanceExceptionTypeEnum = pgEnum("attendance_exception_type", [
  "sick",
  "medical",
  "lateness",
  "early_leave",
  "wfh",
  "absent",
  "time_off",
]);

export const attendanceExceptionStatusEnum = pgEnum(
  "attendance_exception_status",
  ["draft", "submitted", "approved", "rejected", "cancelled"],
);

export const attendanceExceptions = pgTable(
  "attendance_exceptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    leaveRequestId: text("leave_request_id").references(() => leaveRequests.id, {
      onDelete: "set null",
    }),
    exceptionDate: date("exception_date").notNull(),
    exceptionType: attendanceExceptionTypeEnum("exception_type").notNull(),
    hours: text("hours"),
    reason: text("reason"),
    notes: text("notes"),
    status: attendanceExceptionStatusEnum("status")
      .notNull()
      .default("submitted"),
    reviewedById: text("reviewed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("attendance_exceptions_staffProfileId_idx").on(table.staffProfileId),
    index("attendance_exceptions_leaveRequestId_idx").on(table.leaveRequestId),
    index("attendance_exceptions_exceptionDate_idx").on(table.exceptionDate),
    index("attendance_exceptions_status_idx").on(table.status),
  ],
);

export const attendanceExceptionsRelations = relations(
  attendanceExceptions,
  ({ one }) => ({
    staffProfile: one(staffProfiles, {
      fields: [attendanceExceptions.staffProfileId],
      references: [staffProfiles.id],
    }),
    leaveRequest: one(leaveRequests, {
      fields: [attendanceExceptions.leaveRequestId],
      references: [leaveRequests.id],
    }),
    reviewedBy: one(user, {
      fields: [attendanceExceptions.reviewedById],
      references: [user.id],
      relationName: "attendanceExceptionReviewedBy",
    }),
  }),
);
