# Implementation Plan — DCS + NOC Unified Staff Ops Platform

> **Strategic plan (context, architecture, rationale):** `/home/karetech/.claude/plans/paude-for-a-second-clever-salamander.md`
> **This file:** actionable day-by-day execution tracker with changelog, session log, and gotchas. Each task has status, file paths, and acceptance criteria. **New sessions and new agents must read this file and append to the Session Log / Changelog before doing any work.**

---

## Session log (append per session)

> **Rule:** Every session/agent working on this project MUST append an entry here. Include date, session ID or agent name, changed files, decisions made, and anything the next session needs to know. Do not delete prior entries — this is the shared memory.

### 2026-04-17 — Session A (audit + Phase 0 hardening)
- **Who:** Claude Sonnet 4.6 (main session)
- **What:** Full security audit executed against Codex's findings. Gated sensitive reads across audit/dashboard/analytics/procurement/incidents/leave/appraisals/contracts/services/temp-changes/access/staff/compliance/automation/rota/escalation. Added state machines (procurement approve/mark-ordered/mark-received; incident forward-only + PIR prerequisite). Rota swap ownership check. Notification bell wired to `orpc.notifications.list`. Departments CRUD router + admin UI. Dashboard frontend skips privileged queries for low-privilege users.
- **Files touched:** see Changelog entry `2026-04-17` below.
- **Decisions:**
  - `dashboard.main` intentionally left as `protectedProcedure` (aggregate counts are safe for any authenticated user)
  - `leave.types.list`, `rota.getCurrent/getUpcoming/getEffectiveOnCall`, `procurement.getMyRequests`, `notifications.*`, `departments.list/get` intentionally left as `protectedProcedure` — they are self-service or reference data
- **For next session:** continue with Phase 1 in `IMPLEMENTATION_PLAN.md`. Start with schema changes (teamLeadId + department_assignments). Do NOT forget to run `bun run db:generate && bun run db:push` after each schema edit.

### 2026-04-17 — Session B (discovery: DCS OPS folder + plan rewrite)
- **Who:** Claude Sonnet 4.6 (same long session)
- **What:** User uploaded `DCS OPS/` folder to project root. Unpacked contents via python+openpyxl. Discovered: NOC runs 24/7 shift model (D/S/N codes), contract renewals are tied to appraisals (2 per year, 3mo/6mo follow-ups), appraisal template has 8 rating categories + ≥3 achievements + ≥3 goals + percentage, career path is a multi-year promotion/PIP/transfer plan, PPE has 17+ tracked items with sizes/serials, sick days have type typology (reported_sick/medical/absent), maintenance coverage is a quarterly grid separate from on-call, staff feedback is collected during appraisals.
- **Plan updates:** Reviewed against a Codex-generated plan. Added to master plan: `department_assignment_history`, `appraisal_cycles`, `promotion_recommendations` as distinct from letters, append-only `performance_journal_entries`, `immutableFrom` on appraisals, `attendance_exceptions` superseding sick-days with lateness/WFH, `maintenance_assignments`, `leave_policies` engine, `training_courses/enrollments/exam_vouchers/assessments`, `onboarding_checklists`, policy versioning with re-acknowledgement, `staff_documents` generic vault, `job_families/career_levels/staff_career_positions`, `employee_recognitions`, plus a full scheduled-jobs phase (Phase 7) with replica-safe `job_locks`.
- **Plan file created:** `IMPLEMENTATION_PLAN.md` (this file).
- **Phase 1 started:** `packages/db/src/schema/staff.ts` now has `teamLeadId` column + self-relation + index.
- **For next session:** continue Phase 1 — next tasks are `department_assignments` schema and auth/RBAC extension. See todo list below.

<!-- NEXT SESSION: add your entry here. Use ISO date + a short session ID. Keep it scannable. -->

---

## Changelog (append per merge / per file batch)

> **Rule:** After every meaningful change, add a dated bullet under today's entry. Include the absolute file path and a one-line "why".

### 2026-04-17

