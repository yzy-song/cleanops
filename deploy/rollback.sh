#!/bin/bash
# =========================================================================
# CleanOps API — 手动回滚到指定版本
# 使用方法: /var/www/cleanops-api/rollback.sh 20240830120000
# =========================================================================
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 无色

# 部署配置
PROJECT_NAME="cleanops-api"
DEPLOY_ROOT="/var/www/${PROJECT_NAME}"
RELEASES_DIR="${DEPLOY_ROOT}/releases"
CURRENT_SYMLINK="${DEPLOY_ROOT}/current"
ECOSYSTEM_CONFIG_FILE="${DEPLOY_ROOT}/ecosystem.config.js"
BACKUPS_DIR="${DEPLOY_ROOT}/backups"
LOG_FILE="${DEPLOY_ROOT}/logs/deployment.log"

# 时间戳
TIMESTAMP=$(date +"%Y%m%d%H%M%S")

# 日志函数
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "${LOG_FILE}"
}

# 验证参数
if [ $# -ne 1 ]; then
    echo -e "${RED}Usage: $0 [version_timestamp]${NC}"
    echo -e "Example: $0 20240830120000${NC}"
    echo -e ""
    echo -e "Available versions:"
    ls -t "${RELEASES_DIR}" 2>/dev/null | while read v; do
        echo -e "  ${CYAN}${v}${NC}"
    done
    exit 1
fi

TARGET_VERSION=$1

# 查找目标版本目录
TARGET_PATH="${RELEASES_DIR}/${TARGET_VERSION}"
if [ ! -d "${TARGET_PATH}" ]; then
    echo -e "${RED}Error: Version ${TARGET_VERSION} not found${NC}"
    echo -e "Available versions: $(ls -t ${RELEASES_DIR} | tr '\n' ' ')"
    exit 1
fi

# 验证目标版本的构建产物存在
if [ ! -d "${TARGET_PATH}/apps/api/dist" ]; then
    echo -e "${RED}Error: Build artifacts not found in ${TARGET_VERSION}/apps/api/dist${NC}"
    echo -e "This version may have failed to build."
    exit 1
fi

# 执行回滚
perform_rollback() {
    log "${YELLOW}Rolling back to version: ${TARGET_VERSION}${NC}"

    # 备份当前版本
    if [ -d "${CURRENT_SYMLINK}" ]; then
        local BACKUP_NAME="${TIMESTAMP}-rollback-backup"
        mkdir -p "${BACKUPS_DIR}"
        tar -czf "${BACKUPS_DIR}/${BACKUP_NAME}.tar.gz" -C "${CURRENT_SYMLINK}" . || {
            echo -e "${YELLOW}⚠ Warning: Backup creation failed but continuing${NC}"
        }
        echo -e "${GREEN}✓ Current version backed up to ${BACKUPS_DIR}/${BACKUP_NAME}.tar.gz${NC}"
    fi

    # 切换符号链接
    ln -nfs "${TARGET_PATH}/apps/api/dist" "${CURRENT_SYMLINK}" || {
        log "${RED}✗ Failed to update symlink${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ Symlink updated to ${TARGET_PATH}/apps/api/dist${NC}"

    # 重启 PM2 服务
    log "${YELLOW}Restarting application via PM2...${NC}"
    pm2 restart "${ECOSYSTEM_CONFIG_FILE}" --env production || {
        log "${RED}✗ Failed to restart PM2${NC}"
        exit 1
    }

    echo -e "${GREEN}✓ Application restarted${NC}"
}

# 清理旧版本 (保留最新 5 个)
cleanup_releases() {
    log "${YELLOW}Cleaning old releases...${NC}"
    ls -t "${RELEASES_DIR}" | tail -n +6 | xargs -I {} rm -rf "${RELEASES_DIR}/{}"
}

# 主流程
main() {
    echo -e "${BLUE}==================================================================${NC}"
    echo -e "${BLUE}  CleanOps API — Manual Rollback${NC}"
    echo -e "${BLUE}==================================================================${NC}"

    log "Starting rollback process to ${TARGET_VERSION}"
    perform_rollback
    cleanup_releases
    log "Rollback completed successfully"
    echo -e "${GREEN}✓ Rollback to ${TARGET_VERSION} succeeded!${NC}"
    echo -e "${YELLOW}Run 'pm2 logs cleanops-api' to monitor the application.${NC}"
}

# 执行主流程
main
