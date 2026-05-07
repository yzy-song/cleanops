#!/bin/bash
# CleanOps API 自动化部署脚本
# 适用: pnpm monorepo (NestJS + Prisma)，GitHub Actions 通过 SSH 触发
#
# 服务器初始化:
#   git clone https://github.com/yzy-song/cleanops.git /var/www/cleanops-api/repo
#   mkdir -p /var/www/cleanops-api/{releases,backups,logs}
#   创建 /var/www/cleanops-api/.env
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================ 配置 ============================

PROJECT_NAME="cleanops-api"
DEPLOY_ROOT="/var/www/${PROJECT_NAME}"
REPO_DIR="${DEPLOY_ROOT}/repo"
RELEASES_DIR="${DEPLOY_ROOT}/releases"
CURRENT_SYMLINK="${DEPLOY_ROOT}/current"
ENV_FILE="${DEPLOY_ROOT}/.env"
ECOSYSTEM_CONFIG_FILE="${DEPLOY_ROOT}/ecosystem.config.js"
BACKUPS_DIR="${DEPLOY_ROOT}/backups"
LOGS_DIR="${DEPLOY_ROOT}/logs"

PNPM_VERSION="10"
DB_CHECK_TIMEOUT=60
DEPLOY_TIMEOUT=900

# 自动检测 web 用户（宝塔 CentOS 用 www，Ubuntu/Debian 用 www-data）
if id www-data &>/dev/null; then
    APP_USER="www-data"
    APP_GROUP="www-data"
elif id www &>/dev/null; then
    APP_USER="www"
    APP_GROUP="www"
else
    APP_USER=""
    APP_GROUP=""
fi

# 确保 PM2 / pnpm 可找到（宝塔 Node.js 管理器路径）
export PATH="${PATH}:/www/server/nodejs/current/bin:/usr/local/bin:${HOME}/.local/bin"

# ============================ 工具函数 ============================

log_deployment() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "${LOGS_DIR}/deployment.log"
}

log_error() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - FAILED: $1" >> "${LOGS_DIR}/deployment.log"
}

validate_environment() {
    local required_vars="DATABASE_URL JWT_SECRET"
    local missing=""

    for var in $required_vars; do
        if [ -z "${!var}" ]; then
            missing="$missing $var"
        fi
    done

    if [ -n "$missing" ]; then
        echo -e "${RED}Missing required env vars: $missing${NC}"
        log_error "missing_env_vars"
        rollback_deployment
        exit 1
    fi
}

rollback_deployment() {
    echo -e "${RED}=== Rolling back... ===${NC}"

    # 排除当前（失败的）发布目录，找上一个成功的版本
    local LAST_SUCCESSFUL
    if [ -n "${RELEASE_NAME}" ]; then
        LAST_SUCCESSFUL=$(find "${RELEASES_DIR}" -maxdepth 1 -type d ! -name "${RELEASE_NAME}" -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -n 1 | awk '{print $2}')
    else
        LAST_SUCCESSFUL=$(find "${RELEASES_DIR}" -maxdepth 1 -type d -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -n 1 | awk '{print $2}')
    fi

    if [ -z "$LAST_SUCCESSFUL" ]; then
        echo -e "${RED}No previous deployment to roll back to${NC}"
        exit 1
    fi

    echo -e "${YELLOW}Switching to: ${LAST_SUCCESSFUL}${NC}"
    ln -nfs "${LAST_SUCCESSFUL}/apps/api/dist" "${CURRENT_SYMLINK}"

    if command -v pm2 &>/dev/null; then
        pm2 restart "${ECOSYSTEM_CONFIG_FILE}" --env production 2>/dev/null || true
    fi

    # 删除失败的发布目录
    if [ -n "${RELEASE_PATH}" ] && [ -d "${RELEASE_PATH}" ]; then
        rm -rf "${RELEASE_PATH}"
    fi

    echo -e "${GREEN}Rollback done${NC}"
    exit 1
}

