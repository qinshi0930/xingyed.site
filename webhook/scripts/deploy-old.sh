#!/bin/bash

# GitHub Webhook 部署脚本
# 由 Adnanh Webhook 触发执行

# 配置
PROJECT_DIR="/home/youruser/xingyed.site"
LOG_DIR="/var/log/webhook"
LOG_FILE="${LOG_DIR}/deploy-$(date '+%Y-%m-%d-%H%M%S').log"
COMMIT_MESSAGE="${1:-Unknown}"

# 创建日志目录
mkdir -p "$LOG_DIR"

# 日志函数
log() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$message" | tee -a "$LOG_FILE"
}

# 错误处理函数
error_exit() {
    log "========================================="
    log "❌ Deployment failed!"
    log "========================================="
    log "Error: $1"
    log "========================================="
    log "📝 详细日志: $LOG_FILE"
    log "📁 查看所有日志: ls -lh $LOG_DIR/"
    log "🔍 查看日志: tail -f $LOG_FILE"
    log "========================================="
    exit 1
}

# 捕获错误信号
trap 'error_exit "Script interrupted"' INT TERM
trap 'error_exit "Command failed at line $LINENO"' ERR

# 显示日志位置提示
echo "========================================="
echo "📝 日志文件: $LOG_FILE"
echo "📁 日志目录: $LOG_DIR"
echo "🔍 查看日志: tail -f $LOG_FILE"
echo "📋 所有日志: ls -lh $LOG_DIR/"
echo "========================================="

# 开始部署
log "========================================="
log "Deployment triggered"
log "Commit: $COMMIT_MESSAGE"
log "========================================="

# 进入项目目录
if [ ! -d "$PROJECT_DIR" ]; then
    error_exit "Project directory not found: $PROJECT_DIR"
fi
cd "$PROJECT_DIR"

# 1. 拉取最新代码
log "Step 1: Pulling latest code..."
if ! git pull origin main 2>&1 | tee -a "$LOG_FILE"; then
    error_exit "Failed to pull latest code"
fi

# 2. 停止旧容器
log "Step 2: Stopping old containers..."
if ! podman-compose down 2>&1 | tee -a "$LOG_FILE"; then
    log "⚠️  Warning: Failed to stop containers (may not be running)"
fi

# 3. 清理旧镜像
log "Step 3: Cleaning up old images..."
podman-compose rm -f 2>&1 | tee -a "$LOG_FILE"
if ! podman image prune -f 2>&1 | tee -a "$LOG_FILE"; then
    log "⚠️  Warning: Failed to prune images"
fi

# 4. 构建并启动新容器
log "Step 4: Building and starting new containers..."
if ! podman-compose up -d --build 2>&1 | tee -a "$LOG_FILE"; then
    error_exit "Failed to build or start containers"
fi

# 5. 等待服务启动
log "Step 5: Waiting for services to start..."
sleep 10

# 6. 健康检查
log "Step 6: Running health check..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
        log "✅ Health check passed!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    log "⏳ Health check retry $RETRY_COUNT/$MAX_RETRIES..."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    error_exit "Health check failed after $MAX_RETRIES retries. Check container logs for details."
fi

# 7. 显示最终状态
log "========================================="
log "✅ Deployment completed successfully!"
log "========================================="
log "Container status:"
podman-compose ps 2>&1 | tee -a "$LOG_FILE"

log "Recent logs:"
podman-compose logs --tail=20 2>&1 | tee -a "$LOG_FILE"

log "========================================="
log "📝 部署日志已保存: $LOG_FILE"
log "📁 查看所有日志: ls -lh $LOG_DIR/"
log "🔍 实时查看: tail -f $LOG_FILE"
log "========================================="
