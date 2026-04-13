# Production Readiness Checklist — DCS Ops Center

## Status Legend
- ✅ Ready
- 🟡 Partially Ready
- ❌ Not Ready

## Platform
- 🟡 Monorepo architecture and modular boundaries are clear
- ❌ Build/test reproducibility confirmed in audited environment
- 🟡 Runtime dependency management and lockfile discipline

## Security & Auth
- 🟡 Better Auth configured with local fallback admin capability
- ❌ RBAC route guards fully consistent with role-action matrix
- ❌ Audit API access restricted to privileged roles only
- ❌ Rate-limiting/brute-force controls verified

## RBAC & Governance
- ❌ Domain-level least-privilege permissions for incidents/temp-changes/services/cycles
- ❌ End-to-end automated permission regression tests
- 🟡 UI role awareness (present but partly static/non-authoritative)

## Auditability
- 🟡 Global audit log table exists
- ❌ Every mutation emits `logAudit`
- ❌ Audit metadata propagation guaranteed through middleware chain

## API & Backend
- 🟡 Input validation coverage (strong baseline with Zod)
- ❌ Error handling and readiness semantics production-hardened
- 🟡 OpenAPI/RPC surfacing present

## Database
- 🟡 Broad schema coverage for DCS domains
- ❌ DB-level constraints for rota uniqueness and some cross-links
- 🟡 Migration strategy (present, needs verification in CI/runtime)

## Docker & Deployment
- 🟡 Multi-stage Docker + non-root runtime
- ❌ Readiness endpoint integrated in orchestrator health policy
- 🟡 Runtime image minimization and scan hardening

## Observability
- 🟡 Request ID extraction present
- ❌ Structured logs/tracing/metrics coverage
- ❌ Alerting SLOs and operational dashboards verified

## CI/CD & DX
- 🟡 Typecheck/build in CI
- ❌ Lint/test/e2e/docker-smoke mandatory on PRs
- ❌ Onboarding commands fully aligned with repository reality

## Product Workflow Fit
- 🟡 Strong module breadth across operational domains
- ❌ Critical workflow invariants enforced at DB/service layer
- 🟡 Spreadsheet-to-platform mapping mostly present, with rule gaps

## Final Readiness Verdict
**Current status: ❌ Not Ready for strict production cutover until critical and high-priority backlog items are remediated.**

