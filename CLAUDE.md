# CleanOps — Cleaning Business Management Platform

Monorepo: NestJS API + Next.js 14 Web + Prisma + PostgreSQL.

## Quick Links
- Backend rules: [apps/api/CLAUDE.md](apps/api/CLAUDE.md)
- Frontend rules: [apps/web/CLAUDE.md](apps/web/CLAUDE.md)
- Database: [packages/db/prisma/schema.prisma](packages/db/prisma/schema.prisma)

## Shared Rules (all projects)
- **金额**: 整数 cents，禁止浮点数。前端展示 `/100` 转 €
- **时间**: UTC 存储，`date-fns-tz` 转用户时区展示
- **新代码不碰相邻旧代码**，不顺手重构
- **不改测试**（除非改动导致过时）
- **不改 CLAUDE.md**（除非明确要求）
- **国际化**: 所有用户可见文案通过 `t()` 函数
- **提交粒度**: 一个功能点一个 commit，不攒一大堆。做完一个提交一个。
- **提交格式**: `类型: 描述`（feat/fix/refactor/docs/test/chore）

## Common Commands
| Command | What |
|---------|------|
| `pnpm dev` | Start API (3000) + Web (3001) |
| `pnpm build` | Build both |
| `pnpm --filter @cleanops/api test` | Backend tests |
| `pnpm --filter @cleanops/web build` | Frontend build check |

## Database
```
# Dev (local)
pnpm --filter @cleanops/db exec prisma db push
pnpm --filter @cleanops/db exec prisma generate

# Production
pnpm --filter @cleanops/db exec prisma migrate deploy
```

## Deploy
- CI: `.github/workflows/deploy-cleanops.yml`
- Server: Oracle Cloud (138.2.42.101)
- PM2: `ecosystem.config.cjs`
- SSH: `ssh yzy`
- Pre-deploy: `export DATABASE_URL=...` before starting node (Prisma reads it at import time)

## Architecture
```
apps/api   → NestJS :3000 (REST + Swagger)
apps/web   → Next.js :3001 (App Router)
packages/db → Prisma schema + migrations
```

### Integration Points
- **Stripe**: Per-company secret key (not Connect). Payment Links for invoices.
- **Xero**: OAuth2 → auto-sync invoices on create/paid/void. Token refresh cron.
- **Cloudinary**: Job photo uploads.
- **Google Maps**: Geocoding postal codes → lat/lng.
