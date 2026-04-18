# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: runner ───────────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy migrations so the service can run them on startup if needed
COPY src/db/migrations ./dist/db/migrations

RUN addgroup -S finflow && adduser -S finflow -G finflow
USER finflow

EXPOSE 3001
CMD ["node", "dist/index.js"]
