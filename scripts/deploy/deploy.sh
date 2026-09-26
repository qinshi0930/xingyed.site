#!/usr/bin/env bash
#
# 主站一键发布（在开发机仓库根目录执行）
#   release.sh 构建并导出镜像 → 上传到生产机 → promote.sh 切换并巡检
#
# 用法:
#   bash scripts/deploy/deploy.sh              # 完整流程
#   bash scripts/deploy/deploy.sh --skip-build # 复用上次构建产物重新发布
#   REMOTE_HOST=other bash scripts/deploy/deploy.sh
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

REMOTE_HOST="${REMOTE_HOST:-aliyun-prod-deploy}"
REMOTE_DIR="/opt/apps/xingyed-site/incoming"
OUT_DIR="${OUT_DIR:-release-out}"

log() { printf '[deploy] %s\n' "$*"; }
die() { printf '[deploy] 失败: %s\n' "$*" >&2; exit 1; }

if [ "${1:-}" = "--skip-build" ]; then
	log "跳过构建，复用 $OUT_DIR 中上一次的产物"
else
	log "执行构建阶段"
	bash scripts/deploy/release.sh
fi

[ -f "$OUT_DIR/.last-tag" ] || die "$OUT_DIR/.last-tag 不存在，请先执行 release.sh"
[ -f "$OUT_DIR/.last-artifact" ] || die "$OUT_DIR/.last-artifact 不存在，请先执行 release.sh"

TAG="$(cat "$OUT_DIR/.last-tag")"
TARBALL="$(cat "$OUT_DIR/.last-artifact")"
MANIFEST="$OUT_DIR/manifest.json"
COMMIT="$(sed -n 's/.*"commit": *"\([^"]*\)".*/\1/p' "$MANIFEST" | head -1)"
[ -f "$TARBALL" ] || die "找不到镜像包 $TARBALL"

log "标签 $TAG (commit ${COMMIT:-unknown})"
log "1/3 上传镜像包到 $REMOTE_HOST:$REMOTE_DIR"
ssh -o ConnectTimeout=15 "$REMOTE_HOST" "mkdir -p '$REMOTE_DIR'"
scp -q "$TARBALL" "$MANIFEST" "$REMOTE_HOST:$REMOTE_DIR/"
scp -q scripts/deploy/promote.sh "$REMOTE_HOST:$REMOTE_DIR/promote.sh"

log "2/3 远程切换与巡检"
ssh -o ConnectTimeout=15 "$REMOTE_HOST" \
	bash "$REMOTE_DIR/promote.sh" "$REMOTE_DIR/$(basename "$TARBALL")" "$TAG" "${COMMIT:-unknown}"

log "3/3 公网验证"
for url in https://xingyed.xyz/api/health https://xingyed.xyz/api/guestbook https://xingyed.xyz/; do
	code="$(curl -s -m 20 -o /dev/null -w '%{http_code}' "$url" || true)"
	printf '[deploy]   %-42s -> %s\n' "$url" "$code"
done

log "完成: $TAG"
