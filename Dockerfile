# ── Stage 1: Install dependencies ────────────────────────────────────────────
# Use Bun's slim image to keep layers small
FROM oven/bun:1.3-slim AS deps

WORKDIR /app

# Copy only manifests first for better layer caching
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/api/package.json packages/api/
COPY packages/auth/package.json packages/auth/
COPY packages/db/package.json packages/db/
COPY packages/env/package.json packages/env/
COPY packages/ui/package.json packages/ui/
COPY packages/config/package.json packages/config/
# turbo.json required for workspace graph
COPY turbo.json ./

# Install all workspace dependencies (dev + prod — needed for build steps)
RUN bun install

# ── Stage 2: Build web app (static assets) ───────────────────────────────────
FROM deps AS web-builder

# Copy full source
COPY . .

# Build the Vite frontend — outputs to apps/web/dist.
# VITE_SERVER_URL must be empty in production so the browser uses relative
# URLs (/rpc, /api/auth) against the current origin. The .env file contains
# the dev default (localhost:3000) which we override here via env var.
RUN VITE_SERVER_URL= bun run --cwd apps/web build

# ── Stage 3: Build server ─────────────────────────────────────────────────────
FROM deps AS server-builder

COPY . .

# Bun runs TypeScript directly — no compile step needed for the server.

# ── Stage 4: Production runtime ──────────────────────────────────────────────
# Distroless-style minimal image using bun:slim and hardened below.
FROM oven/bun:1.3-slim AS runner

WORKDIR /app

# Copy installed node_modules from builder (avoids re-running bun install with a
# potentially mismatched lockfile version between CI bun and builder bun).
COPY --from=server-builder /app/node_modules ./node_modules
COPY --from=server-builder /app/package.json ./package.json
COPY --from=server-builder /app/turbo.json ./turbo.json
COPY --from=server-builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=server-builder /app/packages/api/package.json ./packages/api/package.json
COPY --from=server-builder /app/packages/auth/package.json ./packages/auth/package.json
COPY --from=server-builder /app/packages/db/package.json ./packages/db/package.json
COPY --from=server-builder /app/packages/env/package.json ./packages/env/package.json
COPY --from=server-builder /app/packages/config/package.json ./packages/config/package.json

# 1. Server source (Bun runs TypeScript directly — no transpile step)
COPY --chown=bun:bun --from=server-builder /app/packages ./packages
COPY --chown=bun:bun --from=server-builder /app/apps/server ./apps/server

# 2. Web static build — served by Hono's serveStatic middleware
COPY --chown=bun:bun --from=web-builder /app/apps/web/dist ./apps/web/dist

# Security: drop to non-root user (bun image includes 'bun' user)
USER bun

# Server listens on 3000; expose it
EXPOSE 3000

# Runtime environment (overridden via docker-compose / k8s env)
ENV NODE_ENV=production \
    PORT=3000

# Health check — GET /health returns { status: "ok" }
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "run", "--cwd", "apps/server", "src/index.ts"]

# ── Stage 5: Build docs (Fumadocs / Next.js static export) ───────────────────
# Uses bun with the workspace lockfile so versions exactly match dev.
# output: "export" generates plain HTML/CSS/JS — no Node server needed.
FROM oven/bun:1.3-slim AS docs-builder

WORKDIR /app

# Install workspace deps using the bun.lock so versions are pinned
COPY package.json bun.lock turbo.json ./
COPY apps/docs/package.json apps/docs/
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/api/package.json packages/api/
COPY packages/auth/package.json packages/auth/
COPY packages/db/package.json packages/db/
COPY packages/env/package.json packages/env/
COPY packages/ui/package.json packages/ui/
COPY packages/config/package.json packages/config/

RUN bun install --frozen-lockfile

COPY apps/docs ./apps/docs

ENV NEXT_TELEMETRY_DISABLED=1

# fumadocs-mdx resolves content/docs relative to process.cwd(),
# so WORKDIR must be the docs app root when next build runs.
WORKDIR /app/apps/docs

RUN bun run build

# ── Stage 6: Docs production runtime (Next.js standalone) ────────────────────
# output: "standalone" bundles a self-contained Node server in .next/standalone.
# No nginx needed — just node server.js.
FROM node:20-alpine AS docs-runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

# Standalone output includes a minimal node_modules and server.js
COPY --from=docs-builder /app/apps/docs/.next/standalone ./
# Static assets (chunks, images, etc.) must be copied separately
COPY --from=docs-builder /app/apps/docs/.next/static ./.next/static

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000',r=>process.exit(r.statusCode<400?0:1)).on('error',()=>process.exit(1))"

# In a Bun monorepo, Next.js standalone mirrors the workspace path:
# .next/standalone/apps/docs/server.js (not /server.js at root)
CMD ["node", "apps/docs/server.js"]
