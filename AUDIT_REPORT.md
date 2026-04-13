# Repository Audit Report

## 1. Executive Summary

**Overall assessment:** The repository has strong domain breadth and a realistic module breakdown, but it is **not production-ready** due to auth/RBAC correctness risks, CI/runtime drift, and unverified build/test paths in this environment.

**Production readiness:** **Partially ready (high risk)**.

**Top 10 findings (priority order):**
1. **RBAC middleware context mutation likely breaks permission checks and audit metadata propagation** (`protectedProcedure` rewrites context).  
2. **Settings RBAC actions are inconsistent** (`settings:create/delete` used in routers but not defined in role statements).  
3. **Audit log access is over-broad** (any authenticated user can query global audit logs).  
4. **Install/build/test are currently not reproducible in this environment** (`bun install` fails with registry 403; quality gates cannot run locally).  
5. **Critical route permissions are coarse and domain-misaligned** (`incidents`, `temp-changes`, `services`, `cycles` gated by `work:*` permissions).  
6. **Mandatory mutation audit-logging rule is not uniformly enforced** (several mutating endpoints do not call `logAudit`).  
7. **Data integrity gaps in schema** (intentional “bare FK” fields in temp-change/link models; missing constraints for rota uniqueness/fairness safeguards).  
8. **Health check is liveness-only, not readiness** (does not validate DB connectivity/dependency health).  
9. **CI quality gates are incomplete** (no lint job, no test job, partial build coverage only).  
10. **Docs and implementation drift** (README claims vs effective scripts/config behavior differ in several places).

---

## 2. What Is Already Strong

- Clear monorepo modularity (`apps/*`, `packages/*`) with domain-specific routers and schemas.
- Consistent use of typed input validation across API procedures (`zod` + oRPC patterns).
- Broad domain coverage aligned to DCS operational scope (work, incidents, rota, leave, access governance, compliance, procurement, temporary changes, automation).
- Security hardening effort present in server headers (CSP, frame policy, referrer policy, etc.).
- Structured audit helper (`logAudit`) and session/context extraction include IP/user-agent/request-id fields.
- Docker multi-stage build exists and non-root runtime user is used.

---

## 3. Critical Findings

### C1 — RBAC middleware/context propagation defect
- **Severity:** Critical
- **Evidence:** `requireAuth` calls `next({ context: { session: context.session } })`, which drops `userRole`, `ipAddress`, `userAgent`, and `requestId` injected by `createContext`. `requireRole` then reads `context.userRole` via unsafe cast. This indicates middleware contract misuse and high likelihood of forbidden/incorrect authorization and missing audit metadata at runtime.
- **Affected files/modules:**
  - `packages/api/src/index.ts`
  - `packages/api/src/context.ts`
  - All routers using `requireRole` and metadata fields in `logAudit`
- **Risk:** Authorization failures, inconsistent access control, audit trails missing role/IP/request correlation.
- **Recommended fix:** Preserve full context when auth middleware runs. Use middleware context extension pattern from current oRPC docs (merge, don’t clobber). Add integration tests for role-protected routes and audit metadata persistence.
- **Acceptance criteria:**
  - Protected and role-protected procedures receive `session`, `userRole`, `ipAddress`, `userAgent`, `requestId`.
  - Role checks pass/fail deterministically for each role matrix case.
  - Audit rows include populated actor role + correlation fields for role-protected mutations.

### C2 — RBAC action matrix mismatch for settings mutations
- **Severity:** Critical
- **Evidence:** Routers require `settings:create` and `settings:delete`, but `settings` statement in auth only defines `read` and `update`.
- **Affected files/modules:**
  - `packages/auth/src/index.ts`
  - `packages/api/src/routers/automation.ts`
  - `packages/api/src/routers/overlays.ts`
- **Risk:** Settings-related creation/deletion endpoints are effectively unreachable (or fail unexpectedly) for all roles, including admin depending on statement enforcement.
- **Recommended fix:** Align RBAC statement/action vocabulary and all `requireRole()` usages. Either add `create/delete` to settings statements (and assign per-role) or refactor endpoints to existing actions.
- **Acceptance criteria:**
  - No router references undefined action/resource combinations.
  - Automated permission test suite validates every route guard pair.

### C3 — Audit log exposure to all authenticated users
- **Severity:** Critical
- **Evidence:** `auditRouter.list` and `auditRouter.getByResource` use only `protectedProcedure`, not `requireRole("audit","read")`.
- **Affected files/modules:**
  - `packages/api/src/routers/audit.ts`
- **Risk:** Any staff-level user can access system-wide audit evidence containing potentially sensitive operational metadata.
- **Recommended fix:** Enforce `requireRole("audit","read")` plus server-side row/data minimization policy.
- **Acceptance criteria:**
  - Unauthorized roles receive FORBIDDEN on audit endpoints.
  - Authorized roles retrieve redacted/appropriate fields only.

