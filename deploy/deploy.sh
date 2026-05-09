#!/bin/bash
# CleanOps API 自动化部署脚本
# 适用: pnpm monorepo, bare repo + post-receive hook 触发
#
# 服务器初始化:
#   git init --bare /var/www/cleanops/repo.git
#   cp deploy/post-receive /var/www/cleanops/repo.git/hooks/post-receive
#   mkdir -p /var/www/cleanops/{releases,backups,logs}
#   创建 /var/www/cleanops/.env
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================ 配置 ============================

PROJECT_NAME="cleanops"
DEPLOY_ROOT="/var/www/${PROJECT_NAME}"
REPO_DIR="${DEPLOY_ROOT}/repo.git"
RELEASES_DIR="${DEPLOY_ROOT}/releases"
CURRENT_SYMLINK="${DEPLOY_ROOT}/current"
ENV_FILE="${DEPLOY_ROOT}/.env"
ECOSYSTEM_CONFIG_FILE="${DEPLOY_ROOT}/ecosystem.config.js"
BACKUPS_DIR="${DEPLOY_ROOT}/backups"
LOGS_DIR="${DEPLOY_ROOT}/logs"

PNPM_VERSION="10"
DB_CHECK_TIMEOUT=60
DEPLOY_TIMEOUT=900
PORT="${PORT:-3000}"

# 宝塔自动检测 web 用户
if id www-data &>/dev/null; then
    APP_USER="www-data"; APP_GROUP="www-data"
elif id www &>/dev/null; then
    APP_USER="www"; APP_GROUP="www"
else
    APP_USER=""; APP_GROUP=""
fi

export PATH="${PATH}:$(npm config get prefix 2>/dev/null)/bin:/www/server/nodejs/current/bin:/usr/local/bin:${HOME}/.local/bin"

mkdir -p "${RELEASES_DIR}" "${BACKUPS_DIR}" "${LOGS_DIR}"

# ============================ 工具函数 ============================

log_deployment()  { echo "$(date '+%F %T') - $1" >> "${LOGS_DIR}/deployment.log"; }
log_error()       { echo "$(date '+%F %T') - FAILED: $1" >> "${LOGS_DIR}/deployment.log"; }

validate_environment() {
    for var in DATABASE_URL JWT_SECRET; do
        if [ -z "${!var}" ]; then
            echo -e "${RED}Missing env var: $var${NC}"
            log_error "missing_env_vars"
            exit 1
        fi
    done
}

rollback_deployment() {
    echo -e "${RED}=== Rolling back ===${NC}"

    local LAST
    if [ -n "${RELEASE_NAME}" ]; then
        LAST=$(find "${RELEASES_DIR}" -maxdepth 1 -type d ! -name "${RELEASE_NAME}" -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -n 1 | awk '{print $2}')
    else
        LAST=$(find "${RELEASES_DIR}" -maxdepth 1 -type d -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -n 1 | awk '{print $2}')
    fi

    if [ -z "$LAST" ]; then
        echo -e "${RED}No previous release to roll back to${NC}"
        exit 1
    fi

    echo -e "${YELLOW}Switching to: ${LAST}${NC}"
    ln -nfs "${LAST}/apps/api/dist" "${CURRENT_SYMLINK}"

    if command -v pm2 &>/dev/null; then
        pm2 restart "${ECOSYSTEM_CONFIG_FILE}" --env production 2>/dev/null || true
    fi

    [ -n "${RELEASE_PATH}" ] && [ -d "${RELEASE_PATH}" ] && rm -rf "${RELEASE_PATH}"
    echo -e "${GREEN}Rollback done${NC}"
    exit 1
}

backup_current_version() {
    if [ -d "${CURRENT_SYMLINK}" ]; then
        echo -e "${YELLOW}Backing up current version...${NC}"
        local NAME="${TIMESTAMP}-before-${DEPLOY_ID}"
        tar -czf "${BACKUPS_DIR}/${NAME}.tar.gz" -C "${CURRENT_SYMLINK}" . 2>/dev/null || true
    fi
}

check_db_connection() {
    echo -e "${YELLOW}Checking database connection...${NC}"
    local SCRIPT="
        var PrismaClient = require('@prisma/client').PrismaClient;
        var prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
        prisma.\$connect().then(function() { console.log('OK'); process.exit(0); }).catch(function(e) { console.error(e.message); process.exit(1); });
    "
    if timeout ${DB_CHECK_TIMEOUT} node -e "${SCRIPT}"; then
        echo -e "${GREEN}Database OK${NC}"
        return 0
    else
        echo -e "${RED}Database connection failed${NC}"
        return 1
    fi
}

wait_for_app_health() {
    local max=$((DEPLOY_TIMEOUT / 5))
    echo -e "${YELLOW}Health check (port ${PORT})...${NC}"
    for i in $(seq 1 $max); do
        if curl -sf "http://127.0.0.1:${PORT}/api-docs" >/dev/null 2>&1; then
            echo -e "${GREEN}Healthy after ${i} attempts${NC}"
            return 0
        fi
        echo -e "${YELLOW}  ${i}/${max} waiting...${NC}"
        sleep 5
    done
    echo -e "${RED}App did not become healthy${NC}"
    log_error "health_check_failed"
    rollback_deployment
    exit 1
}