backup_current_version() {
    if [ -d "${CURRENT_SYMLINK}" ]; then
        echo -e "${YELLOW}Backing up current version...${NC}"
        local BACKUP_NAME="${TIMESTAMP}-before-${DEPLOY_ID}"
        tar -czf "${BACKUPS_DIR}/${BACKUP_NAME}.tar.gz" -C "${CURRENT_SYMLINK}" . 2>/dev/null || {
            echo -e "${YELLOW}Warning: Backup failed, continuing${NC}"
        }
    fi
}

check_db_connection() {
    echo -e "${YELLOW}Checking database connection...${NC}"

    local DB_CHECK_SCRIPT="
        var PrismaClient = require('${RELEASE_PATH}/node_modules/@prisma/client').PrismaClient;
        var prisma = new PrismaClient({
            datasources: { db: { url: process.env.DATABASE_URL } },
        });
        prisma.\$connect()
            .then(function() { console.log('OK'); process.exit(0); })
            .catch(function(err) { console.error(err.message); process.exit(1); });
    "

    if timeout ${DB_CHECK_TIMEOUT} node -e "${DB_CHECK_SCRIPT}"; then
        echo -e "${GREEN}Database OK${NC}"
        return 0
    else
        echo -e "${RED}Database connection failed — check DATABASE_URL${NC}"
        return 1
    fi
}

wait_for_app_health() {
    local port="${PORT:-3000}"
    local max_attempts=$((DEPLOY_TIMEOUT / 5))
    local attempt=0

    echo -e "${YELLOW}Health check (port ${port})...${NC}"

    while [ $attempt -lt $max_attempts ]; do
        ((attempt++))
        if curl -sf "http://127.0.0.1:${port}/api-docs" >/dev/null 2>&1; then
            echo -e "${GREEN}Healthy after ${attempt} attempts${NC}"
            return 0
        fi
        echo -e "${YELLOW}  ${attempt}/${max_attempts} waiting...${NC}"
        sleep 5
    done

    echo -e "${RED}App did not become healthy${NC}"
    log_error "health_check_failed"
    rollback_deployment
    exit 1
}

# ============================ 主流程 ============================

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN} CleanOps API Deploy — $(date)${NC}"
echo -e "${BLUE}========================================${NC}"

if [ ! -d "${REPO_DIR}" ]; then
    echo -e "${RED}Repo not found: ${REPO_DIR}${NC}"
    echo -e "Run: git clone https://github.com/yzy-song/cleanops.git ${REPO_DIR}"
    exit 1
fi

DEPLOY_START_TIME=$(date +%s)

# ---- 1. 拉取最新代码 ----
echo -e "${YELLOW}git fetch...${NC}"
git -C "${REPO_DIR}" fetch origin main 2>&1

# ---- 2. 判断是否需要部署 ----
BEFORE=$(git -C "${REPO_DIR}" rev-parse HEAD)
AFTER=$(git -C "${REPO_DIR}" rev-parse origin/main)

if [ "$BEFORE" = "$AFTER" ]; then
    echo -e "${GREEN}No new commits, skip${NC}"
    exit 0
fi

CHANGED_FILES=$(git -C "${REPO_DIR}" diff --name-only ${BEFORE} ${AFTER})
if ! echo "$CHANGED_FILES" | grep -qE '^apps/api/|^packages/db/|^pnpm-lock\.yaml|^package\.json|^pnpm-workspace\.yaml|^turbo\.json'; then
    echo -e "${GREEN}No backend changes, skip${NC}"
    echo "Changed: $(echo "$CHANGED_FILES" | tr '\n' ' ')"
    git -C "${REPO_DIR}" merge --ff-only origin/main
    exit 0
fi

echo -e "${YELLOW}Backend changes detected:${NC}"
echo "$CHANGED_FILES" | grep -E '^apps/api/|^packages/db/|^pnpm-lock\.yaml|^package\.json|^pnpm-workspace\.yaml|^turbo\.json' || true

git -C "${REPO_DIR}" merge --ff-only origin/main
DEPLOY_ID=$(git -C "${REPO_DIR}" rev-parse --short HEAD)
TIMESTAMP=$(date +"%Y%m%d%H%M%S")

# ---- 3. 准备发布目录 ----
mkdir -p "${RELEASES_DIR}" "${BACKUPS_DIR}" "${LOGS_DIR}"

