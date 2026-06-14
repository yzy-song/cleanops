# CleanOps — Cleaning Business Management Platform / 清洁业务管理平台

Monorepo: NestJS API + Next.js 14 Web + Prisma + PostgreSQL.

## Quick Links / 快速链接
- Backend rules / 后端规范: [apps/api/CLAUDE.md](apps/api/CLAUDE.md)
- Frontend rules / 前端规范: [apps/web/CLAUDE.md](apps/web/CLAUDE.md)
- Database / 数据库: [packages/db/prisma/schema.prisma](packages/db/prisma/schema.prisma)
- Docs / 文档: [docs/](docs/)

## Shared Rules / 共享规则 (all projects / 所有项目)
- **Money / 金额**: 整数 cents，禁止浮点数。前端展示 `/100` 转 € / Integer cents only. Display ÷100 as €
- **Time / 时间**: UTC 存储，`date-fns-tz` 转用户时区展示 / UTC storage, display with timezone
- **新代码不碰相邻旧代码**，不顺手重构 / Don't refactor adjacent old code
- **不改测试**（除非改动导致过时）/ Don't modify tests unless your change breaks them
- **不改 CLAUDE.md**（除非明确要求）/ Don't modify CLAUDE.md unless explicitly asked
- **Internationalization / 国际化**: 所有用户可见文案通过 `t()` 函数 / All user-facing text via t()
- **Commit granularity / 提交粒度**: 一个功能点一个 commit，不攒一大堆 / One feature per commit
- **Commit format / 提交格式**: `type: description`（feat/fix/refactor/docs/test/chore）
- **New docs / 新文档**: 中英双语 / Bilingual Chinese + English

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
