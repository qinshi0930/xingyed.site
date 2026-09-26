#!/usr/bin/env bash
#
# 主站分支预览 · 生产侧（由 preview.sh 通过 ssh 调用）
#   bash preview-remote.sh up <镜像包路径> <tag>   发布/更新预览
#   bash preview-remote.sh down                    下线预览
#
set -euo pipefail

ACTION="${1:-up}"
TARBALL="${2:-}"
TAG="${3:-}"

IMAGE="localhost/xingyed-site"
UNIT="xingyed-site-preview.service"
PORT=3200

log() { printf '[preview] %s\n' "$*"; }
die() { printf '[preview] 失败: %s\n' "$*" >&2; exit 1; }

if [ "$ACTION" = "down" ]; then
	log "1/2 停止预览服务"
	systemctl --user stop "$UNIT" >/dev/null 2>&1 || true
	log "2/2 删除 :preview 镜像"
	podman rmi "$IMAGE:preview" >/dev/null 2>&1 || true
	log "预览已下线（.env.preview 与单元文件保留，可随时再发布）"
	exit 0
fi

[ -n "$TARBALL" ] || die "缺少镜像包路径"
[ -n "$TAG" ] || die "缺少 tag"
[ -f "$TARBALL" ] || die "找不到镜像包 $TARBALL"

log "1/4 导入镜像"
gunzip -c "$TARBALL" | podman load >/dev/null
podman image exists "$IMAGE:$TAG" || die "导入后找不到 $IMAGE:$TAG"
podman tag "$IMAGE:$TAG" "$IMAGE:preview"
log "     :preview -> $(podman image inspect --format '{{.Id}}' "$IMAGE:$TAG" | cut -c1-12)"

log "2/4 重启预览服务"
systemctl --user restart "$UNIT"

log "3/4 预览巡检（宿主端口 $PORT）"
ready=0
for _ in $(seq 1 30); do
	code="$(curl -s -m 5 -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/api/health" || true)"
	if [ "$code" = "200" ]; then
		ready=1
		break
	fi
	sleep 2
done
if [ "$ready" != "1" ]; then
	journalctl --user -u "$UNIT" --since "-3min" --no-pager 2>/dev/null | tail -20 || true
	die "预览服务未就绪"
fi
for p in /api/health /api/blog /api/guestbook; do
	printf '     %-18s -> %s\n' "$p" "$(curl -s -m 25 -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT$p")"
done

log "4/4 确认线上未受影响"
prod_health="$(curl -s -m 10 -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/api/health)"
printf '     线上 3000 /api/health -> %s\n' "$prod_health"
[ "$prod_health" = "200" ] || die "线上健康检查异常，请立即检查 3000 端口"

rm -f "$TARBALL"
log "预览已更新: $TAG"
