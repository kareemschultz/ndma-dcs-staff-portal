# CLAUDE.md — DCS Ops Center

## Project Overview
Enterprise internal operations platform for NDMA Data Centre Services (DCS).
Modules: Work Management · Incident Management · On-Call Rota · Procurement · Leave · Staff/Compliance · Audit · Access Management.

See `/docs/architecture/` for detailed reference docs.

---

## Monorepo Structure
```
apps/web/          → React + TanStack Router frontend (Vite, port 3001)
apps/server/       → Hono backend (port 3000)
apps/docs/         → Fumadocs documentation (Next.js, port 4000)
packages/api/      → oRPC procedures + context (shared by server)
packages/auth/     → Better Auth config (shared by server + web)
packages/db/       → Drizzle ORM schema + migrations
packages/env/      → Zod env validation (server.ts + web.ts)
packages/ui/       → Shared shadcn/ui components
packages/config/   → Shared tsconfig base
```

## Key Package Names (workspace imports)
- `@ndma-dcs-staff-portal/api` — oRPC routers + procedures
- `@ndma-dcs-staff-portal/auth` — Better Auth instance
- `@ndma-dcs-staff-portal/db` — Drizzle db connection + schema
- `@ndma-dcs-staff-portal/env/server` — server env vars
- `@ndma-dcs-staff-portal/env/web` — web env vars
- `@ndma-dcs-staff-portal/ui` — shared UI components

## Dev Commands
```bash
bun run dev           # Start all apps via Turborepo
bun run dev:web       # Web only (port 5173)
bun run dev:server    # Server only (port 3000)
bun run db:start      # Start PostgreSQL Docker container
bun run db:push       # Push schema changes (dev)
bun run db:generate   # Generate migration files
bun run db:migrate    # Apply migrations
bun run db:studio     # Open Drizzle Studio
bun run check-types   # TypeScript type check all packages
```

## Adding oRPC Procedures
1. Create router file in `packages/api/src/routers/`
2. Import and add to `appRouter` in `packages/api/src/routers/index.ts`
3. Use `protectedProcedure` (auth required) or `publicProcedure`
4. Add `.route()` + `.input()` + `.output()` for OpenAPI spec
5. Client auto-gets types via `AppRouter` type inference

## Adding shadcn/ui Components
```bash
# To apps/web (main app)
cd apps/web && bunx shadcn@latest add <component>
# To packages/ui (shared)
cd packages/ui && bunx shadcn@latest add <component>
```

## Database Schema Pattern
- All schemas in `packages/db/src/schema/`
- Export from `packages/db/src/schema/index.ts`
- Use `pgTable`, Drizzle relations, proper indexes
- Auth tables ALREADY exist in `schema/auth.ts` — do NOT recreate

## Auth Pattern
- Better Auth config: `packages/auth/src/index.ts`
- oRPC context: `packages/api/src/context.ts` (session injected here)
- Use `protectedProcedure` for auth-gated API calls
- Auth Admin plugin adds `role` field to user table
- Client auth: `apps/web/src/lib/auth-client.ts`

---

## Auth Design Rules

### Local Admin Account (MANDATORY)
Even though LDAP / Active Directory will be the primary login method, the system
MUST always support a local email+password admin account. This serves as:
- Emergency fallback if AD is unreachable
- Initial setup account before AD integration is configured
- Break-glass admin access

`emailAndPassword: { enabled: true }` must ALWAYS remain in the Better Auth config.
Do NOT disable it when adding LDAP.

The login page must show BOTH:
1. Email + Password form (always visible)
2. "Sign in with Active Directory" button (LDAP, can be disabled/enabled via feature flag)

---

## ⚠️ KNOWN GOTCHAS — DO NOT REPEAT

### Better-T Stack CLI
- **NEVER** combine `--yes` with explicit stack flags — they are mutually exclusive.
  The `--yes` flag uses defaults ONLY when no other flags are given.
- **Always** specify `--payments none --web-deploy none --server-deploy none --examples none`
  to avoid interactive prompts when running non-interactively.