RELEASE_NAME="${TIMESTAMP}-${DEPLOY_ID}"
RELEASE_PATH="${RELEASES_DIR}/${RELEASE_NAME}"

echo -e "${YELLOW}Release: ${RELEASE_NAME}${NC}"
mkdir -p "${RELEASE_PATH}"
git -C "${REPO_DIR}" archive --format=tar HEAD | tar -xf - -C "${RELEASE_PATH}"

cd "${RELEASE_PATH}"

# ---- 4. 环境变量 ----
if [ -f "${ENV_FILE}" ]; then
    cp "${ENV_FILE}" apps/api/.env
    cp "${ENV_FILE}" packages/db/.env
    echo -e "${GREEN}.env -> apps/api/ & packages/db/${NC}"

    set -a
    source "${ENV_FILE}"
    set +a
    validate_environment
else
    echo -e "${YELLOW}Warning: .env not found at ${ENV_FILE}${NC}"
fi

# ---- 5. pnpm ----
if ! command -v pnpm &>/dev/null; then
    echo -e "${YELLOW}Installing pnpm@${PNPM_VERSION}...${NC}"
    npm install -g pnpm@${PNPM_VERSION}
fi

# ---- 6. 安装依赖 ----
echo -e "${YELLOW}pnpm install...${NC}"
pnpm install --frozen-lockfile || {
    log_error "install_failed"
    rollback_deployment
    exit 1
}

# ---- 7. Prisma ----
echo -e "${YELLOW}prisma generate...${NC}"
pnpm --filter @cleanops/db exec prisma generate || {
    log_error "prisma_failed"
    rollback_deployment
    exit 1
}

# ---- 8. 数据库检查 ----
if [ -f "${ENV_FILE}" ]; then
    check_db_connection || {
        log_error "db_failed"
        rollback_deployment
        exit 1
    }
fi

# ---- 9. 构建 ----
echo -e "${YELLOW}nest build...${NC}"
pnpm --filter @cleanops/api build || {
    log_error "build_failed"
    rollback_deployment
    exit 1
}

# ---- 10. 切换版本 ----
echo -e "${YELLOW}Updating symlink...${NC}"
ln -nfs "${RELEASE_PATH}/apps/api/dist" "${CURRENT_SYMLINK}"

# ---- 11. PM2 配置 ----
if [ -f "./deploy/ecosystem.config.js" ]; then
    cp "./deploy/ecosystem.config.js" "${ECOSYSTEM_CONFIG_FILE}"
fi

# ---- 12. 权限 ----
if [ -n "${APP_USER}" ]; then
    chown -R ${APP_USER}:${APP_GROUP} "${DEPLOY_ROOT}" 2>/dev/null || true
fi
chmod -R u=rwX,g=rX,o=rX "${DEPLOY_ROOT}" 2>/dev/null || true

# ---- 13. 备份旧版本 ----
backup_current_version

# ---- 14. 启动/重启 ----
echo -e "${YELLOW}PM2 restart...${NC}"
if pm2 list 2>/dev/null | grep -q "${PROJECT_NAME}"; then
    pm2 restart "${ECOSYSTEM_CONFIG_FILE}" --env production --wait-ready 30 || {
        log_error "pm2_restart_failed"
        rollback_deployment
        exit 1
    }
else
    pm2 start "${ECOSYSTEM_CONFIG_FILE}" --env production --wait-ready 30 || {
        log_error "pm2_start_failed"
        rollback_deployment
        exit 1
    }
fi

# ---- 15. 健康检查 ----
wait_for_app_health

# ---- 16. 清理旧版本 ----
echo -e "${YELLOW}Cleaning old releases...${NC}"
ls -t "${RELEASES_DIR}" 2>/dev/null | tail -n +6 | xargs -I {} rm -rf "${RELEASES_DIR}/{}"

# ---- 17. 完成 ----
DURATION=$(( $(date +%s) - DEPLOY_START_TIME ))
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Deploy OK  |  ${DEPLOY_ID}  |  ${DURATION}s${NC}"
echo -e "${BLUE}========================================${NC}"

log_deployment "${DEPLOY_ID} OK (${DURATION}s)"
