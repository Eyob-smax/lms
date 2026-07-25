# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@11.9.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json nx.json ./
COPY apps/frontend ./apps/frontend
COPY libs/shared-types ./libs/shared-types

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --no-frozen-lockfile
RUN NEXT_CPU_COUNT=1 NODE_OPTIONS="--max-old-space-size=1536" pnpm exec nx build frontend --prod

# Stage 2: Runner
FROM node:22-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm@11.9.0

ENV PORT=3001
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/apps/frontend ./apps/frontend
COPY --from=builder /app/dist/apps/frontend ./dist/apps/frontend
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001

CMD ["node_modules/.bin/next", "start", "apps/frontend", "-p", "3001"]
