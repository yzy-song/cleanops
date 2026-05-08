# CleanOps

清洁业务管理 SaaS — 工单调度、GPS 打卡、账单支付、客户管理。

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Next.js 15 (App Router), React 19, Tailwind CSS |
| 后端 | NestJS 11, TypeScript, Prisma |
| 数据库 | PostgreSQL |
| 支付 | Stripe Billing + Revolut Pay |
| CI/CD | GitHub Actions, Vercel, PM2 |
| 包管理 | pnpm 10 (monorepo) |

## 快速开始

```bash
# 要求 Node.js 20 + pnpm 10 + PostgreSQL
git clone git@github.com:yzy-song/cleanops.git
cd cleanops
pnpm install

cp .env.example apps/api/.env
cp .env.example packages/db/.env
# 编辑两处 .env，填入 DATABASE_URL 和 JWT_SECRET

pnpm --filter @cleanops/db exec prisma db push
pnpm --filter @cleanops/db exec prisma generate
pnpm --filter @cleanops/db build

pnpm dev   # 前端 :3001  后端 :3000
```

## 项目结构

```
cleanops/
├── apps/
│   ├── api/            # NestJS 后端
│   └── web/            # Next.js 前端
├── packages/db/        # Prisma schema + 共享客户端
├── deploy/             # 服务器部署脚本
├── docs/               # 文档
└── .github/workflows/  # CI + Deploy
```

## 文档

- [开发指南](docs/CONTRIB.md) — 环境配置、脚本参考、工作流
- [运维手册](docs/RUNBOOK.md) — 部署流程、故障排查、回滚

## 定价

| 等级 | 月费 | 工人数 |
|------|------|--------|
| Starter | €29/mo | ≤5 |
| Pro | €69/mo | ≤20 |
| Business | €129/mo | 无限 |

14 天免费试用，无需信用卡。