### C4 — Build/test reproducibility blocked in current environment
- **Severity:** Critical (delivery/operability)
- **Evidence:** `bun install` fails with repeated npm registry `403` errors; then `turbo`/`playwright` binaries unavailable so `check-types`, `build`, and `test:e2e` fail.
- **Affected files/modules:** Entire CI/dev workflow validation path.
- **Risk:** Cannot verify that current HEAD compiles or passes tests in this environment; production confidence reduced.
- **Recommended fix:** Verify registry/auth/network settings and pin toolchain in developer onboarding docs. Add a minimal smoke-test workflow that runs in hermetic CI and stores artifacts.
- **Acceptance criteria:**
  - Fresh clone + install + typecheck/build/test works in documented environment.
  - CI reproduces same commands from README with no hidden prerequisites.

---

## 4. High-Priority Findings

### H1 — Domain permission model is too coarse for incidents/temp changes/services/cycles
- **Severity:** High
- **Evidence:** Multiple routers gate domain actions with `requireRole("work", ...)` rather than domain-specific resources.
- **Risk:** Over-entitlement and policy ambiguity (e.g., work editors implicitly gain incident/temp-change privileges).
- **Recommended fix:** Expand RBAC resources and migrate route guards to domain-scoped resources/actions.
- **Acceptance criteria:** Dedicated resource namespace exists for incident/temp-change/service/cycle domains and all related routes use it.

### H2 — Mutation audit coverage is incomplete despite project rule
- **Severity:** High
- **Evidence:** Several mutations (e.g., notifications state changes, some incident mutation handlers like add responder/timeline/service link operations) do not call `logAudit`.
- **Risk:** Forensic and compliance gaps; inability to reconstruct all state transitions.
- **Recommended fix:** Enforce `logAudit` in every mutation through shared wrapper/middleware and test assertions.
- **Acceptance criteria:** Static check or test fails if mutation procedure lacks audit emission.

### H3 — Data integrity constraints missing for critical rota/access/temporary-change workflows
- **Severity:** High
- **Evidence:**
  - `on_call_assignments` lacks unique constraint for `(scheduleId, role)` and `(scheduleId, staffProfileId)`.
  - `temporary_changes`/`temp_change_links` include “bare FK” fields with no DB-level references.
- **Risk:** Duplicate role assignments, orphaned links, and integrity drift.
- **Recommended fix:** Add relational constraints and backfill migration scripts with repair routines.
- **Acceptance criteria:** Database rejects duplicate/conflicting assignments and invalid references.

### H4 — Health endpoint is liveness-only
- **Severity:** High
- **Evidence:** `/health` returns static JSON without DB/critical dependency checks.
- **Risk:** Orchestrator can route traffic to unhealthy instances with broken DB connectivity.
- **Recommended fix:** Add `/ready` dependency checks and retain `/health` for liveness.
- **Acceptance criteria:** Readiness fails when DB unavailable; health remains process-level.

### H5 — CI gates incomplete for production governance
- **Severity:** High
- **Evidence:** CI runs type-check and web build only; no lint/test/e2e/docker runtime verification for PRs.
- **Risk:** Regressions and quality drift reach mainline.
- **Recommended fix:** Add lint, unit/integration tests, API build, and docker smoke run in CI.
- **Acceptance criteria:** PR merge blocked on full quality matrix.

---

## 5. Medium-Priority Findings

1. **Env/config drift:** `.env.example` uses `CORS_ORIGIN=http://localhost:5173` while web runs on 3001.
2. **DB command drift:** `packages/db` scripts use default `docker compose up -d` but repository exposes `docker-compose.prod.yml` and no root dev compose file.
3. **Role settings UI is static and diverges from backend RBAC reality** (`settings/roles.tsx` hardcoded matrix).
4. **Notification bell uses TODO stub count 0** despite notifications API availability.
5. **Background sync scheduler has no distributed locking**; multiple replicas can double-trigger jobs.
6. **Potential N+1/perf risks** in rich `with:` relation loading for list endpoints without selective fields or pagination in all nested relations.
7. **No explicit rate limiting / brute-force controls** visible on auth endpoints.
8. **No explicit structured logging/trace correlation beyond ad-hoc request-id extraction.**

---

## 6. Low-Priority / Polish Findings

- Branding/package naming drift (`ndma-dcs-staff-portal` vs “DCS Ops Center”) increases cognitive load.
- README is aspirational and over-claims production-readiness under current unresolved criticals.
- Some docs comments in Dockerfile conflict with actual Next.js configuration semantics.

---

## 7. Security Review

### Auth
- Better Auth is configured with local email+password fallback enabled (good for break-glass requirements).
- Cookie attributes use `sameSite: "lax"` and `secure` gated by production env (reasonable dev/prod split).
- AD/LDAP sign-in path appears UI-placeholder only; no active server-side LDAP auth flow confirmed.

### RBAC
- Central role statement exists, but action mismatch and coarse resource mapping materially weaken enforcement.
- Audit endpoints lack RBAC guard.

### Secrets / Env
- Env validation present.
- Operational drift between documented and expected env values introduces deployment risk.

