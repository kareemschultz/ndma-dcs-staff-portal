# Tech Stack Architecture

## Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
│  React 19 + TanStack Router + TanStack Query + shadcn/ui │
│  Port: 5173 (dev) | Static files (prod)                 │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP (credentials: include)
                     │ /rpc/* (oRPC binary protocol)
                     │ /api/auth/* (Better Auth)
                     │ /api/openapi.json (OpenAPI spec)
┌────────────────────▼────────────────────────────────────┐
│                  Hono Server (Bun runtime)                │
│  Port: 3000                                              │
│  ├── CORS middleware                                     │
│  ├── Logger middleware                                   │
│  ├── Better Auth handler (/api/auth/*)                   │
│  ├── oRPC RPCHandler (/rpc/*)                            │
│  └── oRPC OpenAPIHandler (/api-reference/*)              │
└──────┬────────────────────────────┬──────────────────────┘
       │                            │
┌──────▼──────────┐      ┌──────────▼──────────┐
│  packages/api   │      │   packages/auth      │
│  oRPC procedures│      │   Better Auth config  │
│  + context      │      │   + plugins           │
└──────┬──────────┘      └──────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────┐
│                   packages/db (Drizzle ORM)              │
│  PostgreSQL (Docker for dev, hosted for prod)           │
│  Port: 5432                                              │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                  apps/docs (Fumadocs)                    │
│  Next.js docs site | Port: 4000                         │
│  Content from /apps/docs/content/docs/**/*.mdx           │
└──────────────────────────────────────────────────────────┘
```

## Package Dependency Graph

```
apps/web
  → packages/api (AppRouter type)
  → packages/auth (auth-client)
  → packages/env/web (VITE_ env vars)
  → packages/ui (shared components)

apps/server
  → packages/api (appRouter, createContext)
  → packages/auth (auth instance)
  → packages/env/server (server env vars)

packages/api
  → packages/auth (session from auth.api.getSession)
  → packages/db (Drizzle queries)
  → packages/env/server

packages/auth
  → packages/db (drizzleAdapter)
  → packages/env/server

packages/db
  → packages/env/server (DATABASE_URL)
```

## Data Flow: Authenticated Request

```
1. User performs action in React component
2. React component calls: orpc.staff.list.useQuery({ input })
3. TanStack Query calls RPCLink → fetch('/rpc', { credentials: 'include' })
4. Hono server receives request
5. createContext() calls auth.api.getSession(headers) → session
6. oRPC RPCHandler routes to staff.list procedure
7. requireAuth middleware checks session.user exists
8. Procedure handler runs Drizzle query
9. Response returned as typed JSON
10. TanStack Query caches + React re-renders with data
```

## Authentication Flow

```
Login page → authClient.signIn.email({ email, password })
           → POST /api/auth/sign-in/email
           → Better Auth validates credentials
           → Sets HTTP-only session cookie
           → Returns user object

Subsequent requests:
           → Browser sends cookie automatically (credentials: 'include')
           → auth.api.getSession(headers) extracts + validates session
           → context.session.user available in all oRPC procedures
