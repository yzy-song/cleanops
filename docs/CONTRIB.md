# 开发指南 (Contributing)

## 环境要求

| 工具 | 版本 |
|------|------|
| Node.js | v20.x |
| pnpm | 10.x |
| PostgreSQL | 16+ |

## 快速开始

```bash
git clone git@github.com:yzy-song/cleanops.git
cd cleanops
pnpm install

# 配置环境变量
cp .env.example apps/api/.env
cp .env.example packages/db/.env

# 编辑 packages/db/.env，修改 DATABASE_URL
# 编辑 apps/api/.env，修改 JWT_SECRET 及其他 Key

# 初始化数据库
pnpm --filter @cleanops/db exec prisma db push
pnpm --filter @cleanops/db exec prisma generate
pnpm --filter @cleanops/db build

# 启动开发服务
pnpm dev
```

前端 `http://localhost:3001`，后端 `http://localhost:3000`，Swagger `http://localhost:3000/api-docs`。

## 项目结构

```
cleanops/
├── apps/
│   ├── api/          # NestJS 后端 (port 3000)
│   └── web/          # Next.js 前端 (port 3001)
├── packages/
│   └── db/           # Prisma schema + 共享客户端
├── deploy/           # 服务器部署脚本
├── .github/workflows/  # CI 和 Deploy Actions
├── .env.example      # 环境变量模板
└── pnpm-workspace.yaml
```

## 可用脚本

### 根目录

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 并行启动 API + Web 开发服务 (turbo) |
| `pnpm build` | 并行构建所有包 (turbo) |
| `pnpm lint` | 并行 lint 所有包 (turbo) |

### @cleanops/api (apps/api)

| 命令 | 说明 |
|------|------|
| `pnpm --filter @cleanops/api dev` | NestJS 热重载开发 |
| `pnpm --filter @cleanops/api build` | `nest build` 编译 |
| `pnpm --filter @cleanops/api start:prod` | 生产启动 (`node dist/main`) |
| `pnpm --filter @cleanops/api test` | Jest 单元测试 |
| `pnpm --filter @cleanops/api test:cov` | 测试 + 覆盖率 |
| `pnpm --filter @cleanops/api test:e2e` | E2E 测试 |
| `pnpm --filter @cleanops/api lint` | ESLint |

### @cleanops/web (apps/web)

| 命令 | 说明 |
|------|------|
| `pnpm --filter @cleanops/web dev` | Next.js 开发 (turbopack, port 3001) |
| `pnpm --filter @cleanops/web build` | `next build --turbopack` |
| `pnpm --filter @cleanops/web start` | `next start` 生产启动 |
| `pnpm --filter @cleanops/web lint` | ESLint |

### @cleanops/db (packages/db)

| 命令 | 说明 |
|------|------|
| `pnpm --filter @cleanops/db db:push` | 推送 schema 到数据库 |
| `pnpm --filter @cleanops/db db:studio` | Prisma Studio 数据浏览器 |
| `pnpm --filter @cleanops/db db:seed` | 种子数据 |
| `pnpm --filter @cleanops/db build` | 编译 TypeScript → dist/ |
| `pnpm --filter @cleanops/db exec prisma generate` | 生成 Prisma Client |

## 环境变量

| 变量 | 级别 | 说明 |
|------|------|------|
| `DATABASE_URL` | **必需** | PostgreSQL 连接串 |
| `JWT_SECRET` | **必需** | JWT 签名密钥 |
| `JWT_EXPIRATION_TIME` | 可选 | Token 过期时间，默认 `1d` |
| `PORT` | 可选 | API 端口，默认 `3000` |
| `STRIPE_SECRET_KEY` | 可选 | Stripe 密钥，未设则支付不可用 |
| `STRIPE_WEBHOOK_SECRET` | 可选 | Stripe webhook 验签 |
| `RESEND_API_KEY` | 可选 | 邮件发送，未设则跳过 |
| `CLOUDINARY_*` | 可选 | 图片上传 |
| `NEXT_PUBLIC_API_URL` | 可选 | 前端 API 地址，默认 `http://localhost:3000` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | 可选 | 地图功能 |
| `CORS_ORIGINS` | 可选 | 跨域白名单 |

## 常用工作流

### 修改数据库结构

```bash
# 1. 编辑 packages/db/prisma/schema.prisma
# 2. 推送变更
pnpm --filter @cleanops/db exec prisma db push
# 3. 重新生成客户端
pnpm --filter @cleanops/db exec prisma generate
pnpm --filter @cleanops/db build
# 4. 重启开发服务
pnpm dev
```

### 只开发后端

```bash
pnpm --filter @cleanops/api dev
```

### 只开发前端

```bash
pnpm --filter @cleanops/web dev
```

## CI

所有 PR 和 push 到 main 都会触发：
- **TypeScript 类型检查** (API + Web)
- **构建** (API + Web)
- **Lint** (API + Web)

## 提交规范

```
feat: 新功能
fix: Bug 修复
refactor: 重构
chore: 杂项
docs: 文档
test: 测试
```
