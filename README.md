# CleanOps

清洁业务管理 SaaS — 工单调度、GPS 打卡、账单支付、客户管理。

## 技术栈

| 层     | 技术                                            |
| ------ | ----------------------------------------------- |
| 前端   | Next.js 15 (App Router), React 19, Tailwind CSS |
| 后端   | NestJS 11, TypeScript, Prisma                   |
| 数据库 | PostgreSQL                                      |
| 支付   | Stripe Billing + Revolut Pay                    |
| CI/CD  | GitHub Actions, Vercel, PM2                     |
| 包管理 | pnpm 10 (monorepo)                              |

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

## Claude Code 技能与命令 / Skills & Commands

### 推荐技能 / Recommended Skills

| Skill / 技能 | 用途 / Purpose |
|-------------|----------------|
| `code-review` | 代码写完自动审查质量/安全 · Auto code quality & security review |
| `security-review` | 提交前检查密钥泄露、注入等 · Check for leaked keys, injection, etc. |
| `tdd-workflow` | 写新功能先写测试再实现 · Test-driven development workflow |
| `ui-ux-pro-max` | UI 设计参考（配色、排版、动效）· Design system, colors, typography |
| `next-best-practices` | Next.js 最佳实践检查 · Next.js App Router best practices |
| `nodejs-backend-patterns` | NestJS 后端模式参考 · Production-ready backend patterns |
| `prisma-postgres` | Prisma + PostgreSQL 操作指南 · Prisma & Postgres operations |
| `typescript-advanced-types` | 复杂类型体操参考 · Advanced TypeScript type patterns |
| `simplify` | 代码写完后自动精简 · Simplify & optimize code after writing |
| `deploy-to-vercel` | Vercel 前端部署 · Deploy frontend to Vercel |
| `frontend-design` | 高质量前端页面生成 · Production-grade UI generation |
| `systematic-debugging` | Bug 排查方法论 · Structured debugging approach |

### 常用命令 / Common Commands

| 命令 / Command | 作用 / Purpose |
|---------------|----------------|
| `/plan` | 复杂功能先出实施计划 · Plan before implementing complex features |
| `/code-review` | 审查当前变更 · Review pending changes |
| `/security-review` | 安全检查 · Security audit |
| `/tdd` | 测试驱动开发流程 · TDD: write tests → implement → refactor |
| `/build-and-fix` | 自动修复构建错误 · Auto-fix build errors |
| `/update-docs` | 更新 CONTRIB.md + RUNBOOK · Sync documentation |
| `/simplify` | 精简刚写的代码 · Simplify recently written code |
| `/e2e` | Playwright 端到端测试 · End-to-end testing with Playwright |
| `/compact` | 压缩上下文释放空间 · Compact conversation context |
| `/config` | 修改设置（主题/模型等）· Change settings (theme, model, etc.) |

> 推荐工作流 / Recommended workflow：写代码 → `/code-review` → `/security-review` → `git push production main`

## 定价

| 等级     | 月费    | 工人数 |
| -------- | ------- | ------ |
| Starter  | €29/mo  | ≤5     |
| Pro      | €69/mo  | ≤20    |
| Business | €129/mo | 无限   |

14 天免费试用，无需信用卡。