**Phase 0 hardening:**
- `packages/api/src/routers/audit.ts` — `list`, `getByResource` gated to `requireRole("audit", "read")`.
- `packages/api/src/routers/dashboard.ts` — `opsReadiness` → `requireRole("report", "read")`, `recentActivity` → `requireRole("audit", "read")`. `main` intentionally kept open for all authenticated users.
- `packages/api/src/routers/analytics.ts` — `overview` → `requireRole("report", "read")`.
- `packages/api/src/routers/procurement.ts` — reads gated; state machine on `approve` (requires `submitted|under_review`), `reject` (requires `submitted|under_review|approved`), `markOrdered` (requires `approved`), `markReceived` (requires `ordered`).
- `packages/api/src/routers/incidents.ts` — reads gated to `requireRole("work", "read")`; `update` enforces forward-only status transitions across `detected → investigating → identified → mitigating → resolved → post_mortem → closed`; `createPIR` requires incident status in `resolved|post_mortem|closed`.
- `packages/api/src/routers/rota.ts` — `swap.request` ownership check (requester's staff profile must equal assignment's `staffProfileId`); `list`/`getEligibleStaff`/`getAssignmentCounts`/`history`/`listImportWarnings` gated.
- `packages/api/src/routers/leave.ts` — `requests.list` scoped to caller's own profile for non-manager roles; `balances.getByStaff` ownership check; `requests.create` ownership enforcement (staff cannot submit leave on behalf of others); `getTeamCalendar` gated.
- `packages/api/src/routers/appraisals.ts` — all 4 read endpoints gated (`requireRole("appraisal", "read")`).
- `packages/api/src/routers/contracts.ts` — list/get/getExpiringSoon gated.
- `packages/api/src/routers/services.ts` — list/get gated.
- `packages/api/src/routers/temp-changes.ts` — list/get/getPublicIPs/getExpiringSoon/getHistory/stats/statsExtended/getOverdue gated.
- `packages/api/src/routers/access.ts` — 23 read endpoints gated to `requireRole("access", "read")`.
- `packages/api/src/routers/staff.ts` — list/get gated to `requireRole("staff", "read")`.
- `packages/api/src/routers/compliance.ts` — training/ppe/policyAck list + getExpiringItems gated.
- `packages/api/src/routers/automation.ts` — list/get/getLogs/stats gated to settings role.
- `packages/api/src/routers/escalation.ts` — policies.list/get gated.
- `packages/api/src/routers/departments.ts` — **NEW**: CRUD router (list/get/create/update/deactivate) created, registered in `packages/api/src/routers/index.ts`.
- `apps/web/src/routes/_authenticated/settings/departments.tsx` — rewrote with full CRUD UI (Add/Edit/Deactivate) using `Dialog` component; admin/hrAdminOps only.
- `apps/web/src/components/notification-bell.tsx` — wired to `orpc.notifications.list({ includeRead: false, limit: 1 })` using live unread count.
- `apps/web/src/routes/_authenticated/index.tsx` — dashboard now reads `useSession()` role and uses `enabled: canSeeOpsReadiness / canSeeAuditActivity` to skip 403 queries for low-privilege users.

**Phase 1 (started):**
- `packages/db/src/schema/staff.ts` — added `teamLeadId` column (bare text, self-referential FK applied at DB level via `db:push`) + index `staff_profiles_teamLeadId_idx` + relations for `teamLead` (one) and `directReports` (many, relationName `"teamLead"`).

**Documents created:**
- `IMPLEMENTATION_PLAN.md` — this file.
- `/home/karetech/.claude/plans/paude-for-a-second-clever-salamander.md` — strategic plan (7 phases).

<!-- NEXT SESSION: append under today's date (or add a new date header). -->

---

## Pending decisions (things to ask before making assumptions)