### Request handling
- Security headers + CORS present.
- No evidence of rate-limiting/WAF controls in app layer.

### Auditability
- Strong intent with `logAudit` helper and context metadata.
- Incomplete mutation coverage and context propagation concern reduce trustworthiness.

---

## 8. Docker / Deployment Review

- Multi-stage Dockerfile exists with non-root runtime (good).
- Runtime image copies whole workspace `node_modules` (includes dev deps; larger attack surface).
- Health check is process-only; no readiness gate.
- Compose deployment is serviceable, but DB and app operational scripts/docs drift.
- Need SBOM/image scanning, pinned digest strategy, and startup migration strategy hardening.

---

## 9. Performance Review

- Dashboard/analytics endpoints aggregate many metrics; without profiling, query cost is uncertain.
- Some list routes fetch deep relation graphs; risk of heavy payloads.
- No explicit caching layer for expensive aggregate endpoints.
- Scheduler polling every 5 minutes on each instance without leader election can duplicate work.

---

## 10. UI/UX Review

- Route surface is extensive and appears broadly mapped to operational modules.
- Important UX gaps: notifications badge not wired, AD login button disabled placeholder, role settings table static/non-authoritative.
- Permission-aware UX exists in sidebar patterns, but backend guard consistency issues reduce trust.

---

## 11. Spreadsheet-to-Platform Gap Analysis

### Work management
- Weekly updates and work tracking exist; recurring templates exist.
- Gaps: stronger source-system reference normalization and cross-module dependency enforcement.

### On-call rota
- Schedules, swaps, escalation, warnings, history exist.
- Gaps: DB-level uniqueness for role coverage, explicit backup/secondary coverage semantics, stronger fairness analytics persistence.

### Leave/availability
- Leave balances and requests modeled.
- Gaps: explicit key-role overlap policy enforcement and tighter rota coupling constraints at DB/service layer.

### Access governance
- Strong schema support for platforms/auth sources/sync/reconciliation.
- Gaps: verify connector maturity and secret handling hardening in runtime ops.

### Temporary tracker
- First-class model exists with risk/category/network fields.
- Gaps: enforce foreign key integrity for declared link fields and ensure lifecycle reminders/escalations are auditable.

---

## 12. Production Readiness Checklist

- Architecture modularity: **Ready**
- Auth baseline: **Partially ready**
- RBAC correctness: **Not ready**
- Mutation audit completeness: **Not ready**
- API validation patterns: **Partially ready**
- DB integrity constraints: **Partially ready**
- Build/test reproducibility: **Not ready in audited environment**
- Docker hardening: **Partially ready**
- CI quality gates: **Partially ready**
- Observability/readiness: **Not ready**
- Documentation consistency: **Partially ready**

---

## 13. Prioritized Remediation Plan

### Phase 1 — Critical
1. Fix middleware context/RBAC propagation and add permission regression tests.
2. Align settings action matrix (statement + route guards).
3. Protect audit endpoints with explicit audit role check.
4. Restore reproducible install/check/build in local+CI.

### Phase 2 — High Priority
1. Refactor RBAC to domain-level resources for incidents/temp changes/services/cycles.
2. Enforce universal mutation audit logging.
3. Add DB constraints for rota uniqueness and temp-change referential integrity.
4. Add readiness endpoint with dependency checks.

### Phase 3 — Medium
1. Resolve env/script drift in docs and DB tooling commands.
2. Wire notification bell to real unread count.
3. Add distributed lock/leader election for scheduler.
4. Add lint/test/e2e jobs to CI.

### Phase 4 — Polish
1. Align naming/branding consistency.
2. Reduce Docker runtime footprint and add image scan/SBOM steps.
3. Improve docs precision where comments and implementation diverge.

---

## 14. Agent-Ready Fix Tasks

See `CLAUDE_FIX_TASKS.md` for implementation-ready task cards.

---

## 15. Open Questions / Unverifiable Areas

1. Full runtime correctness could not be validated due dependency install failure (npm registry 403 in this environment).
2. Could not execute integration/e2e flows (Playwright/turbo unavailable post-install failure).
3. Could not verify Docker build/runtime execution end-to-end under current network/package constraints.
4. Could not verify LDAP/AD server-side integration beyond observed UI placeholder.

---

## Official Documentation Baseline Used

- Better Auth options/plugins: https://better-auth.com/docs/reference/options
- oRPC procedure/middleware docs: https://orpc.dev (middleware + procedure builder references)
- Hono docs (CORS/static): https://hono.dev
- Drizzle ORM docs: https://orm.drizzle.team
- TanStack Router docs: https://tanstack.com/router/latest/docs
- TanStack Query docs: https://tanstack.com/query/latest/docs
- Tailwind CSS v4 docs: https://tailwindcss.com/docs
- Bun docs: https://bun.sh/docs
- Turborepo docs: https://turbo.build/repo/docs
- Fumadocs docs: https://fumadocs.dev/docs
- Docker best practices: https://docs.docker.com/build/building/best-practices/

