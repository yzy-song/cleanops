# CleanOps — NestJS + Next.js + Prisma + PostgreSQL Monorepo

## 项目结构
- `apps/api` — NestJS 后端，端口 4000
- `apps/web` — Next.js 14 App Router 前端，端口 3001
- `packages/db` — Prisma schema + 共享数据库层

## 关键规则
- 金额一律用整数 cents，禁止浮点数；仅前端展示时 `/100` 转欧元
- 时间统一 UTC 存储，展示时用 `date-fns-tz` 转用户时区
- 新代码不改相邻旧代码，不顺手重构
- 不改测试（除非你的改动导致测试过时）
- 不改 CLAUDE.md（除非明确要求）

## 后端规则 (`apps/api`)
- Controller 只做路由，业务逻辑在 Service
- DTO 用 `class-validator` 校验
- 遵循现有 module 模式，用依赖注入

## 前端规则 (`apps/web`)
- App Router，优先 Server Component
- UI 和数据获取分离，不 mock 数据
- 所有用户可见文案通过 `t()` i18n 函数

## 数据库规则 (`packages/db`)
- 所有 DB 操作经此层，不写 raw query
- Schema 改动用 `prisma db push`（开发）/ `prisma migrate deploy`（生产）

## 命令
- `pnpm dev` — 启动双端
- `pnpm build` — 构建双端
- `pnpm --filter @cleanops/api test` — 后端测试
- `pnpm --filter @cleanops/web build` — 前端构建

## CI/Deploy
- CI 部署配置: `.github/workflows/deploy-cleanops.yml`
- 服务器: Oracle Cloud (138.2.42.101), PM2 管理进程
- SSH: `ssh yzy`
