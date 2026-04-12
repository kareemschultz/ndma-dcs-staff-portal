# Implementation Sources

This document records the official documentation sources consulted for each technology in the stack.
Always validate implementation against these sources — do NOT rely on AI memory.

---

## Scaffolding

| Source | URL | Notes |
|--------|-----|-------|
| Better-T Stack CLI | https://www.better-t-stack.dev/docs/cli | v3.27.0 used |
| Better-T Stack GitHub | https://github.com/AmanVarshney01/create-better-t-stack | CLI flags reference |

**Gotcha:** `--yes` cannot be combined with explicit stack flags. Specify all options individually.
**Fumadocs addon** triggers interactive prompt — must be added separately via `bunx create-fumadocs-app`.

---

## Frontend

| Technology | Official Docs | Notes |
|-----------|---------------|-------|
| React 19 | https://react.dev | Concurrent features, use() hook |
| TanStack Router | https://tanstack.com/router/latest | File-based routing, auth guards via `_authenticated.tsx` |
| TanStack Query v5 | https://tanstack.com/query/latest | `queryOptions`, `mutationOptions` pattern |
| TanStack Table v8 | https://tanstack.com/table/latest | Column defs, sorting, filtering |
| Tailwind CSS v4 | https://tailwindcss.com/docs | CSS-first config, no tailwind.config.ts |
| shadcn/ui | https://ui.shadcn.com | CLI: `bunx shadcn@latest add <component>` |
| shadcn-admin | https://github.com/satnaing/shadcn-admin | Layout system to port |
| Lucide Icons | https://lucide.dev | Icon library |
| Recharts | https://recharts.org | Charts for dashboard |
| React Hook Form | https://react-hook-form.com | With Zod resolver |
| date-fns | https://date-fns.org | Date utilities |
| Sonner | https://sonner.emilkowal.ski | Toast notifications |

---

## Backend

| Technology | Official Docs | Notes |
|-----------|---------------|-------|
| Hono | https://hono.dev | Runtime-agnostic; use `hono/bun` for Bun-specific |
| oRPC | https://orpc.dev | RPC + OpenAPI generation |
| oRPC + Hono | https://orpc.dev/docs/server/adapters/fetch | RPCHandler + OpenAPIHandler pattern |
| oRPC + TanStack Query | https://orpc.dev/docs/client/tanstack-query | `createTanstackQueryUtils` |
| OpenAPI Handler | https://orpc.dev/docs/openapi | OpenAPIReferencePlugin |
| Bun HTTP server | https://bun.sh/docs/api/http | Native Bun.serve() if needed |

---

## Authentication

| Technology | Official Docs | Notes |
|-----------|---------------|-------|
| Better Auth | https://www.better-auth.com/docs | Core auth config |
| Better Auth + Hono | https://www.better-auth.com/docs/integrations/hono | auth.handler(c.req.raw) pattern |
| Better Auth + Drizzle | https://www.better-auth.com/docs/adapters/drizzle | drizzleAdapter(db, { provider: "pg" }) |
| Better Auth Admin Plugin | https://www.better-auth.com/docs/plugins/admin | RBAC roles + permissions |
| Better Auth CLI | https://www.better-auth.com/docs/concepts/cli | bunx @better-auth/cli generate |
| LDAP Community Plugin | https://github.com/erickweil/better-auth-credentials-plugin | Community plugin, not official |

---

## Database

| Technology | Official Docs | Notes |
|-----------|---------------|-------|
| Drizzle ORM | https://orm.drizzle.team | Schema definition, relations |
| Drizzle + PostgreSQL | https://orm.drizzle.team/docs/get-started/postgresql-new | pg driver setup |
| Drizzle + Bun | https://orm.drizzle.team/docs/connect-bun-sql | Native bun-sql driver |
| Drizzle Kit | https://orm.drizzle.team/docs/kit-overview | Migrations, push, studio |
| drizzle.config.ts | https://orm.drizzle.team/docs/drizzle-config-file | Config file reference |

---

## Monorepo

| Technology | Official Docs | Notes |
|-----------|---------------|-------|
| Turborepo | https://turborepo.dev/docs | Task orchestration |
| Turborepo + Bun | https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository | Beta Bun support |
| Bun Workspaces | https://bun.sh/docs/install/workspaces | workspace:* protocol |

---

## Documentation

| Technology | Official Docs | Notes |
|-----------|---------------|-------|
| Fumadocs | https://www.fumadocs.dev | Next.js docs framework |
| Fumadocs MDX | https://www.fumadocs.dev/docs/mdx | MDX content source |
| Fumadocs OpenAPI | https://www.fumadocs.dev/docs/ui/openapi | Auto API docs from spec |
| create-fumadocs-app | https://www.fumadocs.dev/docs/getting-started | Scaffold command |