```

## API Layer Architecture

```
packages/api/src/
├── index.ts           # publicProcedure, protectedProcedure exports
├── context.ts         # createContext() — injects auth session, ipAddress, userAgent
├── lib/
│   ├── audit.ts       # logAudit() helper — called by EVERY mutation
│   ├── notify.ts      # createNotification() helper
│   └── sync/          # Platform account sync framework
│       ├── types.ts   # SyncConnector interface, ExternalAccount, SyncResult
│       ├── index.ts   # runSyncJob() — reconciles external accounts
│       └── connectors/
│           ├── ipam.ts  # phpIPAM REST connector
│           └── ldap.ts  # AD/LDAP connector (optional ldapts peer dep)
└── routers/
    ├── index.ts       # appRouter — combines all sub-routers
    ├── audit.ts       # audit.list, audit.getByResource
    ├── notifications.ts # notifications.list, markRead, markAllRead, dismiss
    ├── staff.ts       # staff.list, get, create, update, deactivate, getDepartments
    ├── work.ts        # work.list, get, create, update, assign, addComment, addWeeklyUpdate, getOverdue, stats
    ├── incidents.ts   # incidents.list, get, create, update, resolve, addTimelineEntry, addResponder, createPIR, getActive, stats
    ├── services.ts    # services.list, get, create, update
    ├── rota.ts        # rota — getCurrent, getUpcoming, list, create, assign, publish, swap.*, history
    ├── leave.ts       # leave.types.*, balances.*, requests.*, getTeamCalendar
    ├── procurement.ts # procurement.list, get, create, update, submit, approve, reject, markOrdered, markReceived, stats
    ├── temp-changes.ts # tempChanges.list, get, create, update, markRemoved, getOverdue, stats
    ├── access.ts      # access.accounts.*, integrations.*, syncJobs.*, reconciliation.*
    ├── contracts.ts   # contracts.list, get, create, update, getExpiringSoon
    ├── appraisals.ts  # appraisals.list, get, create, update, getOverdue, getByStaff
    ├── compliance.ts  # compliance.training.*, ppe.*, policyAck.*, getExpiringItems
    ├── dashboard.ts   # dashboard.main, opsReadiness, recentActivity
    └── import.ts      # import.execute, import.getHistory
```

## Database Schema (16 files in packages/db/src/schema/)

```
auth.ts          → user, session, account, verification  (Better Auth — DO NOT MODIFY)
audit.ts         → audit_logs (append-only)
notifications.ts → notifications
departments.ts   → departments
staff.ts         → staff_profiles + employment_type / staff_status enums
rota.ts          → on_call_schedules, on_call_assignments, on_call_swaps, assignment_history
escalation.ts    → escalation_policies, escalation_steps, on_call_overrides
incidents.ts     → services, incidents, incident_affected_services, incident_responders, incident_timeline, post_incident_reviews
work.ts          → work_items, work_item_comments, work_item_weekly_updates
leave.ts         → leave_types, leave_balances, leave_requests
procurement.ts   → purchase_requisitions, pr_line_items, pr_approvals
temp-changes.ts  → temporary_changes
access.ts        → external_contacts, platform_accounts (staffProfileId nullable), access_groups,
                    account_group_memberships (soft-delete via removedAt), access_reviews,
                    platform_integrations, sync_jobs, reconciliation_issues, service_owners
contracts.ts     → contracts
appraisals.ts    → appraisals
compliance.ts    → training_records, ppe_records, policy_acknowledgements
imports.ts       → import_jobs
```

## Known Gotchas

### oRPC queryOptions — ALWAYS wrap input in { input: { ... } }
```typescript
// WRONG — silent runtime bug + TypeScript error
orpc.staff.list.queryOptions({ limit: 100, offset: 0 })

// CORRECT
orpc.staff.list.queryOptions({ input: { limit: 100, offset: 0 } })

// Procedures with no .input() call — use NO args
orpc.dashboard.opsReadiness.queryOptions()

// key() also needs input wrapper
orpc.work.get.key({ input: { id: workItemId } })

// invalidateQueries key — no args
queryClient.invalidateQueries({ queryKey: orpc.work.list.key() })
```

### Zod .default() + react-hook-form zodResolver
```typescript
// WRONG — .default() makes input type optional → type mismatch with API
type: z.enum(["routine", "project"]).default("routine")

// CORRECT — keep enum strict, set default in useForm
type: z.enum(["routine", "project"])
// ...in useForm:
defaultValues: { type: "routine" }
```

### Base UI — render prop, NOT asChild
```tsx
// WRONG
<DropdownMenuTrigger asChild><Button /></DropdownMenuTrigger>

// CORRECT (Base UI pattern)
<DropdownMenuTrigger render={<Button />}>children</DropdownMenuTrigger>
```