- [ ] **File storage:** schema has `documentUrl`/`fileUrl` fields but no upload pipeline wired. Options: accept external URLs (Drive/SharePoint) in MVP, or set up R2/S3/local `/uploads`. **Defer decision until Phase 3 starts.**
- [ ] **Email delivery:** Phase 7 jobs create notifications in DB; SMTP/SendGrid wiring is a separate task.
- [ ] **Git repo:** This working copy at `/home/karetech/projects/ndma-dcs-staff-portal/` is **not** a git repo (`fatal: not a git repository`). Windows copy may have git. Need user decision on: (a) init git here + add remote, (b) sync changes back to Windows and commit there, (c) leave as-is.
- [ ] **Promotion title schema:** current `staff_profiles.jobTitle` is free-text. Phase 6 `career_levels` introduces structured titles. Question: should promotions rewrite `jobTitle` from the level.title, or keep both?

---

## Gotchas / conventions (context-preservation)

These must survive across sessions — same list as `CLAUDE.md` but filtered to what matters for this plan:

- **oRPC `queryOptions` requires `{ input: { ... } }`** — flat args is a silent runtime bug.
- **Procedures with no `.input()`** — call `queryOptions()` with no arg, not `{}`.
- **Base UI uses `render` prop, NOT `asChild`** — all Dialog/DropdownMenu/Collapsible triggers.
- **Shared `Button` in `@ndma-dcs-staff-portal/ui` has no `asChild`** — wrap with `useNavigate` or style a `<Link>` directly.
- **Drizzle self-referential FKs** — use bare `text("parent_id")` with NO `.references()`; DB-level FK added on `db:push`. (Used for `teamLeadId`, `parentId`.)
- **Drizzle two-relations-to-same-table** — must use `relationName` on both sides (see `teamLead` / `directReports`).
- **Zod v4 `z.record`** — two args required (`z.record(z.string(), z.string())`).
- **Zod `.default()` in form schemas** — breaks RHF silently; set defaults in `useForm({ defaultValues: {...} })`.
- **TanStack Router `<Link to=>`** — strictly typed; route file must exist BEFORE linking. Use disabled Button until route lands.
- **RBAC rule (project mandate):** EVERY mutation uses `requireRole(resource, action)`, not `protectedProcedure`. Every mutation calls `logAudit()` with `actorRole: context.userRole ?? undefined` and `correlationId: context.requestId`.
- **Local admin fallback:** `emailAndPassword: { enabled: true }` in Better Auth MUST remain enabled even after LDAP is added.
- **Naming:** "Roster" in user-facing text; `rota` in code/URLs (back-compat).
- **Login route:** `/login`, not `/sign-in`.
- **Git commit:** pre-commit hook runs `bat` — use `git commit -m "msg"` (NOT heredoc syntax).

---

## Todo snapshot (live)

Maintained by the coding session's `TodoWrite` tool — copy here when marking a phase complete so future agents can see the current state without needing the TodoWrite state.

**Current (as of 2026-04-17):**
- [x] Phase 0 hardening (all bullets above)
- [~] Phase 1a — `teamLeadId` on staff schema ✓ (landed this session)
- [ ] Phase 1b — `department_assignments` + history tables
- [ ] Phase 1c — RBAC statement + two new roles
- [ ] Phase 1d — `scope.ts` helpers
- [ ] Phase 1e — `department-assignments` router
- [ ] Phase 1f — staff router additions (`setTeamLead`, `canAccessPrivate`, `getMyDirectReports`)
- [ ] Phase 1g — NOC seed + initial assignments
- [ ] Phase 2+ — see phase sections below

---

## Legend

- `[x]` done
- `[~]` in progress
- `[ ]` not started
- `[!]` blocked / needs decision

---

## Phase 0 — Hardening already landed (prior sessions)

- [x] Audit, analytics, dashboard reads gated by `requireRole`
- [x] Procurement state machine (approve/mark-ordered/mark-received transitions)
- [x] Incident forward-only transitions + PIR prerequisite
- [x] Rota swap ownership check
- [x] Access router RBAC (23 endpoints)
- [x] Temp-changes router RBAC
- [x] Leave router: ownership scoping on requests.list, balances.getByStaff, create
- [x] Appraisals router RBAC (4 reads gated)
- [x] Contracts + services router RBAC
- [x] Staff + compliance + automation + rota + escalation read gates
- [x] Departments CRUD router + admin UI with create/edit/deactivate
- [x] Notification bell wired to live `orpc.notifications.list`
- [x] Dashboard frontend skips privileged queries for low-privilege users

