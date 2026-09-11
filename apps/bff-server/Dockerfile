# FinSage BFF Server — Multi-stage Dockerfile
#
# Stage 1 (builder): installs all dependencies and compiles TypeScript → dist/
# Stage 2 (runtime): copies only the compiled output and prod dependencies,
#                    keeping the final image lean (~200 MB vs ~800 MB full build).
#
# Build:  docker build -t finsage-bff .
# Run:    docker run -p 4000:4000 --env-file .env.production finsage-bff

# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first so Docker layer-cache skips npm install when code changes
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy Prisma schema and generate the client before compiling TypeScript
COPY prisma ./prisma
RUN npx prisma generate

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Install production dependencies only (no dev tooling in the final image)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Re-generate Prisma client for the runtime stage (needs schema + generate)
COPY prisma ./prisma
RUN npx prisma generate

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# The uploads/ directory is where multer writes files; declare it as a volume
# so it survives container restarts (or swap for S3 in production).
RUN mkdir -p uploads
VOLUME ["/app/uploads"]

ENV NODE_ENV=production
EXPOSE 4000

# Run migrations then start the server.
# In production, prefer running migrations in a separate init container or CI step.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
