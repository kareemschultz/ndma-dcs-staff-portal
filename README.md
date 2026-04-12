<div align="center">

<img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield-check.svg" alt="DCS Staff Portal" width="80" height="80" />

# DCS Staff Portal

### Staff, Operations, On-Call & Compliance Management System

*Replacing spreadsheets and WhatsApp coordination with a production-grade enterprise platform.*

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

## What is DCS Staff Portal?

The DCS Staff Portal is a **production-ready enterprise internal web application** that combines:

> 👉 **PagerDuty** (on-call scheduling) + **HRMS** (HR management) + **Admin Dashboard** + **API Platform**

Built for the National Disaster Management Agency (NDMA) Department of Civil Service, it replaces manual spreadsheets, WhatsApp coordination, and paper-based HR tracking with a centralized, auditable, and role-aware system.

---

## Features

<table>
<tr>
<td width="50%">

**👥 Staff Management**
- Staff directory (card + table views)
- Rich profile tabs: Leave, On-Call, Compliance, Contracts, Appraisals
- Department hierarchy
- Import/export via CSV

**📅 Leave Management**
- Multi-step leave request wizard
- Manager approval workflows
- Team leave calendar
- Balance tracking per type

**🕒 On-Call Rota**
- Weekly schedule + monthly calendar views
- Auto-rotation engine with constraint satisfaction
- Conflict detection (leave, training, double-booking)
- Shift swap system with approval
- Escalation chain management

**🛒 Purchase Requisitions**
- PR creation wizard with line items
- Multi-level approval workflows (Manager → Dept Head → Finance)
- Supplier directory management
- Budget tracking + spend analytics
- PDF export of approved PRs

</td>
<td width="50%">

**🛡️ Compliance Tracking**
- Training records with expiry alerting
- PPE issue/return tracking
- Policy acknowledgment management
- Assignment blocking for non-compliant staff

**📑 Contracts & Appraisals**
- Contract lifecycle (1-year cycles)
- Renewal alerts (90/60/30 days)
- Appraisal scheduling (6-month cycles)
- Performance rating with history

**📊 Analytics Dashboard**
- KPI cards with live data
- Charts: staff distribution, leave trends, on-call load, spend
- Activity feed

**🔐 Security & Audit**
- Role-based access control (5 roles)
- LDAP / Active Directory integration
- Full audit log with JSON diff viewer
- IP + user agent tracking

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
│   │       ├── features/       # Feature modules (staff, leave, rota, procurement...)
│   │       ├── routes/         # TanStack Router file-based routes
│   │       └── utils/          # oRPC client + QueryClient
│   ├── server/                 # Hono backend (port 3000)
│   └── docs/                   # Fumadocs documentation (port 4000)
├── packages/
│   ├── api/                    # oRPC procedures + context (shared)
│   ├── auth/                   # Better Auth config (shared)
│   ├── db/                     # Drizzle schema + migrations
│   ├── env/                    # Type-safe env validation
│   ├── ui/                     # Shared shadcn/ui components
│   └── config/                 # Shared TypeScript config
├── docs/                       # Developer reference (ADRs, architecture)
├── docker-compose.yml          # PostgreSQL container
├── turbo.json                  # Turborepo task config
└── CLAUDE.md                   # AI assistant context + gotchas
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

### 4. Start Development

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
| **Admin** | Full system access |
| **Manager** | Staff management, leave approvals, rota management, appraisals |
| **HR/Admin Ops** | Staff CRUD, all leave/rota/compliance, PR management |
| **Staff** | Own profile, submit leave/PRs, view rota |
| **Read Only** | View-only access to all modules |

---

## Architecture

```mermaid
graph TB
    A[Browser - React SPA] -->|/rpc/* oRPC| B[Hono Server - Bun]
    A -->|/api/auth/* cookie| B
    B --> C[packages/api - oRPC Procedures]
    B --> D[packages/auth - Better Auth]
    C --> E[packages/db - Drizzle ORM]
    D --> E
    E --> F[(PostgreSQL)]
    G[apps/docs - Fumadocs] -.->|reads| H[content/docs/*.mdx]
    B -->|/api/openapi.json| I[External Integrations]
```

---

## Development Commands

```bash
# Development
bun run dev              # Start all apps
bun run dev:web          # Web app only
bun run dev:server       # Server only

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
| `/rpc/*` | oRPC binary | Internal web app (type-safe) |
| `/api-reference/*` | REST/OpenAPI | External integrations |
| `/api/auth/*` | Better Auth | Authentication |

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

Built with ❤️ for the **National Disaster Management Agency (NDMA)**
Department of Civil Service — Digital Transformation Initiative

</div>
