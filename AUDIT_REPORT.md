# Repository Audit Report

## 1. Executive Summary

### Overall assessment
The repository has a strong domain model breadth and clear module decomposition, but it is **not production-ready** as implemented. The largest blockers are security authorization gaps (authN without authZ), runtime/deployment drift (declared docs app missing, server/static assumptions), and inability to execute quality gates in this environment due dependency install failures.

### Production readiness
**Current status: Partially implemented architecture, not ready for production rollout.**

### Top 10 findings
1. **Critical:** RBAC is declared in Better Auth but not enforced in API procedures (server-side authZ gap).
2. **Critical:** Mutation audit logging is inconsistent (several mutating endpoints do not call `logAudit`).
3. **Critical:** Deployment/runtime mismatch: Docker and README claim combined web+API serving, but server code only returns `"OK"` at `/` and does not serve built web assets.
4. **High:** Docs app is declared in architecture/README but `apps/docs` is absent.
5. **High:** CI lacks lint/test/security gates; only typecheck/build jobs are configured.
6. **High:** Dependency installation failed with extensive 403 registry errors; build/runtime quality cannot be fully validated.
7. **High:** Leave/rota business rules are shallow (no overlap policy enforcement, weak fairness/constraint logic).
8. **Medium:** On-call/escalation lacks acknowledgement/response SLO workflow despite Better Stack-inspired goals.
9. **Medium:** Branding/product-name drift across UI and package names (`Staff Portal` vs `DCS Ops Center`).
10. **Medium:** Observability is minimal (console error only, no structured logging/tracing/metrics).

---

## 2. What Is Already Strong

- Clear monorepo domain separation (`apps/*`, `packages/*`) with modular routers/schemas.
- Broad data-model coverage across operations domains (work/incidents/rota/leave/access/compliance/etc.).
- Consistent use of Zod inputs + Drizzle typed access in most API handlers.
- Presence of dedicated audit and notification utility layers (`packages/api/src/lib/audit.ts`, `notify.ts`).
- Useful domain scaffolding for access sync architecture (connector interface + job processor).

---

## 3. Critical Findings

### C1 — RBAC is not enforced in API procedures
- **Severity:** Critical
- **Evidence:** `protectedProcedure` only checks session existence; no role/permission checks in handlers.
- **Affected modules:** `packages/api/src/index.ts`, most files under `packages/api/src/routers/*.ts`
- **Risk:** Any authenticated user can call sensitive mutations if they can reach RPC endpoints.
- **Recommended fix:** Implement server-side permission middleware using Better Auth admin plugin permission checks (`userHasPermission`) mapped per route/action.
- **Acceptance criteria:**
  - Every mutation and sensitive read has explicit permission guard.
  - Automated permission matrix tests for all roles.
  - Unauthorized role returns consistent 403.

### C2 — Audit logging policy not consistently applied to mutations
- **Severity:** Critical
- **Evidence:** Multiple mutating handlers (e.g., notification status updates, incident responder/service link updates) do not call `logAudit`.
- **Affected modules:** `packages/api/src/routers/notifications.ts`, portions of `incidents.ts`, likely other mutation handlers.
- **Risk:** Forensic and compliance gaps; no immutable trace for privileged or business-critical changes.
- **Recommended fix:** Add mandatory audit wrapper utility/middleware that enforces audit emission for all mutation paths.
- **Acceptance criteria:**
  - Mutation inventory script reports 100% coverage.
  - CI check fails if mutation lacks audit call.

### C3 — Runtime/deployment behavior mismatches declared architecture
- **Severity:** Critical
- **Evidence:** Server root returns plain text `OK`; no static asset serving for web build despite Docker copying `apps/web/dist`.
- **Affected modules:** `apps/server/src/index.ts`, `Dockerfile`, `docker-compose.prod.yml`, README architecture claims.
- **Risk:** Production container may boot without serving frontend; operational outage on web access.
- **Recommended fix:** Implement static-file fallback for SPA build or separate web container/reverse proxy config.
- **Acceptance criteria:**
  - `docker compose -f docker-compose.prod.yml up` serves `/` SPA and `/rpc` API.
  - Healthcheck + smoke tests validated in CI.

