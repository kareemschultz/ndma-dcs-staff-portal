# Remediation Backlog

## Phase 1 (Critical)

| ID | Priority | Item | Owner | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|
| P1-1 | P0 | Fix oRPC auth middleware context propagation | Backend | None | Protected + role procedures receive full context fields and regression tests pass |
| P1-2 | P0 | Align settings RBAC actions (`create/delete` mismatch) | Backend/Auth | P1-1 | No `requireRole` call references undefined action |
| P1-3 | P0 | Gate audit endpoints with `audit:read` role check | Backend | P1-1 | Non-audit roles get 403; audit/admin roles can read |
| P1-4 | P0 | Unblock install/build/test reproducibility | Platform/SRE | None | Fresh clone runs install + check-types + build + tests successfully |

## Phase 2 (High)

| ID | Priority | Item | Owner | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|
| P2-1 | P1 | Introduce domain-specific RBAC resources for incidents/services/temp-changes/cycles | Auth/Backend | P1-1 | All related routers use domain guards, policy docs updated |
| P2-2 | P1 | Enforce universal mutation audit logging via wrapper | Backend | P1-1 | CI check fails if mutation lacks audit event |
| P2-3 | P1 | Add DB constraints for rota uniqueness and temp link integrity | DB | P1-1 | Migration applies cleanly; duplicate/orphan inserts rejected |
| P2-4 | P1 | Implement `/ready` dependency checks (DB + critical services) | Backend/SRE | P1-4 | Orchestrator can distinguish live vs ready |

## Phase 3 (Medium)

| ID | Priority | Item | Owner | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|
| P3-1 | P2 | Resolve env/script/documentation drift (`CORS_ORIGIN`, DB compose commands, setup docs) | DX | P1-4 | README and scripts match executable reality |
| P3-2 | P2 | Replace notification bell TODO with real unread query | Frontend | P1-1 | Header shows accurate unread count |
| P3-3 | P2 | Harden sync scheduler for multi-replica deployments | Backend/SRE | P2-3 | No duplicate scheduled runs across replicas |
| P3-4 | P2 | Expand CI quality matrix (lint, tests, docker smoke) | Platform | P1-4 | PR blocked unless all gates pass |

## Phase 4 (Polish)

| ID | Priority | Item | Owner | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|
| P4-1 | P3 | Align branding/package naming and docs consistency | Product/DX | P3-1 | Terminology consistent across README/docs/packages |
| P4-2 | P3 | Reduce runtime image footprint and add SBOM + scan | SRE/Sec | P1-4 | CI publishes scan report and minimized images |
| P4-3 | P3 | Replace static roles settings matrix with source-of-truth rendering | Frontend/Auth | P2-1 | UI reflects backend role statements dynamically |

