# Claude Code Implementation Tasks

## Task 1: API Authorization Enforcement Framework
- **Objective:** Enforce RBAC permissions server-side for all protected procedures.
- **Files likely involved:**
  - `packages/api/src/index.ts`
  - `packages/auth/src/index.ts`
  - `packages/api/src/routers/*.ts`
- **Desired outcome:** Each procedure declares required permission and is denied by default when missing.
- **Acceptance criteria:**
  - Permission middleware implemented and reused.
  - No procedure relies on UI-only role checks.
  - Automated tests validate all role/action paths.

## Task 2: Mutation Audit Guarantee
- **Objective:** Ensure all mutation procedures emit append-only audit log records.
- **Files likely involved:**
  - `packages/api/src/lib/audit.ts`
  - `packages/api/src/routers/*.ts`
  - CI scripts/check script in repo root
- **Desired outcome:** impossible to add mutation without audit instrumentation.
- **Acceptance criteria:**
  - Existing missing audit calls fixed.
  - Static check or test enumerates and validates mutation handlers.

## Task 3: Runtime Serving and Health Model Correction
- **Objective:** Align server behavior with deployment claims.
- **Files likely involved:**
  - `apps/server/src/index.ts`
  - `Dockerfile`
  - `docker-compose.prod.yml`
- **Desired outcome:** single container (or explicit split) reliably serves API + web and health endpoint.
- **Acceptance criteria:**
  - `/health` explicit.
  - `/` serves frontend in production mode.
  - compose healthcheck validated.

## Task 4: CI Pipeline Hardening
- **Objective:** add production-grade quality gates.
- **Files likely involved:** `.github/workflows/ci.yml`, package scripts
- **Desired outcome:** lint/test/typecheck/build/security/migration checks mandatory.
- **Acceptance criteria:**
  - CI fails on lint/test/security regressions.
  - Artifact logs clearly identify failing gate.

## Task 5: Leave Governance Rules Engine
- **Objective:** implement overlap and key-role leave constraints with exception workflow.
- **Files likely involved:**
  - `packages/api/src/routers/leave.ts`
  - `packages/db/src/schema/leave.ts`
  - related web leave request forms/routes
- **Desired outcome:** unsafe leave approvals blocked or explicitly exception-approved.
- **Acceptance criteria:**
  - team overlap caps configurable.
  - key-role conflict checks implemented.
  - decisions audited.

## Task 6: Rota Fairness and Conflict Enforcement
- **Objective:** prevent unsafe rota publication and improve fairness analytics.
- **Files likely involved:** `packages/api/src/routers/rota.ts`, `packages/db/src/schema/rota.ts`, rota web routes
- **Desired outcome:** publish validator catches conflicts/duplicates/coverage quality issues.
- **Acceptance criteria:**
  - leave-aware validation integrated.
  - fairness counters used for assignment suggestions/guardrails.
  - publish returns machine-readable conflict payload.

## Task 7: Observability Baseline
- **Objective:** add minimum production telemetry.
- **Files likely involved:** `apps/server/src/index.ts`, logging utilities, infra docs
- **Desired outcome:** structured logs + request IDs + metrics/tracing hooks.
- **Acceptance criteria:**
  - request correlation ID in logs and audit entries.
  - standardized error logging format.
  - basic operational dashboard possible.

## Task 8: Docs/Architecture Drift Resolution
- **Objective:** reconcile claimed docs app and real repository structure.
- **Files likely involved:** `README.md`, `docs/architecture/*`, optional new `apps/docs/*`
- **Desired outcome:** documentation accurately reflects what exists.
- **Acceptance criteria:**
  - either docs app restored and runnable, or references removed with rationale.
  - onboarding instructions pass dry-run.

## Task 9: Security Hardening Pass
- **Objective:** add HTTP security headers and secret handling safeguards.
- **Files likely involved:** `apps/server/src/index.ts`, sync connectors, env docs
- **Desired outcome:** CSP, safe defaults, secret redaction practices.
- **Acceptance criteria:**
  - CSP and key security headers present.
  - connector errors do not leak sensitive config.

## Task 10: Performance Improvements for Heavy Stats Endpoints
- **Objective:** reduce expensive full-table analytics in request path.
- **Files likely involved:** `packages/api/src/routers/dashboard.ts`, `incidents.ts`, DB indexes/views
- **Desired outcome:** bounded query costs under realistic production load.
- **Acceptance criteria:**
  - SQL-side aggregation and/or cached summaries used.
  - load test target latency met.
