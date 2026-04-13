# Claude Code – Agent-Ready Fix Tasks

## Task 1 — Repair auth middleware context chain
- **Objective:** Ensure oRPC auth middleware preserves full context while enforcing session existence.
- **Likely files:**
  - `packages/api/src/index.ts`
  - `packages/api/src/context.ts`
  - `packages/api/src/routers/*` (tests)
- **Desired outcome:** `requireAuth` and `requireRole` operate with full context (`session`, `userRole`, `ipAddress`, `userAgent`, `requestId`).
- **Acceptance criteria:**
  1. Role-protected route tests pass for each role.
  2. Audit metadata fields are present in mutation logs.
  3. No unsafe context casts needed for `userRole`.

## Task 2 — Normalize RBAC action vocabulary
- **Objective:** Remove undefined action references (especially `settings:create/delete`).
- **Likely files:**
  - `packages/auth/src/index.ts`
  - `packages/api/src/routers/automation.ts`
  - `packages/api/src/routers/overlays.ts`
- **Desired outcome:** Every `requireRole(resource, action)` pair maps to declared actions.
- **Acceptance criteria:**
  1. Static validation script enumerates all route guards and confirms action existence.
  2. Admin and designated roles can execute intended settings mutations.

## Task 3 — Lock down audit API
- **Objective:** Restrict audit endpoints to authorized roles only.
- **Likely files:**
  - `packages/api/src/routers/audit.ts`
  - `packages/auth/src/index.ts` (if role matrix updates needed)
- **Desired outcome:** `audit.list` and `audit.getByResource` require `audit:read`.
- **Acceptance criteria:**
  1. Staff/read-only unauthorized flows return FORBIDDEN according to policy.
  2. Audit/admin roles retain access.

## Task 4 — Enforce mutation audit logging contract
- **Objective:** Guarantee every mutation emits `logAudit`.
- **Likely files:**
  - `packages/api/src/routers/*.ts`
  - `packages/api/src/lib/audit.ts`
  - test utilities/new lint rule script
- **Desired outcome:** Missing audit call becomes a CI failure.
- **Acceptance criteria:**
  1. Coverage report shows 100% mutation endpoints audited.
  2. Representative routes (incidents, notifications, access, leave) produce audit rows.

## Task 5 — Strengthen DB constraints for operational correctness
- **Objective:** Add relational/uniqueness constraints required by business rules.
- **Likely files:**
  - `packages/db/src/schema/rota.ts`
  - `packages/db/src/schema/temp-changes.ts`
  - migrations folder
- **Desired outcome:** DB enforces one-role-per-schedule and valid temp-change links.
- **Acceptance criteria:**
  1. Duplicate assignment attempts fail at DB layer.
  2. Orphan link inserts fail.
  3. Existing data migration/backfill handles legacy rows.

## Task 6 — Add readiness endpoint and deployment health policy
- **Objective:** Differentiate liveness and readiness.
- **Likely files:**
  - `apps/server/src/index.ts`
  - `docker-compose.prod.yml`
  - deployment docs
- **Desired outcome:** `/health` = process alive; `/ready` = dependencies healthy.
- **Acceptance criteria:**
  1. `/ready` fails on DB outage.
  2. Compose/K8s health checks target appropriate endpoint.

## Task 7 — CI quality gate expansion
- **Objective:** Ensure PRs cannot merge without lint/tests/build/docker smoke.
- **Likely files:**
  - `.github/workflows/ci.yml`
  - workspace scripts in root/package apps
- **Desired outcome:** Deterministic quality matrix.
- **Acceptance criteria:**
  1. CI runs lint + typecheck + tests + app build + docker build smoke on PRs.
  2. Failing gate blocks merge.

## Task 8 — Fix DX/docs drift and runtime commands
- **Objective:** Align README/.env/scripts/compose expectations.
- **Likely files:**
  - `README.md`
  - `.env.example`
  - `packages/db/package.json`
  - docs in `docs/architecture`
- **Desired outcome:** New developer can follow docs exactly with success.
- **Acceptance criteria:**
  1. Documented ports/CORS/script names match real config.
  2. Dev DB command works without hidden file assumptions.

## Task 9 — Frontend trust and UX correctness updates
- **Objective:** Remove known placeholders in operationally important areas.
- **Likely files:**
  - `apps/web/src/components/notification-bell.tsx`
  - `apps/web/src/routes/_authenticated/settings/roles.tsx`
- **Desired outcome:** Notification count is live; permissions matrix reflects backend truth.
- **Acceptance criteria:**
  1. Header badge reflects unread notifications.
  2. Role settings page renders from backend role model/API.

