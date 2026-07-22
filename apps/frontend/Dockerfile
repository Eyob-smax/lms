# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@11.9.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json nx.json ./
COPY apps/frontend ./apps/frontend
COPY libs/shared-types ./libs/shared-types

RUN pnpm install --frozen-lockfile
RUN pnpm exec nx build frontend --prod

# Stage 2: Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV PORT=3001
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder /app/dist/apps/frontend ./

EXPOSE 3001

CMD ["pnpm", "start"]
