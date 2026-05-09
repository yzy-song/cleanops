# CleanOps API 自动化部署说明

基于 Git hooks + PM2 的 NestJS monorepo 后端自动化部署方案。

## 核心脚本

| 脚本                  | 用途                                                   |
| --------------------- | ------------------------------------------------------ |
| `deploy.sh`           | 主部署脚本，由 post-receive 触发，执行完整部署流程     |
| `post-receive`        | Git hook，监听 main 分支 push 事件，自动触发 deploy.sh |
| `rollback.sh`         | 手动回滚到指定历史版本                                 |
| `ecosystem.config.js` | PM2 进程管理配置                                       |

## 服务器初始化（一次性）

```bash
# 1. 创建目录结构
sudo mkdir -p /var/www/cleanops/{releases,backups,logs}
sudo chown -R $USER:$USER /var/www/cleanops

# 2. 创建 Git 裸仓库
git init --bare /var/www/cleanops/repo.git

# 3. 拷贝 post-receive hook
cp deploy/post-receive /var/www/cleanops/repo.git/hooks/post-receive
chmod +x /var/www/cleanops/repo.git/hooks/post-receive

# 4. 拷贝部署脚本
cp deploy/deploy.sh /var/www/cleanops/deploy.sh
cp deploy/rollback.sh /var/www/cleanops/rollback.sh
cp deploy/ecosystem.config.js /var/www/cleanops/ecosystem.config.js
chmod +x /var/www/cleanops/deploy.sh /var/www/cleanops/rollback.sh

# 5. 创建 .env 文件
cat > /var/www/cleanops/.env << 'EOF'
DATABASE_URL=postgresql://user:password@localhost:5432/cleanops
JWT_SECRET=your-jwt-secret
PORT=3000
# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxx
STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxx
STRIPE_STARTER_YEARLY_PRICE_ID=price_xxx
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_xxx
STRIPE_BUSINESS_YEARLY_PRICE_ID=price_xxx
# Revolut
REVOLUT_MERCHANT_API_KEY=...
REVOLUT_WEBHOOK_SECRET=...
EOF

# 6. 安装 Node.js 20 + pnpm + PM2
# Node.js 20 (via nvm or nodesource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -bash
sudo apt-get install -y nodejs
npm install -g pnpm@10 pm2

# 7. 在本地添加 remote 并首次推送
git remote add production ssh://user@your-server:/var/www/cleanops/repo.git
git push production main
```

## deploy.sh 工作流程

1. **创建版本目录** — 按时间戳 + commit hash 创建独立发布目录，如 `releases/20240830123000-abc1234`
2. **导出代码** — `git archive` 将 monorepo 整体解压到发布目录
3. **环境配置** — 将 `.env` 复制到 `apps/api/` 和 `packages/db/`，验证必需变量
4. **安装依赖** — `pnpm install --frozen-lockfile` 安装 workspace 依赖
5. **生成 Prisma Client** — `pnpm --filter @cleanops/db exec prisma generate`
6. **数据库连接检查** — 使用 Prisma Client 验证数据库可达性，失败则自动回滚
7. **构建** — `pnpm --filter @cleanops/api build`
8. **更新符号链接** — `current` → `releases/<version>/apps/api/dist`
9. **重启服务** — PM2 restart/start，等待 30s ready
10. **健康检查** — 轮询 `/api-docs` 端点直至响应成功
11. **清理** — 保留最新 5 个版本，删除旧版本

## 回滚

### 自动回滚

构建失败、数据库连接失败、健康检查失败时自动触发，回滚到上一个成功版本。

### 手动回滚

```bash
# 查看可用版本
ls /var/www/cleanops/releases/

# 回滚到指定版本 (时间戳即目录名)
/var/www/cleanops/rollback.sh 20240830120000
```

## PM2 管理

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs cleanops

# 重启
pm2 restart cleanops

# 保存 PM2 列表（开机自启）
pm2 save
pm2 startup
```

## 与旧方案 (cloudloom-server) 的主要差异

| 项目         | 旧方案                        | 新方案                     |
| ------------ | ----------------------------- | -------------------------- |
| 项目名       | cloudloom-server              | cleanops                   |
| 包管理器     | npm                           | pnpm (monorepo workspace)  |
| 数据库检查   | TypeORM DataSource            | Prisma Client $connect     |
| 构建产物路径 | dist/                         | apps/api/dist/             |
| 环境变量     | DB_HOST, DB_PORT, DB_USERNAME | DATABASE_URL (Prisma 标准) |
| 健康检查     | /health                       | /api-docs (Swagger)        |
| 运行用户     | cloudloom                     | www-data                   |