# ============================ 主流程 ============================

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN} CleanOps Deploy — $(date)${NC}"
echo -e "${BLUE}========================================${NC}"

# post-receive hook 传入 commit hash
if [ -z "$1" ]; then
    echo -e "${RED}No commit hash provided${NC}"
    exit 1
fi

DEPLOY_ID=$(git --git-dir="${REPO_DIR}" rev-parse --short "$1")
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
RELEASE_NAME="${TIMESTAMP}-${DEPLOY_ID}"
RELEASE_PATH="${RELEASES_DIR}/${RELEASE_NAME}"

DEPLOY_START=$(date +%s)

# ---- 1. 从 bare repo 导出代码 ----
echo -e "${YELLOW}Archiving commit ${DEPLOY_ID}...${NC}"
mkdir -p "${RELEASE_PATH}"
git --git-dir="${REPO_DIR}" archive --format=tar "$1" | tar -xf - -C "${RELEASE_PATH}"

cd "${RELEASE_PATH}"

# ---- 2. 环境配置 ----
if [ -f "${ENV_FILE}" ]; then
    cp "${ENV_FILE}" apps/api/.env
    cp "${ENV_FILE}" packages/db/.env
    echo -e "${GREEN}.env -> apps/api/ & packages/db/${NC}"
    set -a; source "${ENV_FILE}"; set +a
    validate_environment
else
    echo -e "${YELLOW}Warning: .env not found at ${ENV_FILE}${NC}"
fi

# ---- 3. pnpm ----
if ! command -v pnpm &>/dev/null; then
    echo -e "${YELLOW}Installing pnpm@${PNPM_VERSION}...${NC}"
    npm install -g pnpm@${PNPM_VERSION}
fi

# ---- 4. 安装依赖 ----
echo -e "${YELLOW}pnpm install...${NC}"
pnpm install --frozen-lockfile || { log_error "install_failed"; rollback_deployment; }

# ---- 5. Prisma ----
echo -e "${YELLOW}prisma generate...${NC}"
pnpm --filter @cleanops/db exec prisma generate || { log_error "prisma_failed"; rollback_deployment; }

# ---- 6. 编译 packages/db ----
echo -e "${YELLOW}build @cleanops/db...${NC}"
pnpm --filter @cleanops/db build || { log_error "db_build_failed"; rollback_deployment; }

# ---- 7. 数据库检查 (非阻塞 — 健康检查会兜底) ----
if [ -f "${ENV_FILE}" ]; then
    check_db_connection || echo -e "${YELLOW}DB check skipped, health check will verify${NC}"
fi

# ---- 8. 构建 API ----
echo -e "${YELLOW}nest build...${NC}"
pnpm --filter @cleanops/api build || { log_error "build_failed"; rollback_deployment; }

# ---- 9. 切换版本 ----
echo -e "${YELLOW}Updating symlink...${NC}"
ln -nfs "${RELEASE_PATH}/apps/api/dist" "${CURRENT_SYMLINK}"

# ---- 10. PM2 配置 ----
[ -f "./deploy/ecosystem.config.js" ] && cp "./deploy/ecosystem.config.js" "${ECOSYSTEM_CONFIG_FILE}"

# ---- 11. 权限 ----
[ -n "${APP_USER}" ] && chown -R ${APP_USER}:${APP_GROUP} "${DEPLOY_ROOT}" 2>/dev/null || true
chmod -R u=rwX,g=rX,o=rX "${DEPLOY_ROOT}" 2>/dev/null || true

# ---- 12. 备份 & 重启 ----
backup_current_version

echo -e "${YELLOW}PM2 restart...${NC}"
if pm2 list 2>/dev/null | grep -q "${PROJECT_NAME}"; then
    pm2 restart "${ECOSYSTEM_CONFIG_FILE}" --env production  || { log_error "pm2_restart_failed"; rollback_deployment; }
else
    pm2 start "${ECOSYSTEM_CONFIG_FILE}" --env production  || { log_error "pm2_start_failed"; rollback_deployment; }
fi

# ---- 13. 健康检查 ----
wait_for_app_health

# ---- 14. 清理旧版本 ----
echo -e "${YELLOW}Cleaning old releases...${NC}"
ls -t "${RELEASES_DIR}" 2>/dev/null | tail -n +6 | xargs -I {} rm -rf "${RELEASES_DIR}/{}"

# ---- 完成 ----
DURATION=$(( $(date +%s) - DEPLOY_START ))
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN} Deploy OK  |  ${DEPLOY_ID}  |  ${DURATION}s${NC}"
echo -e "${BLUE}========================================${NC}"
log_deployment "${DEPLOY_ID} OK (${DURATION}s)"
