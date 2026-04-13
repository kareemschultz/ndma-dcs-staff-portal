# Production Readiness Checklist

## Platform Integrity
- [ ] Dependency install reproducible (`bun install --frozen-lockfile`).
- [ ] Full typecheck/build/test pipeline passes.
- [ ] Database migrations validated in CI.

## Security
- [ ] Server-side RBAC authorization enforced on all protected procedures.
- [ ] 100% mutation audit logging coverage.
- [ ] Security headers configured (CSP, X-Content-Type-Options, etc.).
- [ ] Secret management policy for integration credentials implemented.

## Reliability
- [ ] Explicit `/health` and readiness semantics implemented.
- [ ] Docker image/runtime validated end-to-end.
- [ ] Rollback strategy documented.

## Observability
- [ ] Structured logs with request correlation IDs.
- [ ] Metrics endpoint and key SLO indicators.
- [ ] Alerting/runbook coverage for critical failures.

## Product/Business Fit
- [ ] Leave overlap/key-role constraints implemented.
- [ ] Rota fairness + leave conflict engine enforced.
- [ ] Escalation acknowledgement/response lifecycle modeled.
- [ ] Spreadsheet-driven workflows fully mapped and tested.

## Documentation & DX
- [ ] Architecture docs match implemented repository.
- [ ] Docs app availability decision finalized (implemented or references removed).
- [ ] Onboarding steps validated from clean environment.