- The `fumadocs` addon triggers an interactive template prompt that cannot be bypassed
  with flags alone. Add Fumadocs separately using `bunx create-fumadocs-app`.
- Correct reproduce command (from scaffold output):
  ```
  bun create better-t-stack@latest <name> --frontend tanstack-router --backend hono
    --runtime bun --database postgres --orm drizzle --api orpc --auth better-auth
    --payments none --addons turborepo --examples none --db-setup docker
    --web-deploy none --server-deploy none --git --package-manager bun --no-install
  ```

### oRPC
- The scaffold puts oRPC procedures in `packages/api/` (not `apps/server/`).
- `appRouter` must export `AppRouter` type for web client type inference.
- Both `RPCHandler` (/rpc/*) and `OpenAPIHandler` (/api-reference/*) are mounted in server.
- `createContext()` in `packages/api/src/context.ts` injects auth session.

### oRPC `queryOptions` — ALWAYS wrap input in `{ input: { ... } }` (CRITICAL)
- **WRONG:** `orpc.staff.list.queryOptions({ limit: 100, offset: 0 })`
- **CORRECT:** `orpc.staff.list.queryOptions({ input: { limit: 100, offset: 0 } })`
- The flat-args pattern is BOTH a TypeScript error AND a silent runtime bug (input never sent to server).
- Procedures with **no `.input()` call** use `queryOptions()` with no args — do NOT pass an empty object.
  - Examples: `orpc.services.list.queryOptions()`, `orpc.rota.getCurrent.queryOptions()`, `orpc.dashboard.opsReadiness.queryOptions()`, `orpc.leave.types.list.queryOptions()`
- `mutationOptions({ onSuccess, onError })` is unaffected — input goes in `mutation.mutate(input)`.
- `queryClient.invalidateQueries({ queryKey: orpc.X.list.key() })` is correct (no args to `key()`).
- Root cause: `@orpc/tanstack-query` `QueryKeyOptions<TInput>` type requires an `input:` key when `TInput` is not undefined.

### Zod v4 `z.record` — requires two arguments
- **WRONG:** `z.record(z.string())` — TypeScript infers value type as `unknown`
- **CORRECT:** `z.record(z.string(), z.string())` — explicit key + value types

### Better Auth
- Auth config in `packages/auth/src/index.ts`, NOT in apps/server.
- `sameSite: "none"` + `secure: true` on cookies — requires HTTPS in production.
  For local dev, may need to change to `sameSite: "lax"` + `secure: false`.
- When adding the Admin plugin, regenerate DB schema: `bunx @better-auth/cli generate`.

### Base UI — `render` prop, NOT `asChild`
- `packages/ui` uses **`@base-ui/react`** primitives (not Radix UI) for all interactive
  components: DropdownMenu, AlertDialog, Collapsible, Sidebar, etc.
- Base UI uses a `render` prop for element composition. `asChild` does NOT exist.
- **Pattern:** `<DropdownMenuTrigger render={<Button />}>children</DropdownMenuTrigger>`
- **NOT:** `<DropdownMenuTrigger asChild><Button>children</Button></DropdownMenuTrigger>`
- Similarly: `<SidebarMenuButton render={<Link to="/" />}>` not `asChild`.
- Base UI open state attributes: `data-open` / `data-closed` (not `data-[state=open]`).
- Tailwind classes must use `data-open:` / `group-data-[open]/name:` variants accordingly.

### Tailwind CSS
- This project uses **Tailwind CSS v4** (not v3).
- v4 uses CSS-first config (`@import "tailwindcss"` in CSS, no `tailwind.config.ts`).
- shadcn/ui components are configured for Tailwind v4.

### Security Best Practices
- Always validate on the server (oRPC procedures) even when validating on the client.
- Use `protectedProcedure` for every endpoint that touches user/org data.
- Never trust client-supplied role or permission claims — always read from session.
- CORS_ORIGIN must be set to the exact web app origin (port 3001 locally).
- Content Security Policy headers should be added at the Hono server level.
- Audit log every mutation — who did what and when.

### Environment Variables
- Server env: validated via `@ndma-dcs-staff-portal/env/server`
- Web env: validated via `@ndma-dcs-staff-portal/env/web` (only VITE_ prefixed vars)
- NEVER import server env in web app code.

---

## Design System
- **Colors:** Blue (primary), Green (success/available), Amber (warning), Red (danger/on-leave), Indigo (info)
- **Status badges:** Active=Green, On Leave=Red, On Call=Blue, Training=Purple
- **Icons:** Lucide icons ONLY (`lucide-react`)
- **Dark/Light mode:** Supported via `next-themes` + CSS variables
- **Tailwind first:** Use Tailwind utilities for all styling. No custom CSS unless unavoidable.

## Docs Structure
- `/docs/architecture/` — internal developer reference docs
- `/apps/docs/` — user-facing Fumadocs documentation site
- Keep CLAUDE.md concise; detailed references go in `/docs/architecture/`

---

## Database Schema Files (packages/db/src/schema/)

| File | Tables / Enums |
|------|----------------|
| `auth.ts` | user, session, account, verification (Better Auth — DO NOT MODIFY) |
| `audit.ts` | audit_logs (append-only global audit trail) |
| `notifications.ts` | notifications + channel/status enums |
| `departments.ts` | departments |
| `staff.ts` | staff_profiles + employment_type / staff_status enums |
| `rota.ts` | on_call_schedules, on_call_assignments, on_call_swaps, assignment_history + role/status enums |
| `escalation.ts` | escalation_policies, escalation_steps, on_call_overrides |
| `incidents.ts` | services, incidents, incident_affected_services, incident_responders, incident_timeline, post_incident_reviews |
| `work.ts` | work_items, work_item_comments, work_item_weekly_updates + type/status/priority enums |
| `leave.ts` | leave_types, leave_balances, leave_requests + leave_request_status enum |
| `procurement.ts` | purchase_requisitions, pr_line_items, pr_approvals + pr_status / pr_priority enums |
| `temp-changes.ts` | temporary_changes + temp_change_status enum |
| `access.ts` | external_contacts, platform_accounts (staffProfileId nullable), access_groups, account_group_memberships (soft-delete via removedAt), access_reviews, platform_integrations, sync_jobs, reconciliation_issues, service_owners + enums: platform_type (vpn/fortigate/uportal/biometric/ad/ipam/phpipam/radius/zabbix/other), account_status (+orphaned/pending_review), auth_source, sync_mode, sync_direction, integration_status, sync_job_status, reconciliation_issue_type (+disabled_staff_active_account/expired_contractor/missing_internally/missing_externally), user_affiliation, access_review_status, access_group_type |
| `contracts.ts` | contracts + contract_status enum |
| `appraisals.ts` | appraisals + appraisal_status enum |
| `compliance.ts` | training_records, ppe_records, policy_acknowledgements + compliance_item_status enum |
| `imports.ts` | import_jobs + import_job_status / import_type enums |

---

## API Routers (packages/api/src/routers/)

| File | Key Procedures |
|------|----------------|
| `audit.ts` | `audit.list`, `audit.getByResource` |
| `notifications.ts` | `notifications.list`, `markRead`, `markAllRead`, `dismiss` |
| `rota.ts` | getCurrent, getUpcoming, list, create, assign, removeAssignment, publish, getEligibleStaff, getAssignmentCounts, getEffectiveOnCall, swap.{request,review,list}, history |
| `escalation.ts` | policies.{list,get,create,update,delete}, steps.{add,update,delete}, overrides.{list,create,update,delete} |
| `work.ts` | list, get, create, update, assign, addComment, addWeeklyUpdate, getOverdue, getWeeklyReport, stats |
| `incidents.ts` | list, get, create, update, addTimelineEntry, addResponder, removeResponder, linkService, unlinkService, createPIR, getActive, stats |
| `services.ts` | list, get, create, update |
| `leave.ts` | types.{list,create,update}, balances.{getByStaff,adjust}, requests.{list,create,approve,reject,cancel}, getTeamCalendar |
| `procurement.ts` | list, get, create, update, submit, approve, reject, markOrdered, markReceived, getMyRequests, getPendingApprovals, stats |
| `temp-changes.ts` | list, get, create, update, markRemoved, getOverdue, stats |
| `access.ts` | accounts.{list,get,getByStaff,getByPlatform,getExpiring,getOrphaned,getStale,getVpnEnabled,create,update,disable,markReviewed}, externalContacts.{list,get,create,update}, groups.{list,get,create,update,delete,listMembers,addMember,removeMember}, reviews.{list,getPending,getOverdue,create,complete}, integrations.{list,get,create,update,triggerSync}, syncJobs.list, reconciliation.{list,resolve}, serviceOwners.{list,assign,remove,getByService} |
| `staff.ts` | list, get, create, update, deactivate, getDepartments |
| `contracts.ts` | list, get, create, update, getExpiringSoon |
| `appraisals.ts` | list, get, create, update, getOverdue, getByStaff |
| `compliance.ts` | training.{list,create,update,delete}, ppe.{list,create,update,delete}, policyAck.{list,acknowledge}, getExpiringItems |
| `dashboard.ts` | main, opsReadiness, recentActivity |
| `import.ts` | execute, getHistory |

**Shared API utilities:**
- `packages/api/src/lib/audit.ts` — `logAudit(params)` — call from EVERY mutation procedure
- `packages/api/src/lib/notify.ts` — `createNotification(params)` — call when notifying a user
- `packages/api/src/lib/sync/types.ts` — `SyncConnector` / `ExternalAccount` / `SyncResult` interfaces
- `packages/api/src/lib/sync/index.ts` — `runSyncJob(syncJobId)` — processor called after triggerSync
- `packages/api/src/lib/sync/connectors/ipam.ts` — phpIPAM REST connector
- `packages/api/src/lib/sync/connectors/ldap.ts` — AD/LDAP connector (optional `ldapts` peer dep)

**Context (packages/api/src/context.ts):** Provides `session`, `ipAddress`, `userAgent` to all procedures.

---

## RBAC Resources (packages/auth/src/index.ts)

13 resources: `staff`, `work`, `leave`, `rota`, `compliance`, `contract`, `appraisal`, `report`, `audit`, `settings`, `procurement`, `notification`, `access`

---

## Deployment

### Docker (production)

```bash
# Build and start (copy .env.example → .env, fill in secrets first)
docker compose -f docker-compose.prod.yml up -d --build

# Apply DB schema on first run
docker compose -f docker-compose.prod.yml exec app bun run db:push
```

**Key files:**
- `Dockerfile` — multi-stage build (deps → web-builder → server-builder → runner); final image is `oven/bun:1.3-slim` running as non-root `bun` user
- `docker-compose.prod.yml` — PostgreSQL 16-alpine + app container; no external ports on postgres
- Static web assets are built in CI and served directly by the Hono server

**Required env vars (production):**
- `DATABASE_URL` — full PostgreSQL connection string
- `BETTER_AUTH_SECRET` — 32+ char random secret
- `BETTER_AUTH_URL` — the public URL of the server (e.g. `https://ops.ndma.gov.gh`)
- `CORS_ORIGIN` — exact web app origin

### CI/CD

GitHub Actions: `.github/workflows/ci.yml` — type-check + build on every push/PR to `main`.

---

## Audit Logging Rule

**Every mutation procedure MUST call `logAudit()`** with:
- `actorId` + `actorName` from `context.session.user`
- `action` in dot-notation: `"module.resource.verb"` (e.g. `"work_item.create"`, `"rota.schedule.publish"`)
- `module`, `resourceType`, `resourceId`
- `beforeValue` + `afterValue` for updates (omit for creates/deletes)
- `ipAddress` + `userAgent` from context