**Outstanding Phase 0 items (rolled into later phases):**
- [ ] Wrap leave.approve / leave.cancel / rota.publish in DB transactions — **Phase 5 polish**
- [ ] Add FK constraints on `work_items.initiativeId`, `work_items.parentId`, temp-changes refs — **Phase 5 polish**
- [ ] Playwright RBAC regression suite — **Phase 5 polish**

---

## Phase 1 — Foundation (org model + RBAC + scoping)

**Goal:** unblock every subsequent phase by landing org structure, scoping helpers, and the two new roles.

### Schema
- [~] `packages/db/src/schema/staff.ts` — add `teamLeadId` column + self-relation + index ← **in progress**
- [ ] `packages/db/src/schema/department-assignments.ts` — new table `(staffProfileId, departmentId, role enum[manager|pa|team_lead|supervisor], isActive, assignedAt, assignedById)` + unique on `(staffProfileId, departmentId, role)`
- [ ] `packages/db/src/schema/department-assignment-history.ts` — append-only log
- [ ] Export new tables from `packages/db/src/schema/index.ts`

### Auth / RBAC
- [ ] `packages/auth/src/index.ts`: extend `statement` with new resources (`promotion_letter`, `performance_journal`, `career_path`, `ppe`, `callout`, `timesheet`, `shift`, `feedback`). Extend `appraisal` with `submit|approve|reject` actions.
- [ ] Add `teamLeadRole` and `personalAssistantRole`. Register in Better Auth `admin` plugin `roles:` map.
- [ ] Extend `managerRole` with `appraisal:[approve, reject]`.
- [ ] Update `AppRole` export type.

### API
- [ ] `packages/api/src/lib/scope.ts` — `getCallerStaffProfile`, `getCallerDepartmentRoles`, `canAccessStaffPrivate`, `getDirectReports`, `getManagedStaffIds`
- [ ] `packages/api/src/routers/department-assignments.ts` — CRUD (admin/hrAdminOps only)
- [ ] `packages/api/src/routers/staff.ts`: add `setTeamLead`, `canAccessPrivate`, `getMyDirectReports`
- [ ] Register new router in `packages/api/src/routers/index.ts`

### Frontend
- [ ] `apps/web/src/hooks/use-can-access-staff-private.ts`
- [ ] `apps/web/src/routes/_authenticated/settings/department-assignments.tsx`

### Seed
- [ ] Add NOC as peer of DCS in seed; keep ASN/Core/Enterprise under DCS
- [ ] Seed Sachin as `manager` on DCS (+ children), Ataybia as `pa` on DCS + NOC; Nicolai/Gerard as `supervisor` on DCS

### Acceptance
- `bun run db:generate && bun run db:push` clean
- `bun run check-types` zero errors
- Log in as Sachin, call `staff.canAccessPrivate({staffProfileId: <any DCS staff>})` → `true`
- Log in as ordinary staff, call same → `false`

---

## Phase 2 — Appraisal workflow + career + journal + promotion + feedback

**Goal:** replace the Excel appraisal tracker / template / career plan / feedback sheets with a real workflow.

### Schema
- [ ] `packages/db/src/schema/appraisal-cycles.ts` — cycles per (departmentId, year, half)
- [ ] `packages/db/src/schema/appraisal-followups.ts` — 3mo/6mo follow-up tracking
- [ ] `packages/db/src/schema/appraisals.ts` — extend enum, add workflow columns (cycleId, teamLeadId, submittedAt/ById, approvedAt/ById, rejectionReason, percentageScore, location, typeOfReview, achievements jsonb, goals jsonb, staffFeedback, supervisorComments, managerComments, immutableFrom), replace `objectives` with typed rating matrix keyed on `organisational_skills|quality_of_work|dependability|communication_skills|cooperation|initiative|technical_skills|attendance_punctuality`
- [ ] `packages/db/src/schema/hr-docs.ts` — `promotion_recommendations`, `promotion_letters`, `performance_journal_entries`, `career_path_plans`, `career_path_years`, `staff_feedback`

