# ADR-002: API Layer — oRPC over tRPC

**Date:** 2026-04-12
**Status:** Accepted

## Context

We need a type-safe API layer that supports:
- End-to-end TypeScript type safety
- OpenAPI spec generation (for external integrations and API docs)
- Hono integration
- TanStack Query integration

## Decision

Use **oRPC** (not tRPC).

## Rationale

| Feature | oRPC | tRPC |
|---------|------|------|
| OpenAPI spec generation | Native, built-in | Requires third-party |
| Hono adapter | Official | Third-party |
| Typed errors | Yes (`.errors()`) | Limited |
| TanStack Query | React + Vue + Solid | React only |
| External REST access | Via OpenAPIHandler | Not native |

oRPC gives us both internal RPC (for the web app) and external REST endpoints (for Python scripts, mobile, integrations) from the same router definition.

## Router-first vs Contract-first

We use **router-first** approach (not contract-first with `@orpc/contract`) because:
- This app has a single frontend consumer
- Contract-first requires an extra `packages/api-contract` package with more boilerplate
- Type inference from the router is sufficient for our use case
- OpenAPI generation works the same with both approaches

## Key Patterns

```typescript
// Use .route() + .input() + .output() for OpenAPI compliance
export const staffRouter = {
  list: protectedProcedure
    .route({ method: 'GET', path: '/staff' })
    .input(StaffListInputSchema)
    .output(StaffListOutputSchema)
    .handler(async ({ input, context }) => { ... }),
}
```

## Consequences

- All API endpoints are defined in `packages/api/src/routers/`
- The `AppRouter` type is exported and imported by `apps/web` for client type inference
- OpenAPI spec is available at `/api/openapi.json`
- External consumers can use REST via `/api-reference/*` (OpenAPIHandler)
- Internal web app uses `/rpc/*` (RPCHandler) — binary protocol, more efficient
