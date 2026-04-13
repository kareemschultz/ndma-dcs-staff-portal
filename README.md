<div align="center">

<img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield-check.svg" alt="DCS Ops Center" width="80" height="80" />

# DCS Ops Center

### Work · Incidents · On-Call Roster · Leave · Procurement · Compliance · Access · Audit · Automation

*Replacing spreadsheets and WhatsApp coordination with a production-grade enterprise operations platform for the DCS.*

<br/>

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Hono](https://img.shields.io/badge/Hono-4.x-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev)
[![Bun](https://img.shields.io/badge/Bun-1.3-FBF0DF?style=for-the-badge&logo=bun&logoColor=black)](https://bun.sh)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.x-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)](https://turborepo.dev)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](LICENSE)

<br/>

[![Better Auth](https://img.shields.io/badge/Better_Auth-1.5-6366F1?style=flat-square&logo=auth0&logoColor=white)](https://better-auth.com)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-Latest-C5F74F?style=flat-square)](https://orm.drizzle.team)
[![TanStack](https://img.shields.io/badge/TanStack-Router_+_Query-FF4154?style=flat-square)](https://tanstack.com)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Latest-000000?style=flat-square)](https://ui.shadcn.com)
[![oRPC](https://img.shields.io/badge/oRPC-1.x-7C3AED?style=flat-square)](https://orpc.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

<br/>

[**Documentation**](https://github.com/kareemschultz/ndma-dcs-ops-center) · [**Report Bug**](https://github.com/kareemschultz/ndma-dcs-ops-center/issues) · [**Request Feature**](https://github.com/kareemschultz/ndma-dcs-ops-center/issues)

</div>

---

## Screenshots

> To view the live app, run `bun run dev` — the web app starts at **http://localhost:5173**.
> Toggle between Light and Dark mode via the theme switcher in the user menu (top-right of the sidebar).

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | KPI cards, ops readiness indicator, workload imbalance widget, active cycles progress, recent activity feed |
| Ops Readiness | `/ops-readiness` | Service health status grid, on-call coverage, recent incidents, staffing availability |
| Work Register | `/work` | 5-view work item register: List · Kanban · Grid · Calendar · Analytics; per-engineer bar chart |
| Work Workload | `/work/workload` | Per-engineer workload cards with load score, colour-coded overload/low-load grouping |
| Cycles | `/cycles` | Sprint/cycle board; create cycles, link work items, track progress |
| Incidents | `/incidents` | Active and historical incidents, severity badges, MTTR stats |
| On-Call Roster | `/rota` | Weekly schedule grid; assign/swap/publish; escalation policy editor |
| Rota Planner | `/rota/planner` | Drag-and-drop weekly planner for next cycle |
| Temp Changes | `/changes` | Temporary technical changes with remove-by dates; overdue auto-flagging |
| Procurement | `/procurement` | PR list with status pipeline badges; pending approvals queue for managers |
| New PR | `/procurement/new` | Multi-step PR creation form with line items |
| Staff Directory | `/staff` | Staff cards with status indicators; full profile modal |
| Staff Profile | `/staff/:staffId` | Tabbed profile: Overview · Contracts · Training · PPE · On-Call · Leave |
| Leave | `/leave` | Leave requests list; team calendar heatmap |
| New Leave | `/leave/new` | Leave request form with balance display |
| Contracts | `/contracts` | Contract register with expiry tracking |
| Appraisals | `/appraisals` | Appraisal records with rating distribution |
| Service Registry | `/services` | Platform services catalogue with runbook/docs links |
| Platform Access | `/access` | Identity governance — Accounts · VPN · Groups · Contacts · Integrations · Reconciliation · Reviews tabs |
| Compliance | `/compliance/training` | Training certification records with expiry alerts |
| PPE | `/compliance/ppe` | PPE issuance records per staff member |
| Policy Acks | `/compliance/items` | Policy acknowledgement tracking |
| Reports | `/reports` | Cross-module reporting dashboard |
| Audit Log | `/audit` | Searchable append-only audit trail with before/after diff |
| Import Data | `/import` | CSV/XLSX staff data import with dry-run preview |
| Notifications | `/notifications` | In-app notification centre; mark-read, dismiss |
| Settings | `/settings/general` | System-wide configuration |
| Departments | `/settings/departments` | Department management |
| Leave Types | `/settings/leave-types` | Configurable leave type catalogue |
| Escalation | `/settings/escalation` | Escalation policy and step editor |
| Roles | `/settings/roles` | RBAC role viewer |
| Automation | `/settings/automation` | Automation rules engine — create rules, view fire logs |
| Documentation | `http://localhost:4000` | Fumadocs MDX wiki (separate Next.js app) |

---

## What is DCS Ops Center?

**DCS Ops Center** is a **production-ready enterprise operations platform** built for the **Data Centre Services (DCS)** division of the **National Data Management Authority (NDMA)**.

It replaces manual spreadsheets, WhatsApp coordination chains, and paper-based tracking with a centralized, role-aware, fully auditable system covering every DCS operational workflow:

> **Work Management** · **Incident Command** · **PagerDuty-style On-Call Roster** · **Leave & Availability** · **Purchase Requisitions** · **Compliance** · **Platform Access Control** · **Audit & Governance** · **Automation Rules Engine**

Every action in the system is captured in an append-only audit log — who did what, when, from where — making the platform suitable for cybersecurity compliance reviews and governance reporting.

---

## Features

<table>
<tr>
<td width="50%">

**📋 Work Management**
- Work register with 5 views: List · Kanban · Grid · Calendar · Analytics
- Work Initiatives (epics) and item dependencies (blocks/relates-to graph)
- Four work types: Routine, Project, External Request, Ad-hoc
- Weekly progress updates (statusSummary, blockers, nextSteps), comments thread
- Recurring task templates — define once, generate on demand with a due date
- Overdue alerts, per-assignee load analytics (horizontal bar chart), stats dashboard

**🔄 Cycles & Sprint Planning**
- Sprint/cycle board with active, draft, and completed cycle views
- Progress tracking: done items / total items per cycle with visual progress bars
- Work items linked to cycles; cycle stats endpoint
- Dashboard widget showing live progress of all active cycles

**🚨 Incident Management**
- Declare and track operational incidents (Sev1–Sev4)
- Full status lifecycle: Detected → Investigating → Identified → Mitigating → Resolved → Post-Mortem → Closed
- Timeline of events, status changes, escalation notes; MTTR analytics
- Incident responder assignment with roles (Commander, Comms, Technical, Observer)
- Post-Incident Review (PIR) with action items and lessons learned
- Affected service linkage with runbook + docs URLs per service

**🕒 On-Call Roster**
- Weekly schedule planner with 4 on-call roles (Lead, ASN, CORE, ENT)
- Pre-publish validation — catches missing roles before schedule goes live
- Conflict detection: leave overlap, double-booking within same schedule
- Shift swap system with manager approval workflow
- Escalation policy editor with timed steps per service or department
- Override management for ad-hoc assignment changes

**🛒 Purchase Requisitions**
- PR creation with itemised line items (description, quantity, unit cost)
- Full pipeline: Draft → Submit → Approve → Order → Receive
- Multi-level approval history with notes
- Pending approvals queue for managers; department-scoped spend tracking

</td>
<td width="50%">

**👥 Staff & People**
- Staff directory with full profile view (overview, contracts, training, PPE, on-call, leave tabs)
- Employment type, status, and department tracking
- Contract lifecycle tracking with renewal reminders
- Appraisal scheduling and performance ratings
- Leave requests, leave balances, team availability calendar
- Leave overlap cap — configurable max per-department concurrent leaves

**📊 Workload Intelligence**
- Per-engineer workload score (open work + overdue items + on-call duty + leave + overdue changes)
- Load classification: Low · Medium · High · Overloaded
- Weekly workload view with engineer cards grouped by load level
- Dashboard widget showing current workload imbalance (overloaded vs. low-load engineers side-by-side)

**🤖 Automation Rules Engine**
- Rule-based notification system — watch for events, evaluate conditions, execute actions
- Triggers: `work`, `incident`, `leave`, `temp_changes`, `procurement`, `rota`
- Events per trigger: `created`, `status_changed`, `overdue`, `approved`, `resolved`, and more
- Conditions: field-level comparisons (eq / neq / gt / lt / contains) — all must pass (AND logic)
- Actions: in-app notification with `{{field}}` placeholder interpolation
- Fire log per rule — full audit trail of when rules fired, what payload was passed, and whether actions succeeded
- Settings UI at `/settings/automation` — create, edit, enable/disable, view logs

**🔌 Platform Access & Identity Governance**
- Full CRUD for accounts, external contacts, access groups, and platform integrations (create + edit dialogs)
- Account registry: VPN, Fortigate, phpIPAM, RADIUS, AD, uPortal, Zabbix, biometric, and more
- **External contacts** — contractors, consultants, vendors, agency users (not just NDMA staff)
- **User affiliation** — ndma_internal / external_agency / contractor / consultant / vendor / shared_service
- **VPN management** — per-account VPN flag, group, and profile; dedicated VPN Access tab
- **Access groups** — AD groups, VPN groups, platform roles, RADIUS groups; soft-delete membership history
- **Access review (certification)** workflow — approve/revoke/escalate; revoking auto-disables the account
- Multi-source auth: Local · AD/LDAP · RADIUS · SAML · OAuth/OIDC · Service Accounts · API-only
- Three sync modes: Manual, Synced (API-owned), Hybrid
- **Background sync scheduler** — auto-fires sync jobs based on `syncFrequencyMinutes` per integration (5-min polling loop)
- Reconciliation engine: orphaned accounts, disabled-staff-active-account, expired-contractor, mismatches

**🛡️ Compliance**
- Training records with provider, completion date, expiry, and certificate URL
- PPE issuance and expiry tracking per staff member
- Policy acknowledgement log with version control
- Cross-cutting compliance overview: all expiring items in one view

**🔧 Temporary Technical Changes**
- Track all temporary infrastructure changes with remove-by dates
- Overdue auto-flagging with rollback plan documentation
- Service linkage for impact assessment

**🔐 Audit & Governance**
- Global append-only audit log for every mutation
- IP address + user agent + request correlation ID captured for forensics
- JSON before/after diff for every state change; actor role recorded
- 5-role RBAC over 13 resources: staff, work, leave, rota, compliance, contract, appraisal, report, audit, settings, procurement, notification, access
- Emergency local admin fallback (always enabled, even with AD/LDAP active)

</td>
</tr>
</table>

---

## Tech Stack

<div align="center">

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | [Bun 1.3](https://bun.sh) | Fast JS runtime + package manager |
| **Monorepo** | [Turborepo](https://turborepo.dev) | Build caching + task orchestration |
| **Frontend** | [React 19](https://react.dev) + [TanStack Router](https://tanstack.com/router) | SPA with file-based routing |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) | Utility-first + accessible components |
| **Layout** | [shadcn-admin](https://github.com/satnaing/shadcn-admin) | Production admin UI patterns |
| **Data Fetching** | [TanStack Query v5](https://tanstack.com/query) | Server state + caching |
| **Data Tables** | [TanStack Table v8](https://tanstack.com/table) | Sortable, filterable, paginated |
| **Charts** | [Recharts](https://recharts.org) | Dashboard analytics |
| **Backend** | [Hono](https://hono.dev) | Lightweight HTTP framework on Bun |
| **API Layer** | [oRPC](https://orpc.dev) | Type-safe RPC + OpenAPI generation |
| **Auth** | [Better Auth](https://better-auth.com) | RBAC + LDAP/AD integration |
| **Database** | [PostgreSQL 16](https://postgresql.org) | Relational database |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team) | Type-safe SQL with migrations |
| **Validation** | [Zod v4](https://zod.dev) | Schema validation (shared) |
| **Forms** | [React Hook Form](https://react-hook-form.com) | Performant form management |
| **Icons** | [Lucide Icons](https://lucide.dev) | Consistent icon library |
| **Toasts** | [Sonner](https://sonner.emilkowal.ski) | Notification toasts |
| **Docs** | [Fumadocs](https://fumadocs.dev) | MDX documentation site |
| **DevOps** | [Docker](https://docker.com) | Dev DB + production deployment |

</div>

---

## Project Structure

```
ndma-dcs-ops-center/
├── apps/
│   ├── web/                    # React frontend (Vite, port 5173)
│   │   └── src/
│   │       ├── components/     # Layout shell + shared components
│   │       ├── features/       # Feature modules (work, leave, rota, procurement...)
│   │       ├── routes/         # TanStack Router file-based routes
│   │       └── utils/          # oRPC client + QueryClient setup
│   ├── server/                 # Hono backend (port 3000)
│   └── docs/                   # Fumadocs documentation (port 4000)
├── packages/
│   ├── api/                    # oRPC procedures + context (shared by server)
│   │   └── src/
│   │       ├── routers/        # 18 domain routers + index
│   │       └── lib/            # logAudit(), createNotification(), fireAutomationRules(), sync/
│   ├── auth/                   # Better Auth config (shared by server + web)
│   ├── db/                     # Drizzle schema + migrations
│   │   └── src/schema/         # 21 schema files, one per domain
│   ├── env/                    # Type-safe env validation
│   ├── ui/                     # Shared shadcn/ui components
│   └── config/                 # Shared TypeScript config
├── docs/                       # Developer reference (architecture, ADRs)
├── CHANGELOG.md                # Release history
├── Dockerfile                  # Multi-stage production build
├── docker-compose.yml          # PostgreSQL container (dev)
├── docker-compose.prod.yml     # Full stack (PostgreSQL + app, production)
├── turbo.json                  # Turborepo task config
├── CLAUDE.md                   # Claude AI context + critical gotchas
├── AGENTS.md                   # OpenAI/Copilot agent context
└── GEMINI.md                   # Gemini CLI context
```

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- [Docker](https://docker.com) (for PostgreSQL)

### 1. Clone & Install

```bash
git clone https://github.com/kareemschultz/ndma-dcs-ops-center.git
cd ndma-dcs-ops-center
bun install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Default values work for local development
```

### 3. Start the Database

```bash
bun run db:start    # Start PostgreSQL via Docker
bun run db:push     # Push schema to database
```

### 4. Seed Sample Data (optional)

```bash
bun run db:seed     # Loads 11 DCS staff, 4 departments, demo rota schedule
```

### 5. Start Development

```bash
bun run dev         # Starts all apps via Turborepo
```

| App | URL |
|-----|-----|
| Web App | http://localhost:5173 |
| API Server | http://localhost:3000 |
| API Reference | http://localhost:3000/api-reference |
| Documentation | http://localhost:4000 |

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/ndma_dcs_portal` |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 chars) | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Backend base URL | `http://localhost:3000` |
| `CORS_ORIGIN` | Frontend origin for CORS | `http://localhost:5173` |
| `VITE_SERVER_URL` | Backend URL for frontend | `http://localhost:3000` |

---

## Roles & Permissions

| Role | Access |
|------|--------|
| **Admin** | Full system access — all modules, settings, user management |
| **Manager** | Staff management, leave approvals, rota management, appraisals, PR approvals |
| **HR/Admin Ops** | Staff CRUD, all leave/rota/compliance, procurement management |
| **Staff** | Own profile, submit leave requests and PRs, view rota |
| **Read Only** | View-only access across all modules |

All role checks are enforced server-side via `requireRole(resource, action)` middleware on every mutation — client role claims are never trusted. Read-only procedures use `protectedProcedure` (session check only).

---

## Architecture

```mermaid
graph TB
    A[Browser — React SPA] -->|/rpc/* oRPC| B[Hono Server — Bun]
    A -->|/api/auth/* cookie| B
    B --> C[packages/api — oRPC Procedures]
    B --> D[packages/auth — Better Auth + RBAC]
    C --> E[packages/db — Drizzle ORM]
    D --> E
    E --> F[(PostgreSQL 16)]
    C --> G[logAudit — every mutation]
    C --> H[createNotification — in-app alerts]
    C --> L[fireAutomationRules — event-driven rules]
    I[apps/docs — Fumadocs] -.->|reads| J[content/docs/*.mdx]
    B -->|/api-reference/*| K[OpenAPI — External Integrations / IPAM / AD Sync]
```

---

## Database Schema Overview

| Module | Tables |
|--------|--------|
| Auth | `user`, `session`, `account`, `verification` (Better Auth managed) |
| Audit | `audit_logs` (append-only, actor role + request correlation ID) |
| Notifications | `notifications` |
| Org | `departments`, `staff_profiles` |
| On-Call | `on_call_schedules`, `on_call_assignments`, `on_call_swaps`, `assignment_history` |
| Escalation | `escalation_policies`, `escalation_steps`, `on_call_overrides` |
| Incidents | `services` (+ runbookUrl/docsUrl), `incidents` (+ linkedWorkItemId), `incident_affected_services`, `incident_responders`, `incident_timeline`, `post_incident_reviews` |
| Work | `work_initiatives`, `work_items`, `work_item_comments`, `work_item_weekly_updates`, `work_item_dependencies`, `work_item_templates` |
| Cycles | `cycles`, `cycle_work_items` |
| Leave | `leave_types`, `leave_balances`, `leave_requests` |
| Procurement | `purchase_requisitions`, `pr_line_items`, `pr_approvals` |
| Temp Changes | `temporary_changes` (+ linkedWorkItemId) |
| Access | `external_contacts`, `platform_accounts`, `access_groups`, `account_group_memberships`, `access_reviews`, `platform_integrations`, `sync_jobs`, `reconciliation_issues`, `service_owners` |
| Contracts | `contracts` |
| Appraisals | `appraisals` |
| Compliance | `training_records`, `ppe_records`, `policy_acknowledgements` |
| Import | `import_jobs` |
| Automation | `automation_rules`, `automation_rule_logs` |

---

## Development Commands

```bash
# Development
bun run dev              # Start all apps
bun run dev:web          # Web app only (port 5173)
bun run dev:server       # Server only (port 3000)

# Database
bun run db:start         # Start Docker PostgreSQL
bun run db:push          # Push schema changes (dev)
bun run db:generate      # Generate migration SQL
bun run db:migrate       # Apply migrations
bun run db:studio        # Open Drizzle Studio (DB GUI)
bun run db:stop          # Stop Docker PostgreSQL

# Quality
bun run check-types      # TypeScript check all packages
bun run build            # Build all apps
```

---

## Deployment

### Docker Compose (recommended)

The project ships with a production-optimised multi-stage Dockerfile and a `docker-compose.prod.yml` for single-server deployment.

**Image characteristics:**
- Base: `oven/bun:1.3-slim` (Alpine-derived, ~80 MB final image)
- Non-root user (`bun`) — no privilege escalation
- Static web assets compiled at build time and served by the Hono server
- Health check endpoint at `/health`

```bash
# 1. Configure secrets
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD, BETTER_AUTH_SECRET, BETTER_AUTH_URL, CORS_ORIGIN

# 2. Build and start
docker compose -f docker-compose.prod.yml up -d --build

# 3. Push schema on first boot
docker compose -f docker-compose.prod.yml exec app bun run db:push

# 4. (Optional) seed demo data
docker compose -f docker-compose.prod.yml exec app bun run db:seed
```

**Production env vars:**

| Variable | Required | Notes |
|----------|----------|-------|
| `POSTGRES_PASSWORD` | Yes | Strong random password |
| `BETTER_AUTH_SECRET` | Yes | ≥32-char random string (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Yes | Public URL of the API server (e.g. `https://ops.ndma.gov.gh`) |
| `CORS_ORIGIN` | Yes | Exact frontend origin (same as `BETTER_AUTH_URL` in a single-domain deploy) |
| `APP_PORT` | No | Host port to bind (default `3000`) |
| `POSTGRES_DB` | No | Database name (default `dcs_ops`) |

### Reverse Proxy (Nginx/Caddy)

In production, place a reverse proxy in front to:
- Terminate TLS
- Route `/` → app container port 3000
- Set `X-Forwarded-For` for accurate IP audit logging

### CI/CD

GitHub Actions workflow at `.github/workflows/ci.yml` runs type-check and build on every push/PR to `main`.

---

## API

The server exposes two API surfaces:

| Endpoint | Protocol | Purpose |
|----------|----------|---------|
| `/rpc/*` | oRPC | Internal web app (end-to-end type-safe) |
| `/api-reference/*` | REST/OpenAPI | External integrations and tools |
| `/api/auth/*` | Better Auth | Authentication (cookie-based sessions) |

View the full API reference at **http://localhost:3000/api-reference** when running locally.

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Follow the coding standards in `CLAUDE.md`
4. Ensure TypeScript passes: `bun run check-types`
5. Submit a pull request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built for the **National Data Management Authority (NDMA)**
Data Centre Services (DCS) — Digital Transformation Initiative

</div>
