<div align="center">

<img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield-check.svg" alt="DCS Ops Center" width="80" height="80" />

# DCS Ops Center

### Work · Incidents · On-Call · Leave · Procurement · Compliance · Access · Audit

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

[**Documentation**](https://github.com/kareemschultz/ndma-dcs-staff-portal) · [**Report Bug**](https://github.com/kareemschultz/ndma-dcs-staff-portal/issues) · [**Request Feature**](https://github.com/kareemschultz/ndma-dcs-staff-portal/issues)

</div>

---

## What is DCS Ops Center?

**DCS Ops Center** is a **production-ready enterprise operations platform** built for the **Data Centre Services (DCS)** division of the **National Data Management Authority (NDMA)**.

It replaces manual spreadsheets, WhatsApp coordination chains, and paper-based tracking with a centralized, role-aware, fully auditable system covering every DCS operational workflow:

> **Work Management** · **Incident Command** · **PagerDuty-style On-Call** · **Leave & Availability** · **Purchase Requisitions** · **Compliance** · **Platform Access Control** · **Audit & Governance**

Every action in the system is captured in an append-only audit log — who did what, when, from where — making the platform suitable for cybersecurity compliance reviews and governance reporting.

---

## Features

<table>
<tr>
<td width="50%">

**📋 Work Management**
- Centralized work register replacing spreadsheet-based tracking
- Four work types: Routine, Project, External Request, Ad-hoc
- Weekly progress updates per item (statusSummary, blockers, nextSteps)
- Overdue alerts, per-assignee workload view, stats dashboard
- Comments thread per work item

**🚨 Incident Management**
- Declare and track operational incidents (Sev1–Sev4)
- Timeline of events, status changes, escalation notes
- Incident responder assignment with roles (Commander, Comms, Technical, Observer)
- Post-Incident Review (PIR) with action items and lessons learned
- Affected service linkage; MTTR analytics

**🕒 On-Call Rota**
- Weekly schedule planner with 4 on-call roles (Lead, ASN, CORE, ENT)
- Conflict detection (leave overlap, double-booking)
- Shift swap system with manager approval workflow
- Escalation policy editor with timed steps per service or department
- Override management for ad-hoc assignment changes

**🛒 Purchase Requisitions**
- PR creation with itemised line items (description, quantity, unit cost)
- Full pipeline: Draft → Submit → Approve → Order → Receive
- Multi-level approval history with notes
- Pending approvals queue for managers
- Department-scoped spend tracking

</td>
<td width="50%">

**👥 Staff & People**
- Staff directory with full profile view (overview, contracts, training, PPE, on-call, leave tabs)
- Employment type, status, and department tracking
- Contract lifecycle tracking with configurable renewal reminders
- Appraisal scheduling and performance ratings
- Leave requests, leave balances, team availability calendar

**🔌 Platform Access & Accounts**
- Account registry across all managed platforms (VPN, Fortigate, IPAM, RADIUS, AD, uPortal, biometric)
- Multi-source auth tracking: Local · AD/LDAP · RADIUS · SAML · OAuth/OIDC · Service Accounts · API-only
- Three sync modes: Manual (staff-entered), Synced (connector-owned), Hybrid (synced + local annotations)
- Platform integration connectors with live status, sync frequency, and "Sync now" triggers
- Sync job history with record counts and error logs
- Reconciliation engine: detect orphaned accounts, unmatched externals, policy violations
- Access review workflow for periodic cybersecurity audits

**🛡️ Compliance**
- Training records with provider, completion date, expiry, and certificate URL
- PPE issuance and expiry tracking per staff member
- Policy acknowledgement log with version control
- Cross-cutting compliance overview: all expiring items in one view

**🔧 Temporary Technical Changes**
- Track all temporary infrastructure changes with remove-by dates
- Overdue change alerts with rollback plan documentation
- Service linkage for impact assessment

**🔐 Audit & Governance**
- Global append-only audit log for every mutation
- IP address + user agent captured for forensics
- JSON before/after diff for every state change
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
ndma-dcs-staff-portal/
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
│   │       ├── routers/        # 15 domain routers + index
│   │       └── lib/            # logAudit() + createNotification() helpers
│   ├── auth/                   # Better Auth config (shared by server + web)
│   ├── db/                     # Drizzle schema + migrations
│   │   └── src/schema/         # 16 schema files, one per domain
│   ├── env/                    # Type-safe env validation
│   ├── ui/                     # Shared shadcn/ui components
│   └── config/                 # Shared TypeScript config
├── docs/                       # Developer reference (architecture, ADRs)
├── CHANGELOG.md                # Release history
├── docker-compose.yml          # PostgreSQL container
├── turbo.json                  # Turborepo task config
└── CLAUDE.md                   # AI assistant context + critical gotchas
```

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- [Docker](https://docker.com) (for PostgreSQL)

### 1. Clone & Install

```bash
git clone https://github.com/kareemschultz/ndma-dcs-staff-portal.git
cd ndma-dcs-staff-portal
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

All role checks are enforced server-side via oRPC `protectedProcedure` — client role claims are never trusted.

---

## Architecture

```mermaid
graph TB
    A[Browser — React SPA] -->|/rpc/* oRPC| B[Hono Server — Bun]
    A -->|/api/auth/* cookie| B
    B --> C[packages/api — oRPC Procedures]
    B --> D[packages/auth — Better Auth]
    C --> E[packages/db — Drizzle ORM]
    D --> E
    E --> F[(PostgreSQL 16)]
    C --> G[Audit Log — every mutation]
    C --> H[Notification Engine]
    I[apps/docs — Fumadocs] -.->|reads| J[content/docs/*.mdx]
    B -->|/api/openapi.json| K[External Integrations / IPAM / AD Sync]
```

---

## Database Schema Overview

| Module | Tables |
|--------|--------|
| Auth | `user`, `session`, `account`, `verification` (Better Auth managed) |
| Audit | `audit_logs` (append-only, all mutations) |
| Notifications | `notifications` |
| Org | `departments`, `staff_profiles` |
| On-Call | `on_call_schedules`, `on_call_assignments`, `on_call_swaps`, `assignment_history` |
| Escalation | `escalation_policies`, `escalation_steps`, `on_call_overrides` |
| Incidents | `services`, `incidents`, `incident_affected_services`, `incident_responders`, `incident_timeline`, `post_incident_reviews` |
| Work | `work_items`, `work_item_comments`, `work_item_weekly_updates` |
| Leave | `leave_types`, `leave_balances`, `leave_requests` |
| Procurement | `purchase_requisitions`, `pr_line_items`, `pr_approvals` |
| Temp Changes | `temporary_changes` |
| Access | `platform_accounts`, `service_owners`, `platform_integrations`, `sync_jobs`, `reconciliation_issues` |
| Contracts | `contracts` |
| Appraisals | `appraisals` |
| Compliance | `training_records`, `ppe_records`, `policy_acknowledgements` |

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