---

## 4. High-Priority Findings

### H1 — Declared docs app missing
- **Severity:** High
- **Evidence:** README/docs reference `apps/docs`, but folder/package absent.
- **Risk:** Documentation supply-chain drift; onboarding and compliance docs unavailable.
- **Fix:** Add actual `apps/docs` Fumadocs app or remove claims and adjust architecture docs.
- **Acceptance criteria:** docs app exists, boots, and is linked.

### H2 — CI quality gates insufficient
- **Severity:** High
- **Evidence:** `.github/workflows/ci.yml` only runs install + typecheck/build, no lint/test/security scan.
- **Risk:** Regressions and vulnerabilities merge undetected.
- **Fix:** Add lint, tests, migration checks, dependency audit, container build scan.
- **Acceptance criteria:** PR required checks include lint+test+build+security.

### H3 — Environment/runtime validation could not be completed
- **Severity:** High
- **Evidence:** `bun install --frozen-lockfile` fails with many 403 errors; downstream tasks unavailable.
- **Risk:** Unknown runtime quality; hidden build/runtime defects.
- **Fix:** Resolve package registry access/mirror policy; pin reproducible install path.
- **Acceptance criteria:** clean install and full pipeline success in CI and local.

### H4 — Leave governance rules incomplete
- **Severity:** High
- **Evidence:** leave approval logic updates balances but does not enforce overlap caps/team constraints/key-role conflict rules.
- **Risk:** Operational staffing risk; rota instability.
- **Fix:** Add policy engine for overlap thresholds, key-person constraints, manager exception workflow.
- **Acceptance criteria:** rule violations blocked with actionable errors; policy tests pass.

### H5 — On-call schedule conflict logic incomplete
- **Severity:** High
- **Evidence:** role-fill validation exists, but robust leave-aware conflict detection/duplicate assignment prevention/fairness constraints are partial.
- **Risk:** unsafe coverage planning.
- **Fix:** Pre-publish validator (leave conflicts, duplicate people across roles, fairness caps).
- **Acceptance criteria:** publish fails with structured conflict report until resolved.

---

## 5. Medium-Priority Findings

1. **M1 — Branding drift** (`DCS Ops Center` vs `NDMA DCS Staff Portal`) across titles/login/meta.
2. **M2 — Observability gap**: no metrics, tracing, request IDs, structured JSON logs.
3. **M3 — Security headers/CSP missing** in Hono server configuration.
4. **M4 — API docs path drift**: docs mention `/api/openapi.json`, server mounts OpenAPI under `/api-reference/*`.
5. **M5 — Placeholder UX remains** (AD sign-in disabled with “coming soon”; notification TODOs).
6. **M6 — Import/sync connector hardening incomplete** (secret handling, retries, idempotency/telemetry depth).
7. **M7 — No automated test suite present** (no `test` script at workspace root).

---

## 6. Low-Priority / Polish Findings

- Standardize status enums/messages across modules.
- Add pagination consistency (limit/offset defaults and max caps vary).
- Improve empty/error/loading UX consistency across routes.
- Normalize naming and package scope to final product identity.

---

## 7. Security Review

### Auth
- Better Auth is configured with local email/password enabled (good for fallback).
- Session-based auth enforced via `protectedProcedure`.
- **Gap:** authZ absent in API.

### RBAC
- RBAC statement/roles defined in auth package.
- **Gap:** no API-side checks tying route actions to RBAC policy.

### Secrets / env
- Env schema validation exists.
- `.env.example` includes placeholders only (good).
- Integration credentials likely stored in DB config JSON for connectors; needs encryption-at-rest strategy and secret-management policy.

### Audit
- Audit helper exists and many routes use it.
- **Gap:** inconsistent mutation coverage.

### Request handling
- CORS configured with explicit origin and credentials.
- No explicit CSP/secure headers middleware detected.

---

## 8. Docker / Deployment Review

- Dockerfile uses multi-stage and non-root `bun` user (good baseline).
- Runtime image copies large workspace content and `node_modules` from build stage; no pruning strategy observed.
- Healthcheck endpoint `/health` assumed in comments, but server routes show `/` returning `OK`; no explicit `/health` route in inspected code.
- Could not run Docker validation in this environment (`docker` binary unavailable).

