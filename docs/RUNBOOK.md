# 运维手册 (Runbook)

## 架构概览

```
GitHub Repo (yzy-song/cleanops)
     │
     ├─→ GitHub Actions CI  (typecheck → build → lint)
     │
     ├─→ GitHub Actions Deploy (apps/api/** 变更时触发)
     │     └─→ SSH → 服务器 /var/www/cleanops/deploy.sh
     │           └─→ PM2 cluster (2 instances) :3000
     │
     └─→ Vercel (apps/web/**)
           └─→ 自动部署前端
```

服务端点：

- **API**: `https://api.cleanops.yzysong.com`（Nginx → PM2 :3000）
- **Web**: Vercel 自动分配域名
- **Swagger**: `https://api.cleanops.yzysong.com/api-docs`

## 部署

### 后端自动部署

推送到 main 分支，且 `apps/api/**` 或 `packages/db/**` 有变更时自动触发。

服务器执行流程：

1. `git pull` 最新代码
2. 检测后端相关文件是否有变更
3. `pnpm install --frozen-lockfile`
4. `prisma generate` → `prisma db push`（按需）
5. `pnpm --filter @cleanops/db build`
6. `pnpm --filter @cleanops/api build`
7. 符号链接切换 → PM2 滚动重启
8. 健康检查 `/api-docs`

### 前端自动部署

Vercel 自动检测 `apps/web/` 变更并构建部署。

### 手动回滚

```bash
# SSH 到服务器
ssh root@<服务器IP>

# 查看可用版本
ls /var/www/cleanops/releases/

# 回滚到指定版本
/var/www/cleanops/rollback.sh 20250508123000-abc1234
```

## 常用运维命令

### PM2 管理

```bash
pm2 status                     # 查看状态
pm2 logs cleanops --lines 50  # 查看日志
pm2 restart cleanops       # 重启
pm2 stop cleanops          # 停止
pm2 start cleanops         # 启动
```

### 数据库操作

```bash
# 查看 schema
pnpm --filter @cleanops/db exec prisma db pull

# 推送 schema（谨慎，生产环境用 migration 而非 push）
pnpm --filter @cleanops/db exec prisma db push

# 打开数据浏览器
pnpm --filter @cleanops/db exec prisma studio
```

### Nginx 管理

```bash
nginx -t                  # 测试配置
systemctl reload nginx    # 重载配置
```

## 故障排查

### API 无响应

```bash
# 1. 检查 PM2 状态
pm2 status

# 2. 检查日志
pm2 logs cleanops --lines 100

# 3. 检查端口
netstat -tlnp | grep 3000

# 4. 检查 Nginx
nginx -t && systemctl status nginx

# 5. 直接测试 API
curl http://127.0.0.1:3000/api-docs
```

### 部署失败

```bash
# 查看部署日志
cat /var/www/cleanops/logs/deployment.log

# 常见原因：
# - .env 中 DATABASE_URL 配置错误
# - pnpm-lock.yaml 不同步（本地忘记 pnpm install）
# - 磁盘空间不足
df -h
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 运行状态
systemctl status postgresql

# 检查连接
psql "postgresql://用户名:密码@localhost:5432/数据库名"

# 检查 .env 中的 DATABASE_URL
cat /var/www/cleanops/.env | grep DATABASE_URL
```

### 前端 Vercel 构建失败

1. 查看 Vercel 部署日志
2. 常见原因：
   - `prisma generate` 失败 → 检查 DATABASE_URL
   - `tsc` 找不到 → 检查 packages/db/package.json 是否有 typescript
   - pnpm-lock.yaml 不同步
3. 在 Vercel 手动触发 Redeploy

## 监控

- **GitHub Actions**: PR 页面检查 CI 状态
- **PM2 日志**: `pm2 logs cleanops`
- **服务器磁盘**: `df -h /var/www`
- **Vercel**: Dashboard 查看前端部署状态

## 安全注意事项

- `.env` 文件权限应为 `600`
- 不要在日志中输出 PII（邮箱、IP、真实姓名）
- Stripe webhook secret 绝不外泄
- 定期轮换 JWT_SECRET
