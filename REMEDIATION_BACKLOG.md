# Prioritized Remediation Backlog

## Phase 1 — Critical (Blocker)

### B-001 Enforce RBAC at API boundary
- **Priority:** P0
- **Severity:** Critical
- **Scope:** `packages/api/src/index.ts`, all routers
- **Work:** Add permission middleware; map each procedure to `{resource, action}`; deny by default.
- **Acceptance Criteria:**
  - All protected procedures include explicit permission contract.
  - Unit/integration tests verify role matrix and 403 behavior.

### B-002 Enforce mutation audit coverage
- **Priority:** P0
- **Severity:** Critical
- **Scope:** all mutation procedures
- **Work:** Add mutation helper or lint rule ensuring `logAudit` invoked.
- **Acceptance Criteria:**
  - 100% mutation handlers audited.
  - CI fails if new mutation lacks audit instrumentation.

### B-003 Fix runtime serving architecture
- **Priority:** P0
- **Severity:** Critical
- **Scope:** `apps/server/src/index.ts`, Docker/runtime config
- **Work:** Serve SPA static assets or split web/API services intentionally.
- **Acceptance Criteria:**
  - `/` serves frontend.
  - `/rpc/*` and auth endpoints remain functional.
  - Health endpoint explicitly implemented and used by checks.

## Phase 2 — High

### B-004 Restore reproducible dependency installation
- **Priority:** P1
- **Scope:** npm registry/mirror config, lockfile policy
- **Acceptance Criteria:** `bun install --frozen-lockfile` succeeds in CI and local.

### B-005 Strengthen CI gates
- **Priority:** P1
- **Scope:** `.github/workflows/ci.yml`
- **Work:** add lint, tests, security audit, Docker build smoke, migration check.
- **Acceptance Criteria:** Required checks block merge on failures.

### B-006 Implement leave/rota policy engine
- **Priority:** P1
- **Scope:** `leave.ts`, `rota.ts`, associated schema
- **Work:** overlap/key-role/fairness rules + manager exception audit trail.
- **Acceptance Criteria:** violations blocked and explainable.

### B-007 Add docs app or remove drift
- **Priority:** P1
- **Scope:** README/docs architecture, app structure
- **Acceptance Criteria:** documented architecture matches repository reality.

## Phase 3 — Medium

### B-008 Add observability baseline
- **Priority:** P2
- **Work:** structured logs, request IDs, tracing hooks, metrics endpoint.

### B-009 Harden connector secret handling
- **Priority:** P2
- **Work:** encrypted secret storage, rotation, least-privilege credentials, error redaction.

### B-010 Performance hardening for analytics endpoints
- **Priority:** P2
- **Work:** SQL-side aggregation/materialized views/caching for stats-heavy routes.

## Phase 4 — Polish

### B-011 Branding consistency sweep
- unify `DCS Ops Center` naming across UI/meta/package docs.

### B-012 UX polish
- standard empty/loading/error states across modules.

### B-013 Documentation completeness
- operational runbooks, incident SOPs, access review SOP, backup/restore docs.