---

## 9. Performance Review

- Several stats endpoints load full datasets and aggregate in application code (e.g., `incidents.stats`), risking scalability issues.
- Dashboard makes many independent aggregate queries; acceptable at small scale, may require materialized views/caching.
- Potential N+1 risks reduced by Drizzle `with` usage in many paths, but heavy relation fetches on list views may still be expensive.
- No explicit caching or background pre-computation strategy detected for heavy analytics.

---

## 10. UI/UX Review

- Route coverage is broad across operational modules.
- Sidebar includes docs/import/settings areas; however architecture/docs route coupling has drift due missing docs app.
- Placeholder AD sign-in and TODO notification indicator remain in core UX.
- No verified permission-aware navigation enforcement tied to server RBAC.

---

## 11. Spreadsheet-to-Platform Gap Analysis

### Work management
- Present: types, weekly updates, source fields, overdue tracking.
- Missing/weak: recurring work model, external follow-up lifecycle, richer linkage (incidents/services/temp changes cross-links and analytics depth).

### On-call rota
- Present: schedules, assignments, swaps, overrides, escalation policy tables.
- Missing/weak: explicit primary/secondary coverage, ack/response tracking, fairness engine with enforceable constraints, robust leave conflict integration.

### Leave / availability
- Present: leave balances and requests.
- Missing/weak: overlap constraints, key-role restrictions, contract-year rule rigor, manager exception policy trails.

### Access governance
- Present: account/auth source/sync mode/external contacts/reconciliation scaffolding.
- Missing/weak: hardened connector credential governance, mature automated reconciliation lifecycle and SLA/ownership workflow.

### Temporary tracker
- Present: first-class schema/router/UI routes.
- Missing/weak: reminder/notification automation depth and operational cleanup workflows.

---

## 12. Production Readiness Checklist

| Area | Status |
|---|---|
| Architecture modularization | partially ready |
| AuthN | partially ready |
| AuthZ / RBAC enforcement | not ready |
| Audit completeness | partially ready |
| Build reproducibility | not ready |
| Automated tests | not ready |
| CI quality gates | partially ready |
| Docker runtime validation | not ready |
| Observability | not ready |
| Security headers hardening | not ready |
| Business rule completeness | partially ready |
| Documentation fidelity | partially ready |

---

## 13. Prioritized Remediation Plan

### Phase 1 Critical
1. Implement server-side RBAC permission middleware and apply across routers.
2. Enforce 100% mutation audit coverage with CI guard.
3. Resolve runtime serving model (API + web static) and validate Docker health paths.

### Phase 2 High Priority
1. Fix dependency installation/registry policy and pipeline reproducibility.
2. Add CI lint/test/security gates and baseline tests.
3. Implement leave/rota policy engine for constraints and fairness.

### Phase 3 Medium
1. Add observability stack (structured logs, metrics, traces, request IDs).
2. Align docs claims with actual `apps/docs` implementation.
3. Close API/docs path drift and branding inconsistencies.

### Phase 4 Polish
1. UX consistency improvements (states/errors/empty).
2. Performance optimizations for analytics endpoints.
3. Refactor naming consistency and developer docs quality.

---

## 14. Agent-Ready Fix Tasks

(See dedicated `CLAUDE_FIX_TASKS.md` for implementation-ready task cards.)

---

## 15. Open Questions / Unverifiable Areas

1. Could not verify successful install/typecheck/build due registry 403 failures.
2. Could not validate Docker build/runtime because Docker CLI unavailable in this environment.
3. Could not execute end-to-end auth/protected-route behavior without runnable stack.
4. No uploaded spreadsheet artifacts were available for direct row-by-row validation; business-fit analysis based on requirements provided in prompt.

---

## Documentation-first references consulted
- Better Auth admin/access control docs.
- oRPC OpenAPI handler/reference docs.
- Hono, Drizzle, TanStack Router/Query, Tailwind v4, Bun, Turborepo, Fumadocs official docs (repo also tracks these in `docs/architecture/implementation-sources.md`).