### API
- [ ] `packages/api/src/routers/appraisals.ts` — add `submit`, `approve`, `reject`, `setRatings` (computes percentage); `update` enforces `immutableFrom IS NULL`; `create` defaults `draft` + captures `teamLeadId`
- [ ] `packages/api/src/routers/appraisal-cycles.ts` — `open`, `close`, `batchCreateForCycle`
- [ ] `packages/api/src/routers/promotion-recommendations.ts` — full CRUD, status workflow
- [ ] `packages/api/src/routers/promotion-letters.ts` — CRUD; create requires approved recommendation; gated by `canAccessStaffPrivate`
- [ ] `packages/api/src/routers/performance-journal.ts` — append-only (no update); `amend({linkedEntryId})` instead
- [ ] `packages/api/src/routers/career-path.ts` — plan + years CRUD; reads public; writes manager/PA
- [ ] `packages/api/src/routers/feedback.ts` — submit (self-service, 1/day rate limit), list (PA/manager), updateStatus
- [ ] Register all new routers in index

### Frontend
- [ ] `apps/web/src/routes/_authenticated/staff/$staffId.tsx` — rewrite as tabbed layout:
    - Overview (existing + team lead widget)
    - Career Path
    - Appraisals
    - Promotion Letters (private)
    - Performance Journal (private)
    - Policy & Compliance
    - Contracts
    - (PPE/Shifts added in later phases)
- [ ] `apps/web/src/routes/_authenticated/appraisals/index.tsx` — scoped list
- [ ] `apps/web/src/routes/_authenticated/appraisals/$appraisalId.tsx` — full form matching the Excel template
- [ ] `apps/web/src/routes/_authenticated/appraisals/inbox.tsx` — Sachin's approval queue
- [ ] `apps/web/src/routes/_authenticated/hr/index.tsx` — Ataybia's PA dashboard
- [ ] `apps/web/src/routes/_authenticated/feedback/submit.tsx` + `review.tsx`

### Notifications
- [ ] Appraisal submitted → dept manager
- [ ] Appraisal approved/rejected → subject + drafting team lead
- [ ] Promotion letter created → subject
- [ ] Career-path year completed → subject

### Acceptance
- Team lead creates draft appraisal for direct report, fills ratings, ≥3 achievements, ≥3 goals, submits
- Sachin sees it in `/appraisals/inbox`, approves; two follow-up rows appear
- Subject receives notification; percentage score renders
- Ordinary staff calling `appraisals.get` on someone else's appraisal → 403
- Promotion letter cannot be created without an approved recommendation (CONFLICT error)
- Journal entry cannot be updated; only amended with a linked new entry

---

## Phase 3 — Operational HR (PPE, attendance exceptions, callouts, timesheets)

**Goal:** absorb DCS-Staff + Shared-Everyone operational sheets.

### Schema
- [ ] `packages/db/src/schema/ppe.ts` — `ppe_items` catalog + `ppe_issuances`
- [ ] `packages/db/src/schema/attendance-exceptions.ts` — sick/lateness/WFH/early-leave/absent
- [ ] `packages/db/src/schema/callouts.ts` — emergency after-hours with optional `relatedIncidentId`
- [ ] `packages/db/src/schema/timesheets.ts` — submission + approval

### API + Frontend
- [ ] `packages/api/src/routers/ppe.ts`
- [ ] `packages/api/src/routers/attendance-exceptions.ts`
- [ ] `packages/api/src/routers/callouts.ts`
- [ ] `packages/api/src/routers/timesheets.ts`
- [ ] Staff detail tabs: PPE & Tools, Sick Days / Attendance, Callouts, Timesheets
- [ ] `/hr/ppe/index.tsx` — matrix view
- [ ] `/hr/sick-days/index.tsx` — yearly register + CSV export
- [ ] `/hr/callouts/index.tsx`
- [ ] `/timesheets/index.tsx` — self-service + approval queue

