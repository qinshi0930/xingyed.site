#!/bin/bash

# 日志清理脚本
# 用于清理过期的部署日志文件

set -e

# 配置
LOG_DIR="/var/log/webhook"
RETENTION_DAYS=30  # 保留最近 30 天的日志
DRY_RUN=false      # 默认不执行实际删除（预览模式）

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --days)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        --execute)
            DRY_RUN=false
            shift
            ;;
        --help)
            echo "用法: $0 [选项]"
            echo ""
            echo "选项:"
            echo "  --days <天数>    设置保留天数（默认: 30）"
            echo "  --execute        执行实际删除（默认: 预览模式）"
            echo "  --help           显示此帮助信息"
            echo ""
            echo "示例:"
            echo "  $0                          # 预览将删除 30 天前的日志"
            echo "  $0 --days 7                 # 预览将删除 7 天前的日志"
            echo "  $0 --days 30 --execute      # 实际删除 30 天前的日志"
            exit 0
            ;;
        *)
            echo "未知参数: $1"
            echo "使用 --help 查看帮助"
            exit 1
            ;;
    esac
done

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 检查日志目录
if [ ! -d "$LOG_DIR" ]; then
    log "❌ 日志目录不存在: $LOG_DIR"
    exit 1
fi

log "========================================="
log "🧹 日志清理脚本"
log "========================================="
log "📁 日志目录: $LOG_DIR"
log "📅 保留天数: $RETENTION_DAYS 天"
log "🔍 运行模式: $([ "$DRY_RUN" = true ] && echo '预览模式' || echo '执行模式')"
log "========================================="

# 查找过期日志文件
EXPIRED_FILES=$(find "$LOG_DIR" -name "deploy-*.log" -type f -mtime +$RETENTION_DAYS 2>/dev/null)

if [ -z "$EXPIRED_FILES" ]; then
    log "✅ 没有发现过期的日志文件"
    exit 0
fi

# 统计信息
TOTAL_FILES=$(echo "$EXPIRED_FILES" | wc -l)
TOTAL_SIZE=$(echo "$EXPIRED_FILES" | xargs du -ch 2>/dev/null | tail -1 | awk '{print $1}')

log "📊 发现 $TOTAL_FILES 个过期日志文件"
log "💾 总大小: $TOTAL_SIZE"
log "========================================="

# 显示过期文件列表
log "📋 过期文件列表:"
echo "$EXPIRED_FILES" | while read -r file; do
    file_date=$(stat -c '%y' "$file" 2>/dev/null | cut -d' ' -f1)
    file_size=$(du -h "$file" 2>/dev/null | awk '{print $1}')
    file_name=$(basename "$file")
    log "  - $file_name ($file_size, $file_date)"
done

log "========================================="

# 预览模式
if [ "$DRY_RUN" = true ]; then
    log "⚠️  这是预览模式，文件未被删除"
    log "💡 使用 --execute 参数执行实际删除"
    log "========================================="
    exit 0
fi

# 执行删除
log "🗑️  开始删除过期日志..."
DELETED_COUNT=0
FAILED_COUNT=0

echo "$EXPIRED_FILES" | while read -r file; do
    if rm -f "$file"; then
        log "✅ 已删除: $(basename "$file")"
        DELETED_COUNT=$((DELETED_COUNT + 1))
    else
        log "❌ 删除失败: $(basename "$file")"
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
done

log "========================================="
log "📊 清理完成统计"
log "========================================="
log "✅ 成功删除: $DELETED_COUNT 个文件"
log "❌ 删除失败: $FAILED_COUNT 个文件"
log "========================================="

# 显示剩余日志
REMAINING_FILES=$(find "$LOG_DIR" -name "deploy-*.log" -type f 2>/dev/null | wc -l)
REMAINING_SIZE=$(find "$LOG_DIR" -name "deploy-*.log" -type f -exec du -ch {} + 2>/dev/null | tail -1 | awk '{print $1}')

log "📁 剩余日志: $REMAINING_FILES 个文件"
log "💾 剩余大小: $REMAINING_SIZE"
log "========================================="

