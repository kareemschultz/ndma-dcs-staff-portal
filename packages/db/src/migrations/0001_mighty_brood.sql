CREATE TYPE "public"."contract_renewal_status" AS ENUM('not_required', 'pending', 'requested', 'approved', 'issued', 'completed', 'declined');--> statement-breakpoint
ALTER TYPE "public"."import_type" ADD VALUE 'ppe';--> statement-breakpoint
ALTER TYPE "public"."import_type" ADD VALUE 'attendance';--> statement-breakpoint
ALTER TYPE "public"."import_type" ADD VALUE 'callouts';--> statement-breakpoint
CREATE TABLE "leave_policies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"department_id" text,
	"leave_type_id" text,
	"max_concurrent_absences" integer DEFAULT 2 NOT NULL,
	"max_requests_per_year" integer,
	"requires_hr_override_for_split" boolean DEFAULT false NOT NULL,
	"allow_carry_over" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leave_policies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "renewal_status" "contract_renewal_status" DEFAULT 'not_required' NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "renewal_letter_required_by" date;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "renewal_requested_at" timestamp;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "renewal_requested_by_id" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "renewal_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "leave_policies" ADD CONSTRAINT "leave_policies_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_policies" ADD CONSTRAINT "leave_policies_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leave_policies_departmentId_idx" ON "leave_policies" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "leave_policies_leaveTypeId_idx" ON "leave_policies" USING btree ("leave_type_id");--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_renewal_requested_by_id_user_id_fk" FOREIGN KEY ("renewal_requested_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temp_change_links" ADD CONSTRAINT "temp_change_links_work_item_id_work_items_id_fk" FOREIGN KEY ("work_item_id") REFERENCES "public"."work_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temp_change_links" ADD CONSTRAINT "temp_change_links_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temp_change_links" ADD CONSTRAINT "temp_change_links_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temporary_changes" ADD CONSTRAINT "temporary_changes_requested_by_id_staff_profiles_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."staff_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temporary_changes" ADD CONSTRAINT "temporary_changes_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_initiative_id_work_initiatives_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."work_initiatives"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_parent_id_work_items_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."work_items"("id") ON DELETE set null ON UPDATE no action;