### Import
- [ ] `packages/db/scripts/import-dcs-ops.ts` — reads DCS OPS/ xlsx directly using `xlsx` package; seeds historical data

---

## Phase 4 — NOC shift schedule

**Goal:** separate 24/7 D/S/N shift model for NOC, independent from existing DCS on-call rota.

### Schema
- [ ] `packages/db/src/schema/shifts.ts` — `shift_schedules`, `shift_assignments`, `shift_swap_requests`
- [ ] `packages/db/src/schema/maintenance-assignments.ts` — quarterly maintenance grid (Cleaning Server Room, Routine Maintenance DCS, Fire Detection Test)

### API
- [ ] `packages/api/src/routers/shifts.ts` — schedules CRUD, assignments bulkSet/update, swaps, getCurrentShifts
- [ ] `packages/api/src/routers/maintenance-assignments.ts`
- [ ] Publish validator: every day has ≥1 Day + ≥1 Swing + ≥1 Night; leave overlaps block

### Frontend
- [ ] `/shifts/index.tsx` — month grid matching Excel
- [ ] `/shifts/today.tsx` — live coverage widget
- [ ] `/shifts/my-shifts.tsx`
- [ ] `/shifts/calendar.tsx`

### Import
- [ ] Extend import script to ingest `DCS OPS/NOC/SHIFT SCHEDULE 2026/` monthly xlsx files

---

## Phase 5 — Leave policy engine + contract renewal + polish + tests

### Schema
- [ ] `packages/db/src/schema/leave-policies.ts`
- [ ] `packages/db/src/schema/contracts.ts` (modify) — renewal workflow columns

### API
- [ ] Extend `leave.ts` to evaluate policy on create (parts-per-year, overlap caps, HR-override flag)
- [ ] Extend `contracts.ts` with renewal workflow (`renewalLetterRequiredBy`, `renewalStatus`)
- [ ] `packages/api/src/routers/leave-policies.ts`

### Phase 0 follow-ups landed here
- [ ] Wrap `leave.approve` + `leave.cancel` balance updates in `db.transaction(...)`
- [ ] Wrap `rota.publish` in a transaction
- [ ] Wrap import per-row writes in transactions (staff+profile, leave import, etc.)
- [ ] Add FK constraints: `work_items.initiativeId` → `work_initiatives.id`, `work_items.parentId` → `work_items.id`, `temp_changes.requestedById` → `staff_profiles.id`, `temp_changes.departmentId` → `departments.id`

### Frontend
- [ ] Employee directory filter pills (NOC / DCS / ASN / Core / Enterprise)
- [ ] Policy "required reading" badge UI
- [ ] CSV exports on PPE matrix, sick days, contracts
- [ ] `staff.search` procedure + UI
- [ ] `useCanAccessStaffPrivate` hook hides private tabs defensively

### Tests
- [ ] Playwright smoke: RBAC per role (staff, team lead, manager, PA, admin)
- [ ] Playwright: ownership + state-transition + workflow tests

---

## Phase 6 — Training depth + policy versioning + document vault + career ladders + recognition

### Schema
- [ ] `packages/db/src/schema/training-catalog.ts` (training_courses, training_enrollments, exam_vouchers, training_assessments)
- [ ] `packages/db/src/schema/onboarding.ts` (onboarding_checklists + items)
- [ ] `packages/db/src/schema/policies-v2.ts` (policies, policy_versions, policy_acknowledgement_v2)
- [ ] `packages/db/src/schema/staff-documents.ts` — generic vault
- [ ] `packages/db/src/schema/career-ladders.ts` (job_families, career_levels, staff_career_positions)
- [ ] `packages/db/src/schema/recognitions.ts` (employee_recognitions)

