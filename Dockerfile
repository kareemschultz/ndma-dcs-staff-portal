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

# Bun runs TypeScript directly — no compile step needed for the server.

# ── Stage 4: Production runtime ──────────────────────────────────────────────
# Distroless-style minimal image using bun:slim and hardened below.
FROM oven/bun:1.3-slim AS runner

WORKDIR /app

# Copy package manifests for a clean production-only install
COPY --from=server-builder /app/package.json ./package.json
COPY --from=server-builder /app/bun.lock ./bun.lock
COPY --from=server-builder /app/turbo.json ./turbo.json
COPY --from=server-builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=server-builder /app/packages/api/package.json ./packages/api/package.json
COPY --from=server-builder /app/packages/auth/package.json ./packages/auth/package.json
COPY --from=server-builder /app/packages/db/package.json ./packages/db/package.json
COPY --from=server-builder /app/packages/env/package.json ./packages/env/package.json
COPY --from=server-builder /app/packages/config/package.json ./packages/config/package.json

# Install only production dependencies — strips dev tooling from final image
RUN bun install --frozen-lockfile --production

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
