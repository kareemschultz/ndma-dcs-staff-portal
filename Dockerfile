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

# Install all workspace dependencies
RUN bun install --frozen-lockfile

# ── Stage 2: Build web app (static assets) ───────────────────────────────────
FROM deps AS web-builder

# Copy full source
COPY . .

# Build the Vite frontend — outputs to apps/web/dist
RUN bun run --cwd apps/web build

# ── Stage 3: Build server ─────────────────────────────────────────────────────
FROM deps AS server-builder

COPY . .

# Bun can run the server directly (no compile step needed for ESM/TS with Bun)
# We just need a production bundle if desired; for simplicity, we run via bun directly.
# This stage exists for any future transpilation steps.

# ── Stage 4: Production runtime ──────────────────────────────────────────────
# Distroless-style minimal image: oven/bun:distroless is not available yet,
# so we use bun:slim and harden it below.
FROM oven/bun:1.3-slim AS runner

WORKDIR /app

# Security: drop to non-root user (bun image includes 'bun' user)
USER bun

# Only copy what the server needs at runtime
# 1. Server source (runs via bun directly — no transpile step needed)
COPY --chown=bun:bun --from=server-builder /app/packages /app/packages
COPY --chown=bun:bun --from=server-builder /app/apps/server /app/apps/server
COPY --chown=bun:bun --from=server-builder /app/node_modules /app/node_modules
COPY --chown=bun:bun --from=server-builder /app/package.json /app/package.json
COPY --chown=bun:bun --from=server-builder /app/turbo.json /app/turbo.json

# 2. Web static build — served by the Hono server's static middleware
COPY --chown=bun:bun --from=web-builder /app/apps/web/dist /app/apps/web/dist

# Server listens on 3000; expose it
EXPOSE 3000

# Runtime environment (overridden via docker-compose / k8s env)
ENV NODE_ENV=production \
    PORT=3000

# Health check — /health is mounted on the Hono server
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "run", "--cwd", "apps/server", "src/index.ts"]
