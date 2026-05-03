# Stage 1: Build
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc* ./
COPY package.json turbo.json ./
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

COPY packages/db ./packages/db/
COPY apps/api ./apps/api/

RUN pnpm --filter @cleanops/db exec prisma generate
RUN pnpm --filter @cleanops/api build

# Prune dev dependencies for smaller production image
RUN pnpm --filter @cleanops/api --prod deploy /app/prod

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=build /app/prod ./
COPY --from=build /app/packages/db/prisma ./packages/db/prisma

EXPOSE 3000
CMD ["node", "dist/main.js"]
