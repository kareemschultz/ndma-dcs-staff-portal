import {
  date,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { user } from "./auth";
import { departments } from "./departments";
import { staffProfiles } from "./staff";
import { workItems } from "./work";

// ── Service Registry ───────────────────────────────────────────────────────

export const services = pgTable(
  "services",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
    description: text("description"),
    departmentId: text("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    ownerStaffId: text("owner_staff_id").references(() => staffProfiles.id, {
      onDelete: "set null",
    }),
    runbookUrl: text("runbook_url"),
    docsUrl: text("docs_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
);

// ── Incidents ──────────────────────────────────────────────────────────────

export const incidentSeverityEnum = pgEnum("incident_severity", [
  "sev1",
  "sev2",
  "sev3",
  "sev4",
]);

export const incidentStatusEnum = pgEnum("incident_status", [
  "detected",
  "investigating",
  "identified",
  "mitigating",
  "resolved",
  "post_mortem",
  "closed",
]);

export const incidents = pgTable(
  "incidents",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    description: text("description"),
    severity: incidentSeverityEnum("severity").notNull(),
    status: incidentStatusEnum("status").notNull().default("detected"),
    reportedById: text("reported_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    // Incident commander (on-call lead or assigned responder)
    commanderId: text("commander_id").references(() => staffProfiles.id, {
      onDelete: "set null",
    }),
    detectedAt: timestamp("detected_at").defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at"),
    closedAt: timestamp("closed_at"),
    impactSummary: text("impact_summary"),
    rootCause: text("root_cause"),
    linkedWorkItemId: text("linked_work_item_id").references(
      () => workItems.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("incidents_severity_idx").on(table.severity),
    index("incidents_status_idx").on(table.status),
    index("incidents_detectedAt_idx").on(table.detectedAt),
  ],
);

export const incidentAffectedServices = pgTable(
  "incident_affected_services",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    incidentId: text("incident_id")
      .notNull()
      .references(() => incidents.id, { onDelete: "cascade" }),
    serviceId: text("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    impactDescription: text("impact_description"),
  },
  (table) => [
    unique("incident_affected_services_unique").on(
      table.incidentId,
      table.serviceId,
    ),
  ],
);

export const incidentResponders = pgTable(
  "incident_responders",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    incidentId: text("incident_id")
      .notNull()
      .references(() => incidents.id, { onDelete: "cascade" }),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    // Role in the incident: commander / comms / technical / observer
    role: text("role").notNull().default("technical"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    leftAt: timestamp("left_at"),
  },
  (table) => [
    unique("incident_responders_unique").on(
      table.incidentId,
      table.staffProfileId,
    ),
  ],
);

export const incidentTimeline = pgTable(
  "incident_timeline",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    incidentId: text("incident_id")
      .notNull()
      .references(() => incidents.id, { onDelete: "cascade" }),
    authorId: text("author_id").references(() => user.id, {
      onDelete: "set null",
    }),
    // status_change | note | escalation | action_taken
    eventType: text("event_type").notNull(),
    content: text("content").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("incident_timeline_incidentId_idx").on(table.incidentId)],
);

export const postIncidentReviews = pgTable("post_incident_reviews", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  incidentId: text("incident_id")
    .notNull()
    .unique()
    .references(() => incidents.id, { onDelete: "cascade" }),
  ledById: text("led_by_id").references(() => staffProfiles.id, {
    onDelete: "set null",
  }),
  reviewDate: date("review_date"),
  summary: text("summary"),
  lessonsLearned: text("lessons_learned"),
  actionItems: jsonb("action_items").$type<
    { description: string; ownerId?: string; dueDate?: string }[]
  >(),
  // scheduled | in_progress | completed
  status: text("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ── Relations ─────────────────────────────────────────────────────────────────

export const servicesRelations = relations(services, ({ one, many }) => ({
  department: one(departments, {
    fields: [services.departmentId],
    references: [departments.id],
  }),
  owner: one(staffProfiles, {
    fields: [services.ownerStaffId],
    references: [staffProfiles.id],
  }),
  affectedByIncidents: many(incidentAffectedServices),
}));

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  reportedBy: one(user, {
    fields: [incidents.reportedById],
    references: [user.id],
  }),
  commander: one(staffProfiles, {
    fields: [incidents.commanderId],
    references: [staffProfiles.id],
  }),
  affectedServices: many(incidentAffectedServices),
  responders: many(incidentResponders),
  timeline: many(incidentTimeline),
  pir: one(postIncidentReviews, {
    fields: [incidents.id],
    references: [postIncidentReviews.incidentId],
  }),
}));

export const incidentAffectedServicesRelations = relations(
  incidentAffectedServices,
  ({ one }) => ({
    incident: one(incidents, {
      fields: [incidentAffectedServices.incidentId],
      references: [incidents.id],
    }),
    service: one(services, {
      fields: [incidentAffectedServices.serviceId],
      references: [services.id],
    }),
  }),
);

export const incidentRespondersRelations = relations(
  incidentResponders,
  ({ one }) => ({
    incident: one(incidents, {
      fields: [incidentResponders.incidentId],
      references: [incidents.id],
    }),
    staffProfile: one(staffProfiles, {
      fields: [incidentResponders.staffProfileId],
      references: [staffProfiles.id],
    }),
  }),
);

export const incidentTimelineRelations = relations(
  incidentTimeline,
  ({ one }) => ({
    incident: one(incidents, {
      fields: [incidentTimeline.incidentId],
      references: [incidents.id],
    }),
    author: one(user, {
      fields: [incidentTimeline.authorId],
      references: [user.id],
    }),
  }),
);

export const postIncidentReviewsRelations = relations(
  postIncidentReviews,
  ({ one }) => ({
    incident: one(incidents, {
      fields: [postIncidentReviews.incidentId],
      references: [incidents.id],
    }),
    ledBy: one(staffProfiles, {
      fields: [postIncidentReviews.ledById],
      references: [staffProfiles.id],
    }),
  }),
);
