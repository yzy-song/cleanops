# Runbook / 运维手册

> Last updated / 最后更新: 2026-06-14

## Architecture / 架构概览

```
GitHub Repo (yzy-song/cleanops)
     │
     ├─→ GitHub Actions Deploy (apps/api/** or packages/db/** change)
     │     └─→ SSH → Oracle Cloud (129.225.181.19)
     │           ├─→ pnpm --filter @cleanops/db exec prisma generate
     │           ├─→ pnpm --filter @cleanops/db exec prisma migrate deploy
     │           └─→ PM2 restart cleanops (as user 'cleanops', port 4000)
     │
     └─→ Vercel (apps/web/**)
           └─→ Auto-deploy frontend
```

Endpoints / 端点:

- **API**: `https://api.cleanops.yzysong.com` (Nginx → PM2 :4000)
- **Web**: `https://cleanops.yzysong.com` (Vercel)
- **Local dev**: API :3000, Web :3001

## Deploy / 部署

### Backend auto-deploy / 后端自动部署

Trigger: push to main with changes to `apps/api/**`, `packages/db/**`, or `.github/workflows/deploy-cleanops.yml`

CI steps:
1. Build + test
2. SCP dist to server → `/var/www/cleanops/releases/$SHA`
3. `git pull` latest on server
4. `pnpm install --frozen-lockfile`
5. `pnpm --filter @cleanops/db exec prisma generate`
6. `pnpm --filter @cleanops/db exec prisma migrate deploy` ⚠️ Must use `--filter` not `exec`
7. Symlink switch → PM2 restart
8. Health check: `curl http://localhost:4000/api/health`

### Frontend / 前端

Vercel auto-deploys on `apps/web/` changes. Env vars in Vercel dashboard:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyABt4xLxtddG56gqe1dwcHF5ZZ4wCs_tyY` (frontend key, HTTP restricted)

### Manual rollback / 手动回滚

```bash
ssh yzy
ls /var/www/cleanops/releases/
sudo ln -nfs /var/www/cleanops/releases/<old-sha>/dist /var/www/cleanops/current
sudo -u cleanops pm2 restart cleanops
```

## Server / 服务器

- **Host**: Oracle Cloud (129.225.181.19)
- **User**: ubuntu (deploy) / cleanops (PM2)
- **PM2**: `sudo -u cleanops pm2 <cmd>`
- **DB**: PostgreSQL, user 'cleanops', DB 'db-cleanops'
- **Nginx**: reverse proxy :4000

## Env Vars / 环境变量

Key env vars on server (`/var/www/cleanops/repo/apps/api/.env`):

| Var | Purpose |
|-----|---------|
| DATABASE_URL | PostgreSQL connection / 数据库连接 |
| JWT_SECRET | Auth token signing |
| STRIPE_SECRET_KEY | Platform Stripe (subscriptions) / 平台订阅 |
| STRIPE_BILLING_WEBHOOK_SECRET | Subscription webhook / 订阅回调 |
| XERO_CLIENT_ID, XERO_CLIENT_SECRET, XERO_REDIRECT_URI | Xero OAuth |
| GOOGLE_MAPS_API_KEY | Backend Geocoding + Directions / 地图API (no restriction) |
| CORS_ORIGINS | Allowed frontend origins |

## Troubleshooting / 故障排查

### API not responding / API 无响应

```bash
sudo -u cleanops pm2 status
sudo -u cleanops pm2 logs cleanops --lines 100
curl http://localhost:4000/api/health
```

### Prisma/DB issues / 数据库问题

```bash
# Check migration status
export DATABASE_URL=$(grep DATABASE_URL /var/www/cleanops/.env | cut -d= -f2-)
cd /var/www/cleanops/repo
pnpm --filter @cleanops/db exec prisma migrate status

# Manual SQL (if prisma fails)
psql "$DATABASE_URL" -c "ALTER TABLE ..."
```

### Xero token expired / Xero Token 过期

Disconnect + reconnect Xero in Settings page. Token auto-refreshes every 25 min via cron.
