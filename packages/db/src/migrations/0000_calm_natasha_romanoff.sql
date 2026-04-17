CREATE TYPE "public"."access_group_type" AS ENUM('ad_group', 'vpn_group', 'platform_role', 'local_group', 'radius_group');--> statement-breakpoint
CREATE TYPE "public"."access_review_status" AS ENUM('pending', 'approved', 'revoked', 'escalated');--> statement-breakpoint
CREATE TYPE "public"."account_status" AS ENUM('active', 'suspended', 'disabled', 'pending_creation', 'orphaned', 'pending_review');--> statement-breakpoint
CREATE TYPE "public"."auth_source" AS ENUM('local', 'active_directory', 'ldap', 'radius', 'saml', 'oauth_oidc', 'service_account', 'api_only');--> statement-breakpoint
CREATE TYPE "public"."integration_status" AS ENUM('active', 'inactive', 'error', 'pending');--> statement-breakpoint
CREATE TYPE "public"."platform_type" AS ENUM('vpn', 'fortigate', 'uportal', 'biometric', 'ad', 'ipam', 'phpipam', 'radius', 'zabbix', 'esight', 'ivs_neteco', 'nce_fan_atp', 'neteco', 'lte_grafana', 'gen_grafana', 'plum', 'kibana', 'other');--> statement-breakpoint
CREATE TYPE "public"."reconciliation_issue_type" AS ENUM('orphaned_account', 'stale_account', 'no_staff_link', 'username_mismatch', 'duplicate', 'disabled_staff_active_account', 'expired_contractor', 'missing_internally', 'missing_externally');--> statement-breakpoint
CREATE TYPE "public"."sync_direction" AS ENUM('inbound', 'outbound', 'bidirectional');--> statement-breakpoint
CREATE TYPE "public"."sync_job_status" AS ENUM('pending', 'running', 'completed', 'failed', 'partial');--> statement-breakpoint
CREATE TYPE "public"."sync_mode" AS ENUM('manual', 'synced', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."user_affiliation" AS ENUM('ndma_internal', 'external_agency', 'contractor', 'consultant', 'vendor', 'shared_service');--> statement-breakpoint
CREATE TYPE "public"."appraisal_cycle_half" AS ENUM('h1', 'h2');--> statement-breakpoint
CREATE TYPE "public"."appraisal_cycle_status" AS ENUM('draft', 'open', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."appraisal_followup_type" AS ENUM('three_month', 'six_month', 'custom');--> statement-breakpoint
CREATE TYPE "public"."appraisal_status" AS ENUM('draft', 'scheduled', 'in_progress', 'submitted', 'approved', 'rejected', 'completed', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."attendance_exception_status" AS ENUM('draft', 'submitted', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."attendance_exception_type" AS ENUM('reported_sick', 'medical', 'absent', 'lateness', 'wfh', 'early_leave', 'other');--> statement-breakpoint
CREATE TYPE "public"."automation_trigger_module" AS ENUM('work', 'incident', 'leave', 'temp_changes', 'procurement', 'rota');--> statement-breakpoint
CREATE TYPE "public"."callout_status" AS ENUM('logged', 'reviewed', 'closed');--> statement-breakpoint
CREATE TYPE "public"."callout_type" AS ENUM('phone', 'sms', 'whatsapp', 'email', 'manual');--> statement-breakpoint
CREATE TYPE "public"."compliance_item_status" AS ENUM('current', 'expiring_soon', 'expired', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('active', 'expiring_soon', 'expired', 'renewed', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."cycle_period" AS ENUM('weekly', 'fortnightly', 'monthly', 'quarterly', 'custom');--> statement-breakpoint
CREATE TYPE "public"."cycle_status" AS ENUM('draft', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."department_assignment_history_action" AS ENUM('created', 'updated', 'deactivated', 'reactivated');--> statement-breakpoint
CREATE TYPE "public"."department_assignment_role" AS ENUM('manager', 'pa', 'team_lead', 'supervisor');--> statement-breakpoint
CREATE TYPE "public"."career_path_plan_status" AS ENUM('active', 'paused', 'completed');--> statement-breakpoint
CREATE TYPE "public"."performance_journal_entry_type" AS ENUM('note', 'achievement', 'concern', 'amendment');--> statement-breakpoint
CREATE TYPE "public"."promotion_letter_status" AS ENUM('draft', 'issued', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."promotion_recommendation_status" AS ENUM('draft', 'submitted', 'approved', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."staff_feedback_status" AS ENUM('draft', 'submitted', 'reviewed', 'closed');--> statement-breakpoint
CREATE TYPE "public"."import_job_status" AS ENUM('pending', 'running', 'completed', 'failed', 'partial');--> statement-breakpoint
CREATE TYPE "public"."import_type" AS ENUM('staff', 'training', 'contracts', 'work', 'platform_accounts', 'leave');--> statement-breakpoint
CREATE TYPE "public"."incident_severity" AS ENUM('sev1', 'sev2', 'sev3', 'sev4');--> statement-breakpoint
CREATE TYPE "public"."incident_status" AS ENUM('detected', 'investigating', 'identified', 'mitigating', 'resolved', 'post_mortem', 'closed');--> statement-breakpoint
CREATE TYPE "public"."ppe_issuance_status" AS ENUM('issued', 'returned', 'lost', 'damaged', 'replaced');--> statement-breakpoint
CREATE TYPE "public"."timesheet_status" AS ENUM('draft', 'submitted', 'approved', 'rejected', 'closed');--> statement-breakpoint
CREATE TYPE "public"."maintenance_assignment_status" AS ENUM('draft', 'scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."maintenance_assignment_type" AS ENUM('cleaning_server_room', 'routine_maintenance_dcs', 'fire_detection_test');--> statement-breakpoint
CREATE TYPE "public"."roster_schedule_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."roster_shift_type" AS ENUM('day', 'swing', 'night');--> statement-breakpoint
CREATE TYPE "public"."roster_swap_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."leave_request_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('in_app', 'email');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'read', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."pr_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."pr_status" AS ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'ordered', 'received', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('full_time', 'part_time', 'contract', 'temporary');--> statement-breakpoint
CREATE TYPE "public"."staff_status" AS ENUM('active', 'inactive', 'on_leave', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."conflict_type" AS ENUM('approved_leave', 'sick_leave', 'training', 'contract_expired', 'manually_unavailable', 'duplicate_assignment', 'missing_role');--> statement-breakpoint
CREATE TYPE "public"."on_call_role" AS ENUM('lead_engineer', 'asn_support', 'core_support', 'enterprise_support');--> statement-breakpoint
CREATE TYPE "public"."schedule_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."swap_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."overlay_task_status" AS ENUM('pending', 'in_progress', 'completed', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."temp_change_category" AS ENUM('public_ip_exposure', 'temporary_service', 'temporary_access', 'temporary_change', 'other');--> statement-breakpoint
CREATE TYPE "public"."temp_change_owner_type" AS ENUM('internal_staff', 'external_contact', 'department', 'system');--> statement-breakpoint
CREATE TYPE "public"."temp_change_risk" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."temp_change_status" AS ENUM('planned', 'implemented', 'active', 'overdue', 'removed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."work_item_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."work_item_status" AS ENUM('backlog', 'todo', 'in_progress', 'blocked', 'review', 'done', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."work_item_type" AS ENUM('routine', 'project', 'external_request', 'ad_hoc');--> statement-breakpoint
CREATE TABLE "access_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"platform" "platform_type" NOT NULL,
	"group_type" "access_group_type" NOT NULL,
	"description" text,
	"external_id" text,
	"sync_mode" "sync_mode" DEFAULT 'manual' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "access_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"platform_account_id" text NOT NULL,
	"reviewer_id" text,
	"status" "access_review_status" DEFAULT 'pending' NOT NULL,
	"reviewed_at" timestamp,
	"next_review_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_group_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"platform_account_id" text NOT NULL,
	"access_group_id" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"removed_at" timestamp,
	"added_by_user_id" text,
	CONSTRAINT "account_group_memberships_unique" UNIQUE("platform_account_id","access_group_id")
);
--> statement-breakpoint
CREATE TABLE "external_contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"organization" text,
	"phone" text,
	"affiliation_type" "user_affiliation" DEFAULT 'external_agency' NOT NULL,
	"linked_staff_profile_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_profile_id" text,
	"external_contact_id" text,
	"platform" "platform_type" NOT NULL,
	"account_identifier" text NOT NULL,
	"display_name" text,
	"email" text,
	"affiliation_type" "user_affiliation" DEFAULT 'ndma_internal' NOT NULL,
	"auth_source" "auth_source" DEFAULT 'local' NOT NULL,
	"privilege_level" text,
	"status" "account_status" DEFAULT 'active' NOT NULL,
	"vpn_enabled" boolean DEFAULT false NOT NULL,
	"vpn_group" text,
	"vpn_profile" text,
	"sync_mode" "sync_mode" DEFAULT 'manual' NOT NULL,
	"external_account_id" text,
	"sync_source_system" text,
	"last_synced_at" timestamp,
	"provisioned_at" date,
	"expires_at" date,
	"review_due_date" date,
	"last_reviewed_at" date,
	"last_verified_at" date,
	"disabled_at" timestamp,
	"is_orphaned" boolean DEFAULT false NOT NULL,
	"is_stale" boolean DEFAULT false NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_accounts_platform_identifier_unique" UNIQUE("platform","account_identifier")
);
--> statement-breakpoint
CREATE TABLE "platform_integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"platform" "platform_type" NOT NULL,
	"description" text,
	"owner_staff_id" text,
	"support_team" text,
	"auth_models_supported" jsonb,
	"runbook_url" text,
	"documentation_url" text,
	"has_api" boolean DEFAULT false NOT NULL,
	"sync_enabled" boolean DEFAULT false NOT NULL,
	"sync_direction" "sync_direction" DEFAULT 'inbound' NOT NULL,
	"sync_frequency_minutes" integer,
	"authoritative_source" text DEFAULT 'external',
	"manual_fallback_allowed" boolean DEFAULT true NOT NULL,
	"api_base_url" text,
	"config" jsonb,
	"status" "integration_status" DEFAULT 'pending' NOT NULL,
	"last_sync_at" timestamp,
	"last_sync_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reconciliation_issues" (
	"id" text PRIMARY KEY NOT NULL,
	"sync_job_id" text,
	"integration_id" text NOT NULL,
	"issue_type" "reconciliation_issue_type" NOT NULL,
	"platform_account_id" text,
	"external_account_id" text,
	"staff_profile_id" text,
	"details" text,
	"resolved_at" timestamp,
	"resolved_by_user_id" text,
	"resolution_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_owners" (
	"id" text PRIMARY KEY NOT NULL,
	"service_id" text NOT NULL,
	"staff_profile_id" text NOT NULL,
	"role" text DEFAULT 'owner' NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_owners_unique" UNIQUE("service_id","staff_profile_id")
);
--> statement-breakpoint
CREATE TABLE "sync_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"integration_id" text NOT NULL,
	"triggered_by" text DEFAULT 'manual' NOT NULL,
	"triggered_by_user_id" text,
	"status" "sync_job_status" DEFAULT 'pending' NOT NULL,
	"records_processed" integer DEFAULT 0,
	"records_created" integer DEFAULT 0,
	"records_updated" integer DEFAULT 0,
	"records_skipped" integer DEFAULT 0,
	"errors" jsonb,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appraisal_cycles" (
	"id" text PRIMARY KEY NOT NULL,
	"department_id" text,
	"year" integer NOT NULL,
	"half" "appraisal_cycle_half" NOT NULL,
	"title" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "appraisal_cycle_status" DEFAULT 'draft' NOT NULL,
	"opened_at" timestamp,
	"opened_by_id" text,
	"closed_at" timestamp,
	"closed_by_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "appraisal_cycles_department_year_half_unique" UNIQUE("department_id","year","half")
);
--> statement-breakpoint
CREATE TABLE "appraisal_followups" (
	"id" text PRIMARY KEY NOT NULL,
	"appraisal_id" text NOT NULL,
	"follow_up_type" "appraisal_followup_type" NOT NULL,
	"due_date" date NOT NULL,
	"completed_at" timestamp,
	"completed_by_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "appraisal_followups_appraisal_followup_type_unique" UNIQUE("appraisal_id","follow_up_type")
);
--> statement-breakpoint
CREATE TABLE "appraisals" (
	"id" text PRIMARY KEY NOT NULL,
	"cycle_id" text,
	"staff_profile_id" text NOT NULL,
	"reviewer_id" text,
	"team_lead_id" text,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"scheduled_date" date,
	"completed_date" date,
	"status" "appraisal_status" DEFAULT 'scheduled' NOT NULL,
	"submitted_at" timestamp,
	"submitted_by_id" text,
	"approved_at" timestamp,
	"approved_by_id" text,
	"rejected_at" timestamp,
	"rejected_by_id" text,
	"rejection_reason" text,
	"percentage_score" integer,
	"location" text,
	"type_of_review" text,
	"achievements" jsonb,
	"goals" jsonb,
	"staff_feedback" text,
	"supervisor_comments" text,
	"manager_comments" text,
	"immutable_from" timestamp,
	"overall_rating" integer,
	"summary" text,
	"rating_matrix" jsonb,
	"objectives" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_exceptions" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_profile_id" text NOT NULL,
	"leave_request_id" text,
	"exception_date" date NOT NULL,
	"exception_type" "attendance_exception_type" NOT NULL,
	"hours" text,
	"reason" text,
	"notes" text,
	"minutes_late" integer,
	"status" "attendance_exception_status" DEFAULT 'draft' NOT NULL,
	"reviewed_by_id" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"actor_name" text,
	"actor_role" text,
	"action" text NOT NULL,
	"module" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"before_value" jsonb,
	"after_value" jsonb,
	"ip_address" text,
	"user_agent" text,
	"correlation_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_rule_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"rule_id" text NOT NULL,
	"fired_at" timestamp DEFAULT now() NOT NULL,
	"trigger_payload" jsonb,
	"actions_executed" jsonb,
	"success" boolean NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "automation_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"trigger_module" "automation_trigger_module" NOT NULL,
	"trigger_event" text NOT NULL,
	"conditions" jsonb NOT NULL,
	"actions" jsonb NOT NULL,
	"last_fired_at" timestamp,
	"fire_count" integer DEFAULT 0 NOT NULL,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "callouts" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_profile_id" text NOT NULL,
	"related_incident_id" text,
	"callout_at" timestamp NOT NULL,
	"callout_type" "callout_type" DEFAULT 'manual' NOT NULL,
	"reason" text NOT NULL,
	"outcome" text,
	"status" "callout_status" DEFAULT 'logged' NOT NULL,
	"reviewed_by_id" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_acknowledgements" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_profile_id" text NOT NULL,
	"policy_name" text NOT NULL,
	"policy_version" text NOT NULL,
	"acknowledged_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ppe_records" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_profile_id" text NOT NULL,
	"item_name" text NOT NULL,
	"issued_date" date,
	"expiry_date" date,
	"size" text,
	"condition" text DEFAULT 'good' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_records" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_profile_id" text NOT NULL,
	"training_name" text NOT NULL,
	"provider" text,
	"completed_date" date,
	"expiry_date" date,
	"certificate_url" text,
	"status" "compliance_item_status" DEFAULT 'current' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_profile_id" text NOT NULL,
	"contract_type" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"renewal_reminder_days" integer DEFAULT 60 NOT NULL,
	"status" "contract_status" DEFAULT 'active' NOT NULL,
	"document_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cycle_work_items" (
	"id" text PRIMARY KEY NOT NULL,
	"cycle_id" text NOT NULL,
	"work_item_id" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cycle_work_items_unique" UNIQUE("cycle_id","work_item_id")
);
--> statement-breakpoint
CREATE TABLE "cycles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"period" "cycle_period" DEFAULT 'weekly' NOT NULL,
	"department_id" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "cycle_status" DEFAULT 'draft' NOT NULL,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "department_assignment_history" (
	"id" text PRIMARY KEY NOT NULL,
	"department_assignment_id" text NOT NULL,
	"action" "department_assignment_history_action" NOT NULL,
	"before_value" text,
	"after_value" text,
	"changed_by_id" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "department_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_profile_id" text NOT NULL,
	"department_id" text NOT NULL,
	"role" "department_assignment_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by_id" text,
	"ended_at" timestamp,
	"ended_by_id" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "department_assignments_staff_department_role_unique" UNIQUE("staff_profile_id","department_id","role")
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"parent_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "departments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "escalation_policies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"service_id" text,
	"department_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "escalation_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"policy_id" text NOT NULL,
	"step_order" integer NOT NULL,
	"delay_minutes" integer DEFAULT 15 NOT NULL,
	"notify_on_call_role" "on_call_role",
	"notify_staff_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "on_call_overrides" (
	"id" text PRIMARY KEY NOT NULL,
	"schedule_id" text NOT NULL,
	"original_staff_id" text NOT NULL,
	"override_staff_id" text NOT NULL,
	"role" "on_call_role" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"reason" text,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_path_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_profile_id" text NOT NULL,
	"created_by_id" text,
	"current_level" text NOT NULL,
	"target_level" text,
	"current_track" text,
	"next_review_date" date,
	"status" "career_path_plan_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "career_path_plans_staffProfile_unique" UNIQUE("staff_profile_id")
);
--> statement-breakpoint
CREATE TABLE "career_path_years" (
	"id" text PRIMARY KEY NOT NULL,
	"career_path_plan_id" text NOT NULL,
	"year_number" integer NOT NULL,
	"title" text NOT NULL,
	"goals" jsonb DEFAULT '[]'::jsonb,
	"prerequisites" jsonb DEFAULT '[]'::jsonb,
	"status" "career_path_plan_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "career_path_years_plan_year_unique" UNIQUE("career_path_plan_id","year_number")
);
--> statement-breakpoint
CREATE TABLE "performance_journal_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_profile_id" text NOT NULL,
	"appraisal_id" text,
	"linked_entry_id" text,
	"author_id" text,
	"entry_type" "performance_journal_entry_type" DEFAULT 'note' NOT NULL,
	"body" text NOT NULL,
	"visible_to_staff" boolean DEFAULT false NOT NULL,
	"entry_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotion_letters" (
	"id" text PRIMARY KEY NOT NULL,
	"recommendation_id" text NOT NULL,
	"staff_profile_id" text NOT NULL,
	"issued_by_id" text,
	"letter_number" text,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"status" "promotion_letter_status" DEFAULT 'draft' NOT NULL,
	"issued_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "promotion_letters_recommendation_unique" UNIQUE("recommendation_id")
);
--> statement-breakpoint
CREATE TABLE "promotion_recommendations" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_profile_id" text NOT NULL,
	"appraisal_id" text,
	"requested_by_id" text,
	"reviewed_by_id" text,
	"approved_by_id" text,
	"status" "promotion_recommendation_status" DEFAULT 'draft' NOT NULL,
	"reason" text,
	"details" text,
	"review_notes" text,
	"rejection_reason" text,
	"submitted_at" timestamp,
	"reviewed_at" timestamp,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_profile_id" text NOT NULL,
	"appraisal_id" text,
	"author_id" text,
	"category" text NOT NULL,
	"rating" integer,
	"comments" text NOT NULL,
	"status" "staff_feedback_status" DEFAULT 'submitted' NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"import_type" "import_type" NOT NULL,
	"status" "import_job_status" DEFAULT 'pending' NOT NULL,
	"file_name" text,
	"total_rows" integer DEFAULT 0,
	"success_count" integer DEFAULT 0,
	"error_count" integer DEFAULT 0,
	"skipped_count" integer DEFAULT 0,
	"errors" jsonb,
	"created_by_user_id" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incident_affected_services" (
	"id" text PRIMARY KEY NOT NULL,
	"incident_id" text NOT NULL,
	"service_id" text NOT NULL,
	"impact_description" text,
	CONSTRAINT "incident_affected_services_unique" UNIQUE("incident_id","service_id")
);
--> statement-breakpoint
CREATE TABLE "incident_responders" (
	"id" text PRIMARY KEY NOT NULL,
	"incident_id" text NOT NULL,
	"staff_profile_id" text NOT NULL,
	"role" text DEFAULT 'technical' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp,
	CONSTRAINT "incident_responders_unique" UNIQUE("incident_id","staff_profile_id")
);
--> statement-breakpoint
CREATE TABLE "incident_timeline" (
	"id" text PRIMARY KEY NOT NULL,
	"incident_id" text NOT NULL,
	"author_id" text,
	"event_type" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"severity" "incident_severity" NOT NULL,
	"status" "incident_status" DEFAULT 'detected' NOT NULL,
	"reported_by_id" text,
	"commander_id" text,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"closed_at" timestamp,
	"impact_summary" text,
	"root_cause" text,
	"linked_work_item_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_incident_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"incident_id" text NOT NULL,
	"led_by_id" text,
	"review_date" date,
	"summary" text,
	"lessons_learned" text,
	"action_items" jsonb,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "post_incident_reviews_incident_id_unique" UNIQUE("incident_id")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"department_id" text,
	"owner_staff_id" text,
	"runbook_url" text,
	"docs_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "services_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "ppe_issuances" (
	"id" text PRIMARY KEY NOT NULL,
	"ppe_item_id" text NOT NULL,
	"staff_profile_id" text NOT NULL,
	"issued_by_id" text,
	"returned_by_id" text,
	"serial_number" text,
	"size" text,
	"issued_date" date NOT NULL,
	"due_date" date,
	"returned_date" date,
	"condition" text DEFAULT 'good' NOT NULL,
	"status" "ppe_issuance_status" DEFAULT 'issued' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ppe_issuances_staff_item_unique" UNIQUE("staff_profile_id","ppe_item_id")
);
--> statement-breakpoint
CREATE TABLE "ppe_items" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"description" text,
	"default_size" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ppe_items_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "timesheet_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"timesheet_id" text NOT NULL,
	"work_date" date NOT NULL,
	"hours" numeric(8, 2) NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"related_incident_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timesheets" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_profile_id" text NOT NULL,
	"title" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"total_hours" numeric(8, 2) DEFAULT '0' NOT NULL,
	"status" timesheet_status DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"approved_at" timestamp,
	"reviewed_by_id" text,
	"review_notes" text,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "timesheets_staff_period_unique" UNIQUE("staff_profile_id","period_start","period_end")
);
--> statement-breakpoint
CREATE TABLE "maintenance_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"department_id" text,
	"year" integer NOT NULL,
	"quarter" text NOT NULL,
	"maintenance_type" "maintenance_assignment_type" NOT NULL,
	"staff_profile_id" text,
	"notes" text,
	"status" "maintenance_assignment_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roster_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"schedule_id" text NOT NULL,
	"shift_date" date NOT NULL,
	"shift_type" "roster_shift_type" NOT NULL,
	"staff_profile_id" text NOT NULL,
	"notes" text,
	"acknowledged_at" timestamp,
	"acknowledged_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roster_assignments_schedule_date_type_unique" UNIQUE("schedule_id","shift_date","shift_type")
);
--> statement-breakpoint
CREATE TABLE "roster_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"department_id" text,
	"month_key" text NOT NULL,
	"status" "roster_schedule_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"published_at" timestamp,
	"published_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roster_schedules_monthKey_unique" UNIQUE("month_key")
);
--> statement-breakpoint
CREATE TABLE "roster_swap_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"assignment_id" text NOT NULL,
	"requester_id" text NOT NULL,
	"target_staff_profile_id" text NOT NULL,
	"reason" text,
	"status" "roster_swap_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by_id" text,
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_balances" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_profile_id" text NOT NULL,
	"leave_type_id" text NOT NULL,
	"contract_year_start" date NOT NULL,
	"contract_year_end" date NOT NULL,
	"entitlement" integer NOT NULL,
	"used" integer DEFAULT 0 NOT NULL,
	"carried_over" integer DEFAULT 0 NOT NULL,
	"adjustment" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leave_balances_unique" UNIQUE("staff_profile_id","leave_type_id","contract_year_start")
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_profile_id" text NOT NULL,
	"leave_type_id" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"total_days" integer NOT NULL,
	"reason" text,
	"status" "leave_request_status" DEFAULT 'pending' NOT NULL,
	"approved_by_id" text,
	"approved_at" timestamp,
	"rejection_reason" text,
	"overlap_override" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_types" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"default_annual_allowance" integer DEFAULT 20 NOT NULL,
	"requires_approval" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leave_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"recipient_id" text NOT NULL,
	"channel" "notification_channel" DEFAULT 'in_app' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"module" text NOT NULL,
	"resource_type" text,
	"resource_id" text,
	"link_url" text,
	"status" "notification_status" DEFAULT 'pending' NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pr_approvals" (
	"id" text PRIMARY KEY NOT NULL,
	"pr_id" text NOT NULL,
	"approver_id" text,
	"action" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pr_line_items" (
	"id" text PRIMARY KEY NOT NULL,
	"pr_id" text NOT NULL,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_cost" numeric(14, 2) NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"total_cost" numeric(14, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_requisitions" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"justification" text,
	"requested_by_id" text,
	"department_id" text,
	"priority" "pr_priority" DEFAULT 'medium' NOT NULL,
	"status" "pr_status" DEFAULT 'draft' NOT NULL,
	"total_estimated_cost" numeric(14, 2),
	"currency" text DEFAULT 'GHS' NOT NULL,
	"approved_by_id" text,
	"approved_at" timestamp,
	"rejection_reason" text,
	"vendor_name" text,
	"vendor_reference" text,
	"expected_delivery_date" date,
	"actual_delivery_date" date,
	"notes" text,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"department_id" text NOT NULL,
	"job_title" text NOT NULL,
	"employment_type" "employment_type" DEFAULT 'full_time' NOT NULL,
	"status" "staff_status" DEFAULT 'active' NOT NULL,
	"is_team_lead" boolean DEFAULT false NOT NULL,
	"is_lead_engineer_eligible" boolean DEFAULT false NOT NULL,
	"is_on_call_eligible" boolean DEFAULT true NOT NULL,
	"team_lead_id" text,
	"contract_expires_at" timestamp,
	"start_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "staff_profiles_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "assignment_history" (
	"id" text PRIMARY KEY NOT NULL,
	"schedule_id" text NOT NULL,
	"assignment_id" text,
	"staff_profile_id" text,
	"role" "on_call_role",
	"action" text NOT NULL,
	"performed_by_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "on_call_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"schedule_id" text NOT NULL,
	"staff_profile_id" text NOT NULL,
	"role" "on_call_role" NOT NULL,
	"conflict_flags" jsonb DEFAULT '[]'::jsonb,
	"is_confirmed" boolean DEFAULT false NOT NULL,
	"notified_at" timestamp,
	"acknowledged_at" timestamp,
	"acknowledged_by_id" text,
	"is_legacy_import" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "on_call_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"week_start" date NOT NULL,
	"week_end" date NOT NULL,
	"status" "schedule_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"published_by_id" text,
	"notes" text,
	"has_conflicts" boolean DEFAULT false NOT NULL,
	"is_legacy_import" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "on_call_schedules_week_start_unique" UNIQUE("week_start")
);
--> statement-breakpoint
CREATE TABLE "on_call_swaps" (
	"id" text PRIMARY KEY NOT NULL,
	"assignment_id" text NOT NULL,
	"requester_id" text NOT NULL,
	"target_id" text NOT NULL,
	"reason" text,
	"status" "swap_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by_id" text,
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rota_import_warnings" (
	"id" text PRIMARY KEY NOT NULL,
	"schedule_id" text,
	"week_start" date NOT NULL,
	"week_end" date NOT NULL,
	"role" "on_call_role" NOT NULL,
	"raw_value" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"resolved_by_id" text,
	"resolved_at" timestamp,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "overlay_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"overlay_schedule_id" text NOT NULL,
	"staff_profile_id" text,
	"external_label" text,
	"role_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "overlay_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"overlay_type_id" text NOT NULL,
	"quarter" text NOT NULL,
	"year" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "overlay_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"overlay_schedule_id" text NOT NULL,
	"name" text NOT NULL,
	"due_date" date,
	"assigned_to_id" text,
	"assigned_to_external" text,
	"status" "overlay_task_status" DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp,
	"completed_by_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "overlay_types" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "overlay_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "temp_change_history" (
	"id" text PRIMARY KEY NOT NULL,
	"temp_change_id" text NOT NULL,
	"action" text NOT NULL,
	"performed_by_name" text,
	"performed_by_id" text,
	"old_values" jsonb,
	"new_values" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "temp_change_links" (
	"id" text PRIMARY KEY NOT NULL,
	"temp_change_id" text NOT NULL,
	"work_item_id" text,
	"incident_id" text,
	"service_id" text,
	"link_type" text DEFAULT 'related',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "temporary_changes" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"justification" text,
	"owner_id" text,
	"service_id" text,
	"implementation_date" date,
	"remove_by_date" date,
	"actual_removal_date" date,
	"status" "temp_change_status" DEFAULT 'planned' NOT NULL,
	"rollback_plan" text,
	"follow_up_notes" text,
	"follow_up_date" date,
	"linked_work_item_id" text,
	"approved_by_id" text,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"category" "temp_change_category" DEFAULT 'temporary_change' NOT NULL,
	"risk_level" "temp_change_risk" DEFAULT 'medium' NOT NULL,
	"environment" text DEFAULT 'production',
	"system_name" text,
	"public_ip" text,
	"internal_ip" text,
	"port" text,
	"protocol" text,
	"external_exposure" boolean DEFAULT false NOT NULL,
	"owner_type" "temp_change_owner_type" DEFAULT 'internal_staff',
	"external_agency_name" text,
	"external_agency_type" text,
	"requested_by_type" text DEFAULT 'internal_staff',
	"requested_by_external" text,
	"requested_by_id" text,
	"department_id" text
);
--> statement-breakpoint
CREATE TABLE "work_initiatives" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"department_id" text,
	"target_date" date,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_item_assignees" (
	"id" text PRIMARY KEY NOT NULL,
	"work_item_id" text NOT NULL,
	"staff_profile_id" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"added_by_id" text,
	CONSTRAINT "work_item_assignees_unique" UNIQUE("work_item_id","staff_profile_id")
);
--> statement-breakpoint
CREATE TABLE "work_item_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"work_item_id" text NOT NULL,
	"author_id" text,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_item_dependencies" (
	"id" text PRIMARY KEY NOT NULL,
	"work_item_id" text NOT NULL,
	"depends_on_id" text NOT NULL,
	"dependency_type" text DEFAULT 'blocks' NOT NULL,
	CONSTRAINT "work_item_deps_unique" UNIQUE("work_item_id","depends_on_id")
);
--> statement-breakpoint
CREATE TABLE "work_item_team_allocations" (
	"id" text PRIMARY KEY NOT NULL,
	"work_item_id" text NOT NULL,
	"department_id" text NOT NULL,
	"required_count" integer DEFAULT 1 NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"added_by_id" text,
	CONSTRAINT "work_item_team_alloc_unique" UNIQUE("work_item_id","department_id")
);
--> statement-breakpoint
CREATE TABLE "work_item_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "work_item_type" DEFAULT 'routine' NOT NULL,
	"priority" "work_item_priority" DEFAULT 'medium' NOT NULL,
	"department_id" text,
	"estimated_hours" integer,
	"recurrence_pattern" text NOT NULL,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_item_weekly_updates" (
	"id" text PRIMARY KEY NOT NULL,
	"work_item_id" text NOT NULL,
	"author_id" text,
	"week_start" date NOT NULL,
	"status_summary" text NOT NULL,
	"blockers" text,
	"next_steps" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "work_item_weekly_updates_unique" UNIQUE("work_item_id","week_start")
);
--> statement-breakpoint
CREATE TABLE "work_items" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "work_item_type" DEFAULT 'routine' NOT NULL,
	"status" "work_item_status" DEFAULT 'todo' NOT NULL,
	"priority" "work_item_priority" DEFAULT 'medium' NOT NULL,
	"assigned_to_id" text,
	"department_id" text,
	"requester_name" text,
	"requester_email" text,
	"source_system" text,
	"source_reference" text,
	"due_date" date,
	"completed_at" timestamp,
	"estimated_hours" text,
	"follow_up_date" date,
	"initiative_id" text,
	"parent_id" text,
	"milestone_date" date,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "access_reviews" ADD CONSTRAINT "access_reviews_platform_account_id_platform_accounts_id_fk" FOREIGN KEY ("platform_account_id") REFERENCES "public"."platform_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_reviews" ADD CONSTRAINT "access_reviews_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_group_memberships" ADD CONSTRAINT "account_group_memberships_platform_account_id_platform_accounts_id_fk" FOREIGN KEY ("platform_account_id") REFERENCES "public"."platform_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_group_memberships" ADD CONSTRAINT "account_group_memberships_access_group_id_access_groups_id_fk" FOREIGN KEY ("access_group_id") REFERENCES "public"."access_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_group_memberships" ADD CONSTRAINT "account_group_memberships_added_by_user_id_user_id_fk" FOREIGN KEY ("added_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_contacts" ADD CONSTRAINT "external_contacts_linked_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("linked_staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_contacts" ADD CONSTRAINT "external_contacts_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_accounts" ADD CONSTRAINT "platform_accounts_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_accounts" ADD CONSTRAINT "platform_accounts_external_contact_id_external_contacts_id_fk" FOREIGN KEY ("external_contact_id") REFERENCES "public"."external_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_accounts" ADD CONSTRAINT "platform_accounts_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_accounts" ADD CONSTRAINT "platform_accounts_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_integrations" ADD CONSTRAINT "platform_integrations_owner_staff_id_staff_profiles_id_fk" FOREIGN KEY ("owner_staff_id") REFERENCES "public"."staff_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_issues" ADD CONSTRAINT "reconciliation_issues_sync_job_id_sync_jobs_id_fk" FOREIGN KEY ("sync_job_id") REFERENCES "public"."sync_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_issues" ADD CONSTRAINT "reconciliation_issues_integration_id_platform_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."platform_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_issues" ADD CONSTRAINT "reconciliation_issues_platform_account_id_platform_accounts_id_fk" FOREIGN KEY ("platform_account_id") REFERENCES "public"."platform_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_issues" ADD CONSTRAINT "reconciliation_issues_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_issues" ADD CONSTRAINT "reconciliation_issues_resolved_by_user_id_user_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_owners" ADD CONSTRAINT "service_owners_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_owners" ADD CONSTRAINT "service_owners_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_integration_id_platform_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."platform_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_triggered_by_user_id_user_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appraisal_cycles" ADD CONSTRAINT "appraisal_cycles_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appraisal_cycles" ADD CONSTRAINT "appraisal_cycles_opened_by_id_user_id_fk" FOREIGN KEY ("opened_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appraisal_cycles" ADD CONSTRAINT "appraisal_cycles_closed_by_id_user_id_fk" FOREIGN KEY ("closed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appraisal_followups" ADD CONSTRAINT "appraisal_followups_appraisal_id_appraisals_id_fk" FOREIGN KEY ("appraisal_id") REFERENCES "public"."appraisals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appraisal_followups" ADD CONSTRAINT "appraisal_followups_completed_by_id_user_id_fk" FOREIGN KEY ("completed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appraisals" ADD CONSTRAINT "appraisals_cycle_id_appraisal_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."appraisal_cycles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appraisals" ADD CONSTRAINT "appraisals_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appraisals" ADD CONSTRAINT "appraisals_reviewer_id_staff_profiles_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."staff_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appraisals" ADD CONSTRAINT "appraisals_team_lead_id_staff_profiles_id_fk" FOREIGN KEY ("team_lead_id") REFERENCES "public"."staff_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appraisals" ADD CONSTRAINT "appraisals_submitted_by_id_user_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appraisals" ADD CONSTRAINT "appraisals_approved_by_id_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appraisals" ADD CONSTRAINT "appraisals_rejected_by_id_user_id_fk" FOREIGN KEY ("rejected_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_exceptions" ADD CONSTRAINT "attendance_exceptions_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_exceptions" ADD CONSTRAINT "attendance_exceptions_leave_request_id_leave_requests_id_fk" FOREIGN KEY ("leave_request_id") REFERENCES "public"."leave_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_exceptions" ADD CONSTRAINT "attendance_exceptions_reviewed_by_id_user_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rule_logs" ADD CONSTRAINT "automation_rule_logs_rule_id_automation_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."automation_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "callouts" ADD CONSTRAINT "callouts_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "callouts" ADD CONSTRAINT "callouts_related_incident_id_incidents_id_fk" FOREIGN KEY ("related_incident_id") REFERENCES "public"."incidents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "callouts" ADD CONSTRAINT "callouts_reviewed_by_id_user_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_acknowledgements" ADD CONSTRAINT "policy_acknowledgements_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ppe_records" ADD CONSTRAINT "ppe_records_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_records" ADD CONSTRAINT "training_records_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_work_items" ADD CONSTRAINT "cycle_work_items_cycle_id_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_work_items" ADD CONSTRAINT "cycle_work_items_work_item_id_work_items_id_fk" FOREIGN KEY ("work_item_id") REFERENCES "public"."work_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycles" ADD CONSTRAINT "cycles_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycles" ADD CONSTRAINT "cycles_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_assignment_history" ADD CONSTRAINT "department_assignment_history_department_assignment_id_department_assignments_id_fk" FOREIGN KEY ("department_assignment_id") REFERENCES "public"."department_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_assignment_history" ADD CONSTRAINT "department_assignment_history_changed_by_id_user_id_fk" FOREIGN KEY ("changed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_assignments" ADD CONSTRAINT "department_assignments_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_assignments" ADD CONSTRAINT "department_assignments_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_assignments" ADD CONSTRAINT "department_assignments_assigned_by_id_user_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_assignments" ADD CONSTRAINT "department_assignments_ended_by_id_user_id_fk" FOREIGN KEY ("ended_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_policies" ADD CONSTRAINT "escalation_policies_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_policies" ADD CONSTRAINT "escalation_policies_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_steps" ADD CONSTRAINT "escalation_steps_policy_id_escalation_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."escalation_policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_steps" ADD CONSTRAINT "escalation_steps_notify_staff_id_staff_profiles_id_fk" FOREIGN KEY ("notify_staff_id") REFERENCES "public"."staff_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "on_call_overrides" ADD CONSTRAINT "on_call_overrides_schedule_id_on_call_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."on_call_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "on_call_overrides" ADD CONSTRAINT "on_call_overrides_original_staff_id_staff_profiles_id_fk" FOREIGN KEY ("original_staff_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "on_call_overrides" ADD CONSTRAINT "on_call_overrides_override_staff_id_staff_profiles_id_fk" FOREIGN KEY ("override_staff_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "on_call_overrides" ADD CONSTRAINT "on_call_overrides_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_path_plans" ADD CONSTRAINT "career_path_plans_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_path_plans" ADD CONSTRAINT "career_path_plans_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_path_years" ADD CONSTRAINT "career_path_years_career_path_plan_id_career_path_plans_id_fk" FOREIGN KEY ("career_path_plan_id") REFERENCES "public"."career_path_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_journal_entries" ADD CONSTRAINT "performance_journal_entries_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_journal_entries" ADD CONSTRAINT "performance_journal_entries_appraisal_id_appraisals_id_fk" FOREIGN KEY ("appraisal_id") REFERENCES "public"."appraisals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_journal_entries" ADD CONSTRAINT "performance_journal_entries_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_letters" ADD CONSTRAINT "promotion_letters_recommendation_id_promotion_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."promotion_recommendations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_letters" ADD CONSTRAINT "promotion_letters_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_letters" ADD CONSTRAINT "promotion_letters_issued_by_id_user_id_fk" FOREIGN KEY ("issued_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_recommendations" ADD CONSTRAINT "promotion_recommendations_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_recommendations" ADD CONSTRAINT "promotion_recommendations_appraisal_id_appraisals_id_fk" FOREIGN KEY ("appraisal_id") REFERENCES "public"."appraisals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_recommendations" ADD CONSTRAINT "promotion_recommendations_requested_by_id_user_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_recommendations" ADD CONSTRAINT "promotion_recommendations_reviewed_by_id_user_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_recommendations" ADD CONSTRAINT "promotion_recommendations_approved_by_id_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_feedback" ADD CONSTRAINT "staff_feedback_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_feedback" ADD CONSTRAINT "staff_feedback_appraisal_id_appraisals_id_fk" FOREIGN KEY ("appraisal_id") REFERENCES "public"."appraisals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_feedback" ADD CONSTRAINT "staff_feedback_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_feedback" ADD CONSTRAINT "staff_feedback_reviewed_by_id_user_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_affected_services" ADD CONSTRAINT "incident_affected_services_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_affected_services" ADD CONSTRAINT "incident_affected_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_responders" ADD CONSTRAINT "incident_responders_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_responders" ADD CONSTRAINT "incident_responders_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_timeline" ADD CONSTRAINT "incident_timeline_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_timeline" ADD CONSTRAINT "incident_timeline_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reported_by_id_user_id_fk" FOREIGN KEY ("reported_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_commander_id_staff_profiles_id_fk" FOREIGN KEY ("commander_id") REFERENCES "public"."staff_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_linked_work_item_id_work_items_id_fk" FOREIGN KEY ("linked_work_item_id") REFERENCES "public"."work_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_incident_reviews" ADD CONSTRAINT "post_incident_reviews_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_incident_reviews" ADD CONSTRAINT "post_incident_reviews_led_by_id_staff_profiles_id_fk" FOREIGN KEY ("led_by_id") REFERENCES "public"."staff_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_owner_staff_id_staff_profiles_id_fk" FOREIGN KEY ("owner_staff_id") REFERENCES "public"."staff_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ppe_issuances" ADD CONSTRAINT "ppe_issuances_ppe_item_id_ppe_items_id_fk" FOREIGN KEY ("ppe_item_id") REFERENCES "public"."ppe_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ppe_issuances" ADD CONSTRAINT "ppe_issuances_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ppe_issuances" ADD CONSTRAINT "ppe_issuances_issued_by_id_user_id_fk" FOREIGN KEY ("issued_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ppe_issuances" ADD CONSTRAINT "ppe_issuances_returned_by_id_user_id_fk" FOREIGN KEY ("returned_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_timesheet_id_timesheets_id_fk" FOREIGN KEY ("timesheet_id") REFERENCES "public"."timesheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_related_incident_id_incidents_id_fk" FOREIGN KEY ("related_incident_id") REFERENCES "public"."incidents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_reviewed_by_id_user_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_assignments" ADD CONSTRAINT "maintenance_assignments_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_assignments" ADD CONSTRAINT "maintenance_assignments_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_assignments" ADD CONSTRAINT "roster_assignments_schedule_id_roster_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."roster_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_assignments" ADD CONSTRAINT "roster_assignments_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_assignments" ADD CONSTRAINT "roster_assignments_acknowledged_by_id_user_id_fk" FOREIGN KEY ("acknowledged_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_schedules" ADD CONSTRAINT "roster_schedules_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_schedules" ADD CONSTRAINT "roster_schedules_published_by_id_user_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_swap_requests" ADD CONSTRAINT "roster_swap_requests_assignment_id_roster_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."roster_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_swap_requests" ADD CONSTRAINT "roster_swap_requests_requester_id_staff_profiles_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_swap_requests" ADD CONSTRAINT "roster_swap_requests_target_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("target_staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_swap_requests" ADD CONSTRAINT "roster_swap_requests_reviewed_by_id_user_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approved_by_id_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_approvals" ADD CONSTRAINT "pr_approvals_pr_id_purchase_requisitions_id_fk" FOREIGN KEY ("pr_id") REFERENCES "public"."purchase_requisitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_approvals" ADD CONSTRAINT "pr_approvals_approver_id_user_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_line_items" ADD CONSTRAINT "pr_line_items_pr_id_purchase_requisitions_id_fk" FOREIGN KEY ("pr_id") REFERENCES "public"."purchase_requisitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_requested_by_id_staff_profiles_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."staff_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_approved_by_id_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_history" ADD CONSTRAINT "assignment_history_schedule_id_on_call_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."on_call_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_history" ADD CONSTRAINT "assignment_history_assignment_id_on_call_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."on_call_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_history" ADD CONSTRAINT "assignment_history_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_history" ADD CONSTRAINT "assignment_history_performed_by_id_user_id_fk" FOREIGN KEY ("performed_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "on_call_assignments" ADD CONSTRAINT "on_call_assignments_schedule_id_on_call_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."on_call_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "on_call_assignments" ADD CONSTRAINT "on_call_assignments_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "on_call_assignments" ADD CONSTRAINT "on_call_assignments_acknowledged_by_id_staff_profiles_id_fk" FOREIGN KEY ("acknowledged_by_id") REFERENCES "public"."staff_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "on_call_schedules" ADD CONSTRAINT "on_call_schedules_published_by_id_user_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "on_call_swaps" ADD CONSTRAINT "on_call_swaps_assignment_id_on_call_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."on_call_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "on_call_swaps" ADD CONSTRAINT "on_call_swaps_requester_id_staff_profiles_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."staff_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "on_call_swaps" ADD CONSTRAINT "on_call_swaps_target_id_staff_profiles_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."staff_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "on_call_swaps" ADD CONSTRAINT "on_call_swaps_reviewed_by_id_user_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rota_import_warnings" ADD CONSTRAINT "rota_import_warnings_schedule_id_on_call_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."on_call_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rota_import_warnings" ADD CONSTRAINT "rota_import_warnings_resolved_by_id_user_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overlay_assignments" ADD CONSTRAINT "overlay_assignments_overlay_schedule_id_overlay_schedules_id_fk" FOREIGN KEY ("overlay_schedule_id") REFERENCES "public"."overlay_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overlay_assignments" ADD CONSTRAINT "overlay_assignments_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overlay_schedules" ADD CONSTRAINT "overlay_schedules_overlay_type_id_overlay_types_id_fk" FOREIGN KEY ("overlay_type_id") REFERENCES "public"."overlay_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overlay_tasks" ADD CONSTRAINT "overlay_tasks_overlay_schedule_id_overlay_schedules_id_fk" FOREIGN KEY ("overlay_schedule_id") REFERENCES "public"."overlay_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overlay_tasks" ADD CONSTRAINT "overlay_tasks_assigned_to_id_staff_profiles_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."staff_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overlay_tasks" ADD CONSTRAINT "overlay_tasks_completed_by_id_user_id_fk" FOREIGN KEY ("completed_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temp_change_history" ADD CONSTRAINT "temp_change_history_temp_change_id_temporary_changes_id_fk" FOREIGN KEY ("temp_change_id") REFERENCES "public"."temporary_changes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temp_change_links" ADD CONSTRAINT "temp_change_links_temp_change_id_temporary_changes_id_fk" FOREIGN KEY ("temp_change_id") REFERENCES "public"."temporary_changes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temporary_changes" ADD CONSTRAINT "temporary_changes_owner_id_staff_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."staff_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temporary_changes" ADD CONSTRAINT "temporary_changes_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temporary_changes" ADD CONSTRAINT "temporary_changes_linked_work_item_id_work_items_id_fk" FOREIGN KEY ("linked_work_item_id") REFERENCES "public"."work_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temporary_changes" ADD CONSTRAINT "temporary_changes_approved_by_id_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temporary_changes" ADD CONSTRAINT "temporary_changes_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_initiatives" ADD CONSTRAINT "work_initiatives_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_initiatives" ADD CONSTRAINT "work_initiatives_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_item_assignees" ADD CONSTRAINT "work_item_assignees_work_item_id_work_items_id_fk" FOREIGN KEY ("work_item_id") REFERENCES "public"."work_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_item_assignees" ADD CONSTRAINT "work_item_assignees_staff_profile_id_staff_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_item_assignees" ADD CONSTRAINT "work_item_assignees_added_by_id_user_id_fk" FOREIGN KEY ("added_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_item_comments" ADD CONSTRAINT "work_item_comments_work_item_id_work_items_id_fk" FOREIGN KEY ("work_item_id") REFERENCES "public"."work_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_item_comments" ADD CONSTRAINT "work_item_comments_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_item_dependencies" ADD CONSTRAINT "work_item_dependencies_work_item_id_work_items_id_fk" FOREIGN KEY ("work_item_id") REFERENCES "public"."work_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_item_dependencies" ADD CONSTRAINT "work_item_dependencies_depends_on_id_work_items_id_fk" FOREIGN KEY ("depends_on_id") REFERENCES "public"."work_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_item_team_allocations" ADD CONSTRAINT "work_item_team_allocations_work_item_id_work_items_id_fk" FOREIGN KEY ("work_item_id") REFERENCES "public"."work_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_item_team_allocations" ADD CONSTRAINT "work_item_team_allocations_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_item_team_allocations" ADD CONSTRAINT "work_item_team_allocations_added_by_id_user_id_fk" FOREIGN KEY ("added_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_item_templates" ADD CONSTRAINT "work_item_templates_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_item_templates" ADD CONSTRAINT "work_item_templates_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_item_weekly_updates" ADD CONSTRAINT "work_item_weekly_updates_work_item_id_work_items_id_fk" FOREIGN KEY ("work_item_id") REFERENCES "public"."work_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_item_weekly_updates" ADD CONSTRAINT "work_item_weekly_updates_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_assigned_to_id_staff_profiles_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."staff_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_groups_platform_idx" ON "access_groups" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "access_groups_groupType_idx" ON "access_groups" USING btree ("group_type");--> statement-breakpoint
CREATE INDEX "access_reviews_accountId_idx" ON "access_reviews" USING btree ("platform_account_id");--> statement-breakpoint
CREATE INDEX "access_reviews_status_idx" ON "access_reviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "access_reviews_nextReviewDate_idx" ON "access_reviews" USING btree ("next_review_date");--> statement-breakpoint
CREATE INDEX "account_group_memberships_accountId_idx" ON "account_group_memberships" USING btree ("platform_account_id");--> statement-breakpoint
CREATE INDEX "account_group_memberships_groupId_idx" ON "account_group_memberships" USING btree ("access_group_id");--> statement-breakpoint
CREATE INDEX "external_contacts_affiliationType_idx" ON "external_contacts" USING btree ("affiliation_type");--> statement-breakpoint
CREATE INDEX "external_contacts_email_idx" ON "external_contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "platform_accounts_staffProfileId_idx" ON "platform_accounts" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "platform_accounts_externalContactId_idx" ON "platform_accounts" USING btree ("external_contact_id");--> statement-breakpoint
CREATE INDEX "platform_accounts_platform_idx" ON "platform_accounts" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "platform_accounts_status_idx" ON "platform_accounts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "platform_accounts_syncMode_idx" ON "platform_accounts" USING btree ("sync_mode");--> statement-breakpoint
CREATE INDEX "platform_accounts_affiliationType_idx" ON "platform_accounts" USING btree ("affiliation_type");--> statement-breakpoint
CREATE INDEX "platform_accounts_vpnEnabled_idx" ON "platform_accounts" USING btree ("vpn_enabled");--> statement-breakpoint
CREATE INDEX "platform_accounts_isOrphaned_idx" ON "platform_accounts" USING btree ("is_orphaned");--> statement-breakpoint
CREATE INDEX "platform_accounts_externalAccountId_idx" ON "platform_accounts" USING btree ("external_account_id");--> statement-breakpoint
CREATE INDEX "platform_integrations_platform_idx" ON "platform_integrations" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "platform_integrations_status_idx" ON "platform_integrations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reconciliation_issues_integrationId_idx" ON "reconciliation_issues" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "reconciliation_issues_issueType_idx" ON "reconciliation_issues" USING btree ("issue_type");--> statement-breakpoint
CREATE INDEX "reconciliation_issues_resolvedAt_idx" ON "reconciliation_issues" USING btree ("resolved_at");--> statement-breakpoint
CREATE INDEX "sync_jobs_integrationId_idx" ON "sync_jobs" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "sync_jobs_status_idx" ON "sync_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sync_jobs_createdAt_idx" ON "sync_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "appraisal_cycles_departmentId_idx" ON "appraisal_cycles" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "appraisal_cycles_year_idx" ON "appraisal_cycles" USING btree ("year");--> statement-breakpoint
CREATE INDEX "appraisal_cycles_status_idx" ON "appraisal_cycles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appraisal_followups_appraisalId_idx" ON "appraisal_followups" USING btree ("appraisal_id");--> statement-breakpoint
CREATE INDEX "appraisal_followups_dueDate_idx" ON "appraisal_followups" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "appraisals_cycleId_idx" ON "appraisals" USING btree ("cycle_id");--> statement-breakpoint
CREATE INDEX "appraisals_staffProfileId_idx" ON "appraisals" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "appraisals_status_idx" ON "appraisals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appraisals_scheduledDate_idx" ON "appraisals" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "attendance_exceptions_staffProfileId_idx" ON "attendance_exceptions" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "attendance_exceptions_leaveRequestId_idx" ON "attendance_exceptions" USING btree ("leave_request_id");--> statement-breakpoint
CREATE INDEX "attendance_exceptions_exceptionDate_idx" ON "attendance_exceptions" USING btree ("exception_date");--> statement-breakpoint
CREATE INDEX "attendance_exceptions_status_idx" ON "attendance_exceptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "attendance_exceptions_staff_date_idx" ON "attendance_exceptions" USING btree ("staff_profile_id","exception_date");--> statement-breakpoint
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_logs_module_idx" ON "audit_logs" USING btree ("module");--> statement-breakpoint
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_correlationId_idx" ON "audit_logs" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "automation_rule_logs_ruleId_idx" ON "automation_rule_logs" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "automation_rule_logs_firedAt_idx" ON "automation_rule_logs" USING btree ("fired_at");--> statement-breakpoint
CREATE INDEX "automation_rules_module_event_idx" ON "automation_rules" USING btree ("trigger_module","trigger_event");--> statement-breakpoint
CREATE INDEX "automation_rules_enabled_idx" ON "automation_rules" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "callouts_staffProfileId_idx" ON "callouts" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "callouts_relatedIncidentId_idx" ON "callouts" USING btree ("related_incident_id");--> statement-breakpoint
CREATE INDEX "callouts_status_idx" ON "callouts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "callouts_calloutAt_idx" ON "callouts" USING btree ("callout_at");--> statement-breakpoint
CREATE INDEX "policy_acks_staffProfileId_idx" ON "policy_acknowledgements" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "ppe_records_staffProfileId_idx" ON "ppe_records" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "ppe_records_expiryDate_idx" ON "ppe_records" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "training_records_staffProfileId_idx" ON "training_records" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "training_records_expiryDate_idx" ON "training_records" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "training_records_status_idx" ON "training_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contracts_staffProfileId_idx" ON "contracts" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "contracts_status_idx" ON "contracts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contracts_endDate_idx" ON "contracts" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "cycle_work_items_cycleId_idx" ON "cycle_work_items" USING btree ("cycle_id");--> statement-breakpoint
CREATE INDEX "cycle_work_items_workItemId_idx" ON "cycle_work_items" USING btree ("work_item_id");--> statement-breakpoint
CREATE INDEX "cycles_status_idx" ON "cycles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cycles_startDate_idx" ON "cycles" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "cycles_departmentId_idx" ON "cycles" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "department_assignment_history_assignmentId_idx" ON "department_assignment_history" USING btree ("department_assignment_id");--> statement-breakpoint
CREATE INDEX "department_assignment_history_createdAt_idx" ON "department_assignment_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "department_assignments_staffProfileId_idx" ON "department_assignments" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "department_assignments_departmentId_idx" ON "department_assignments" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "department_assignments_role_idx" ON "department_assignments" USING btree ("role");--> statement-breakpoint
CREATE INDEX "department_assignments_isActive_idx" ON "department_assignments" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "escalation_steps_policyId_idx" ON "escalation_steps" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "on_call_overrides_scheduleId_idx" ON "on_call_overrides" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "on_call_overrides_dateRange_idx" ON "on_call_overrides" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "career_path_plans_status_idx" ON "career_path_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "career_path_years_planId_idx" ON "career_path_years" USING btree ("career_path_plan_id");--> statement-breakpoint
CREATE INDEX "performance_journal_entries_staffProfileId_idx" ON "performance_journal_entries" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "performance_journal_entries_appraisalId_idx" ON "performance_journal_entries" USING btree ("appraisal_id");--> statement-breakpoint
CREATE INDEX "performance_journal_entries_entryDate_idx" ON "performance_journal_entries" USING btree ("entry_date");--> statement-breakpoint
CREATE INDEX "promotion_letters_staffProfileId_idx" ON "promotion_letters" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "promotion_letters_status_idx" ON "promotion_letters" USING btree ("status");--> statement-breakpoint
CREATE INDEX "promotion_recommendations_staffProfileId_idx" ON "promotion_recommendations" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "promotion_recommendations_status_idx" ON "promotion_recommendations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "promotion_recommendations_appraisalId_idx" ON "promotion_recommendations" USING btree ("appraisal_id");--> statement-breakpoint
CREATE INDEX "staff_feedback_staffProfileId_idx" ON "staff_feedback" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "staff_feedback_appraisalId_idx" ON "staff_feedback" USING btree ("appraisal_id");--> statement-breakpoint
CREATE INDEX "staff_feedback_status_idx" ON "staff_feedback" USING btree ("status");--> statement-breakpoint
CREATE INDEX "incident_timeline_incidentId_idx" ON "incident_timeline" USING btree ("incident_id");--> statement-breakpoint
CREATE INDEX "incidents_severity_idx" ON "incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "incidents_status_idx" ON "incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "incidents_detectedAt_idx" ON "incidents" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "ppe_issuances_staffProfileId_idx" ON "ppe_issuances" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "ppe_issuances_ppeItemId_idx" ON "ppe_issuances" USING btree ("ppe_item_id");--> statement-breakpoint
CREATE INDEX "ppe_issuances_status_idx" ON "ppe_issuances" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ppe_issuances_dueDate_idx" ON "ppe_issuances" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "ppe_items_isActive_idx" ON "ppe_items" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "timesheet_entries_timesheetId_idx" ON "timesheet_entries" USING btree ("timesheet_id");--> statement-breakpoint
CREATE INDEX "timesheet_entries_workDate_idx" ON "timesheet_entries" USING btree ("work_date");--> statement-breakpoint
CREATE INDEX "timesheets_staffProfileId_idx" ON "timesheets" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "timesheets_status_idx" ON "timesheets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "timesheets_periodStart_idx" ON "timesheets" USING btree ("period_start");--> statement-breakpoint
CREATE INDEX "maintenance_assignments_departmentId_idx" ON "maintenance_assignments" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "maintenance_assignments_year_idx" ON "maintenance_assignments" USING btree ("year");--> statement-breakpoint
CREATE INDEX "maintenance_assignments_quarter_idx" ON "maintenance_assignments" USING btree ("quarter");--> statement-breakpoint
CREATE INDEX "maintenance_assignments_type_idx" ON "maintenance_assignments" USING btree ("maintenance_type");--> statement-breakpoint
CREATE INDEX "roster_assignments_scheduleId_idx" ON "roster_assignments" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "roster_assignments_staffProfileId_idx" ON "roster_assignments" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "roster_assignments_shiftDate_idx" ON "roster_assignments" USING btree ("shift_date");--> statement-breakpoint
CREATE INDEX "roster_schedules_departmentId_idx" ON "roster_schedules" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "roster_schedules_status_idx" ON "roster_schedules" USING btree ("status");--> statement-breakpoint
CREATE INDEX "roster_swap_requests_assignmentId_idx" ON "roster_swap_requests" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "roster_swap_requests_requesterId_idx" ON "roster_swap_requests" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "roster_swap_requests_status_idx" ON "roster_swap_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leave_requests_staffProfileId_idx" ON "leave_requests" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "leave_requests_status_idx" ON "leave_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leave_requests_dateRange_idx" ON "leave_requests" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "notifications_recipientId_status_idx" ON "notifications" USING btree ("recipient_id","status");--> statement-breakpoint
CREATE INDEX "notifications_createdAt_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "pr_status_idx" ON "purchase_requisitions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pr_requestedById_idx" ON "purchase_requisitions" USING btree ("requested_by_id");--> statement-breakpoint
CREATE INDEX "pr_departmentId_idx" ON "purchase_requisitions" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "pr_createdAt_idx" ON "purchase_requisitions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "staff_profiles_userId_idx" ON "staff_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "staff_profiles_departmentId_idx" ON "staff_profiles" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "staff_profiles_teamLeadId_idx" ON "staff_profiles" USING btree ("team_lead_id");--> statement-breakpoint
CREATE INDEX "history_scheduleId_idx" ON "assignment_history" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "history_staffId_idx" ON "assignment_history" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "assignments_scheduleId_idx" ON "on_call_assignments" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "assignments_staffId_idx" ON "on_call_assignments" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "schedules_weekStart_idx" ON "on_call_schedules" USING btree ("week_start");--> statement-breakpoint
CREATE INDEX "schedules_status_idx" ON "on_call_schedules" USING btree ("status");--> statement-breakpoint
CREATE INDEX "swaps_assignmentId_idx" ON "on_call_swaps" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "swaps_requesterId_idx" ON "on_call_swaps" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "swaps_status_idx" ON "on_call_swaps" USING btree ("status");--> statement-breakpoint
CREATE INDEX "import_warnings_weekStart_idx" ON "rota_import_warnings" USING btree ("week_start");--> statement-breakpoint
CREATE INDEX "import_warnings_status_idx" ON "rota_import_warnings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "overlay_assignments_scheduleId_idx" ON "overlay_assignments" USING btree ("overlay_schedule_id");--> statement-breakpoint
CREATE INDEX "overlay_assignments_staffId_idx" ON "overlay_assignments" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "overlay_schedules_typeId_idx" ON "overlay_schedules" USING btree ("overlay_type_id");--> statement-breakpoint
CREATE INDEX "overlay_schedules_quarter_year_idx" ON "overlay_schedules" USING btree ("quarter","year");--> statement-breakpoint
CREATE INDEX "overlay_tasks_scheduleId_idx" ON "overlay_tasks" USING btree ("overlay_schedule_id");--> statement-breakpoint
CREATE INDEX "overlay_tasks_status_idx" ON "overlay_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "overlay_tasks_dueDate_idx" ON "overlay_tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "temp_changes_status_idx" ON "temporary_changes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "temp_changes_removeByDate_idx" ON "temporary_changes" USING btree ("remove_by_date");--> statement-breakpoint
CREATE INDEX "temp_changes_ownerId_idx" ON "temporary_changes" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "temp_changes_category_idx" ON "temporary_changes" USING btree ("category");--> statement-breakpoint
CREATE INDEX "temp_changes_riskLevel_idx" ON "temporary_changes" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "work_initiatives_status_idx" ON "work_initiatives" USING btree ("status");--> statement-breakpoint
CREATE INDEX "work_initiatives_departmentId_idx" ON "work_initiatives" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "work_item_assignees_work_item_idx" ON "work_item_assignees" USING btree ("work_item_id");--> statement-breakpoint
CREATE INDEX "work_item_assignees_staff_idx" ON "work_item_assignees" USING btree ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "work_item_deps_workItemId_idx" ON "work_item_dependencies" USING btree ("work_item_id");--> statement-breakpoint
CREATE INDEX "work_item_deps_dependsOnId_idx" ON "work_item_dependencies" USING btree ("depends_on_id");--> statement-breakpoint
CREATE INDEX "work_item_team_alloc_work_item_idx" ON "work_item_team_allocations" USING btree ("work_item_id");--> statement-breakpoint
CREATE INDEX "work_items_status_idx" ON "work_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "work_items_assignedToId_idx" ON "work_items" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "work_items_departmentId_idx" ON "work_items" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "work_items_dueDate_idx" ON "work_items" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "work_items_type_idx" ON "work_items" USING btree ("type");