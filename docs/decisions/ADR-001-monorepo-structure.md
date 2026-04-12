# ADR-001: Monorepo Structure

**Date:** 2026-04-12
**Status:** Accepted

## Context

We need to organize a full-stack application with: React frontend, Hono backend, shared auth, shared database schema, shared UI components, and a documentation site.

## Decision

Use Turborepo monorepo with the following structure, scaffolded via Better-T Stack:

- `apps/web` — Frontend (React + TanStack Router)
- `apps/server` — Backend entry point (Hono)
- `apps/docs` — Documentation site (Fumadocs/Next.js)
- `packages/api` — oRPC procedures and router (shared logic, imported by apps/server)
- `packages/auth` — Better Auth config (imported by both apps/server and apps/web client)
- `packages/db` — Drizzle schema + database connection
- `packages/env` — Type-safe environment variable validation
- `packages/ui` — Shared shadcn/ui components
- `packages/config` — Shared TypeScript config

## Rationale

- **packages/api** separate from apps/server allows the router type to be imported by the web app for end-to-end type safety without a build step
- **packages/auth** shared across apps means auth config is single-source-of-truth
- **packages/db** shared means both api procedures and seed scripts use same schema
- **Turborepo** handles build caching and task orchestration across all apps/packages

## Consequences

- All cross-package imports use workspace protocol: `@ndma-dcs-staff-portal/api`, etc.
- Adding a new procedure means editing `packages/api/src/routers/`, NOT `apps/server/`
- The server entry point (`apps/server/src/index.ts`) is thin — just Hono setup + handler mounting