### API
- [ ] `packages/api/src/routers/training-catalog.ts` + `training-enrollments.ts`
- [ ] `packages/api/src/routers/onboarding.ts`
- [ ] `packages/api/src/routers/policies-v2.ts` — on publish(version), generate pending acks for applicable staff
- [ ] `packages/api/src/routers/staff-documents.ts`
- [ ] `packages/api/src/routers/career-ladders.ts` + `staff.getPromotionCandidates`
- [ ] `packages/api/src/routers/recognitions.ts`

### Frontend
- [ ] `/settings/training-catalog` — admin course/voucher/assessment CRUD
- [ ] `/settings/policies` — publish/deprecate; `/policies` — library
- [ ] Staff tabs: Documents, Training Plan, Career Ladder, Recognitions
- [ ] `/hr/promotion-candidates`
- [ ] Directory recognition badge (if employee_of_the_month in last 30d)

---

## Phase 7 — Background jobs + scheduled reminders

### Infrastructure
- [ ] `packages/db/src/schema/job-locks.ts` — for multi-replica safety
- [ ] `packages/api/src/lib/jobs/registry.ts` — cron-like tick every 5 min
- [ ] Wire into `apps/server/src/index.ts` scheduler

### Jobs
- [ ] `contract_renewal_nudges` — daily 09:00
- [ ] `appraisal_followup_reminders` — daily 09:00
- [ ] `leave_accrual_monthly` — 1st of month 01:00
- [ ] `training_expiry_warnings` — weekly Mon 08:00
- [ ] `policy_acknowledgement_chaser` — weekly Mon 08:00
- [ ] `overdue_appraisal_sweep` — daily 06:00
- [ ] `shift_coverage_check` — daily 18:00
- [ ] `expired_contract_guard` — daily 00:30
- [ ] `report_digests` — Monday 07:00 (PA's weekly digest)

### Tests
- [ ] Unit harness per job (fake now, fake DB); integration test for lock table

---

## Execution sequencing / estimated effort

| Phase | Goal | Estimated days | Dependencies |
|-------|------|----------------|--------------|
| 1 | Foundation + scoping | 2–3 | none |
| 2 | Appraisal + promotion + journal + career + feedback | 5–7 | Phase 1 |
| 3 | PPE, attendance, callouts, timesheets | 3–4 | Phase 1 |
| 4 | NOC shifts + maintenance | 3–4 | Phase 1 |
| 5 | Leave policy + contract renewal + polish + tests | 3–4 | Phase 2 |
| 6 | Training + policy v2 + documents + ladders + recognition | 5–7 | Phase 2 |
| 7 | Background jobs | 2–3 | all phases |

**Totals:** ~23–32 working days / 4.5–6.5 weeks for a single engineer.
**Possible parallelization:** Phases 3 and 4 can run alongside Phase 2 once Phase 1 lands.

---

## How to run (developer commands)

After each schema change:
```bash
bun run db:generate    # create migration file
bun run db:push        # apply to dev DB
bun run check-types    # type-check all packages
```

After each router / frontend change:
```bash
bun run dev            # hot-reload all apps
```

One-off import:
```bash
bun run packages/db/scripts/import-dcs-ops.ts
```

---

## Key people (for seeded assignments)

- **Sachin Ramsuran** — manager of DCS + ASN + Core + Enterprise
- **Ataybia Williams** — PA for DCS + NOC
- **Nicolai Mahangi** — supervisor for DCS
- **Gerard Budhan** — supervisor for DCS
- **Kareem Schultz** — (us) staff member / test subject

---

## Deferred explicitly (do not implement in this plan)

- Timesheet PDF generation (uploads accepted, generation out of scope)
- Payroll integration (CSV exports only)
- File storage backend (schema ready; S3/R2 wiring is infra)
- LDAP / AD sync (stub unchanged)
- Mobile app
- SMTP email delivery (notifications ready in `notifications` table)
- Full 360° peer reviews
- Succession org-chart visualisation
