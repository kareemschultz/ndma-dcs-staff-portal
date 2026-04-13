# Changelog

All notable changes to DCS Ops Center are documented here.

---

## [Unreleased]

### Added

#### Phase H — Access & Accounts v2 (2026-04-12)
- **Multi-source authentication tracking** — accounts now carry an `authSource` field distinguishing Local, AD/LDAP, RADIUS, SAML, OAuth/OIDC, Service Account, and API-only origins
- **Sync mode support** — accounts are classified as `manual`, `synced`, or `hybrid` so synced records can receive local annotations without being overwritten on the next sync
- **Platform integrations table** — connector metadata with `hasApi`, `syncEnabled`, `syncDirection`, `syncFrequencyMinutes`, `authoritativeSource`, `manualFallbackAllowed`, `apiBaseUrl`, `config` (JSONB), and live status
- **Sync jobs table** — per-run audit trail: records processed/created/updated/skipped, JSONB error log, timestamps
- **Reconciliation issues table** — orphaned accounts, unmatched externals, and policy violations flagged during sync with resolution workflow
- **New `ipam` and `radius` platform types** added to `platform_type` enum
- **Expanded `platform_accounts`** — added `displayName`, `authSource`, `privilegeLevel`, `syncMode`, `externalAccountId`, `syncSourceSystem`, `lastSyncedAt`, `lastVerifiedAt`, `createdByUserId`
- **`access.integrations.*` API** — list/get/create/update/triggerSync
- **`access.syncJobs.list` API** — paginated sync job history
- **`access.reconciliation.*` API** — list open issues + resolve
- **`access.accounts.getOrphaned` API** — accounts with no matching active staff profile
- **Access frontend v2** — 3-tab UI (Accounts · Integrations · Reconciliation) with auth-source color badges, sync-mode badges, "Sync now" button, issue resolver

#### All Module Pages — Complete (2026-04-12)
30+ route files implemented — every stub replaced with real UI:
- Work Register + new item form + detail page
- Incidents + new incident form + detail page with timeline
- Staff Directory + staff profile page (tabs)
- Leave Management (All/Pending) + new leave request form
- Procurement pipeline + new PR form with line items
- On-Call Rota (current week + upcoming + pending swaps)
- Temporary Changes + new change form
- Platform Accounts (3-tab: accounts/integrations/reconciliation)
- Contracts, Appraisals, Compliance Training/PPE/Items
- Ops Readiness traffic-light dashboard
- Reports and Import placeholders
- Settings: General, Departments, Leave Types, Escalation, Roles
- Audit Log with expandable JSON diff rows
- Notifications with mark-read / dismiss

#### Phases A–C Infrastructure (prior session)
- **Phase A:** `audit_logs` + `notifications` tables, `logAudit()` / `createNotification()` helpers, audit + notifications routers, rota mutations retrofitted with audit calls
- **Phase B:** `work_items`, `work_item_comments`, `work_item_weekly_updates`; full work router (list/get/create/update/assign/addComment/addWeeklyUpdate/getOverdue/stats)
- **Phase C:** `services`, `incidents`, responders, timeline, PIR; incidents + services routers

### Fixed
- **oRPC `queryOptions` flat-args bug** — all 21+ frontend files corrected to use `{ input: { ... } }` wrapper; flat args were a silent runtime bug where input was never sent to server
- **`work.get.key()` wrapper** — `orpc.work.get.key({ id })` corrected to `orpc.work.get.key({ input: { id } })`
- **`z.coerce.number()` zod v4** — replaced with `z.number()` + `{ valueAsNumber: true }` in RHF register calls; `coerce` option returns `unknown` in zod v4
- **`z.enum().default()` + zodResolver** — removed `.default()` from all form schemas; moved defaults to `useForm({ defaultValues })`; `.default()` makes the zod input type optional (`T | undefined`) causing type mismatch with API mutations
- **`DiffViewer` unknown type** — `before`/`after` fields made optional; `!= null` checks replace truthiness checks
- **`profile.user.role` TypeScript error** — Better Auth Admin plugin adds `role` to DB but not TS types; cast via `(user as Record<string, unknown>)?.role as string`
- **`leave.requests.getMyRequests`** — procedure did not exist; removed call, simplified "mine" tab to use `list` with status filter
- **PostgreSQL scram-sha-256 from host** — Docker container requires `ALTER USER postgres WITH PASSWORD 'password'` after init for non-localhost connections

### Changed
- **Access & Accounts schema** — expanded from basic account tracking to full hybrid sync architecture (non-breaking; new columns are nullable)
- **Sidebar navigation** — updated to include all new routes across Operations, People, Services, Compliance, and System groups

---

## [0.1.0] — 2026-04-10 (initial commits)

### Added
- Turborepo monorepo scaffold (Bun, React 19, Hono, Drizzle, oRPC, Better Auth)
- 34 shadcn/ui components in `packages/ui` (Base UI `render` prop pattern)
- shadcn-admin layout: sidebar, nav, command palette, theme switch
- Better Auth with 5-role RBAC (readOnly, staff, manager, hrAdminOps, admin) + 13 resources
- DB: `departments`, `staff_profiles`, `rota` (4 tables), auth tables
- Full rota oRPC router (14 endpoints)
- Seed: 11 real DCS staff, 4 departments, demo on-call schedule
