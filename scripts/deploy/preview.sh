#!/usr/bin/env bash
#
# 主站分支预览（在开发机仓库根目录执行）
#   把当前检出构建成镜像，部署到生产机的 3200 端口，供 review 分支版本。
#   预览使用独立数据库与 Redis 1 号库，不影响线上数据与缓存。
#
# 用法:
#   bash scripts/deploy/preview.sh              # 构建当前分支并发布预览
#   bash scripts/deploy/preview.sh --skip-build # 复用上次构建产物
#   bash scripts/deploy/preview.sh --down       # 下线预览
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

REMOTE_HOST="${REMOTE_HOST:-aliyun-prod-deploy}"
REMOTE_DIR="/opt/apps/xingyed-site/incoming"
OUT_DIR="${OUT_DIR:-release-out}"
PREVIEW_URL="${PREVIEW_URL:-https://preview.xingyed.xyz}"

log() { printf '[preview] %s\n' "$*"; }
die() { printf '[preview] 失败: %s\n' "$*" >&2; exit 1; }

if [ "${1:-}" = "--down" ]; then
	log "下线生产机上的预览服务"
	ssh -o ConnectTimeout=15 "$REMOTE_HOST" "bash -s -- down" < scripts/deploy/preview-remote.sh
	exit 0
fi

if [ "${1:-}" = "--skip-build" ]; then
	log "跳过构建，复用 $OUT_DIR 中上一次的产物"
else
	log "执行构建（当前分支：$(git rev-parse --abbrev-ref HEAD) @ $(git rev-parse --short HEAD)）"
	bash scripts/deploy/release.sh
fi

[ -f "$OUT_DIR/.last-tag" ] || die "缺少 $OUT_DIR/.last-tag，请先执行 release.sh"
[ -f "$OUT_DIR/.last-artifact" ] || die "缺少 $OUT_DIR/.last-artifact，请先执行 release.sh"
TAG="$(cat "$OUT_DIR/.last-tag")"
TARBALL="$(cat "$OUT_DIR/.last-artifact")"
[ -f "$TARBALL" ] || die "找不到镜像包 $TARBALL"

log "上传 $TAG 到 $REMOTE_HOST"
ssh -o ConnectTimeout=15 "$REMOTE_HOST" "mkdir -p '$REMOTE_DIR'"
scp -q "$TARBALL" "$REMOTE_HOST:$REMOTE_DIR/"
scp -q scripts/deploy/preview-remote.sh "$REMOTE_HOST:$REMOTE_DIR/"

log "远程切换预览镜像"
ssh -o ConnectTimeout=15 "$REMOTE_HOST" \
	"bash $REMOTE_DIR/preview-remote.sh up '$REMOTE_DIR/$(basename "$TARBALL")' '$TAG'"

log "完成：$PREVIEW_URL"
