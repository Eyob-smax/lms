# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9.15.9

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json nx.json ./
COPY apps/backend ./apps/backend
COPY libs/shared-types ./libs/shared-types

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --no-frozen-lockfile --prefer-offline
RUN pnpm exec prisma generate --schema=apps/backend/prisma/schema.prisma
RUN pnpm exec nx build backend --prod

# Stage 2: Runner
FROM node:22-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm@9.15.9

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=builder /app/dist/apps/backend ./dist/apps/backend
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "dist/apps/backend/main.js"]
