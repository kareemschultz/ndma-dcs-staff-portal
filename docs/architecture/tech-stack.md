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
├── context.ts         # createContext() — injects auth session
└── routers/
    ├── index.ts       # appRouter — combines all sub-routers
    ├── staff.ts       # Staff CRUD procedures
    ├── leave.ts       # Leave management
    ├── rota.ts        # On-call scheduling
    ├── procurement.ts # Purchase requisitions
    ├── compliance.ts  # Training/PPE/compliance
    ├── contracts.ts   # Contract management
    ├── appraisals.ts  # Performance appraisals
    ├── reports.ts     # Analytics/reporting
    ├── audit.ts       # Audit log queries
    ├── notifications.ts # Notification management
    ├── admin.ts       # System administration
    └── onboarding.ts  # First-run wizard
```
