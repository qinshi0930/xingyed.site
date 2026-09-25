#!/usr/bin/env bash
#
# 主站发布 · 第二步（在生产机以 deploy 身份执行，通常由 deploy.sh 远程调用）
#   导入镜像 → 候选容器验证 → 切换 :current → 重启单元 → 线上巡检 → 失败自动回滚
#
# 用法: bash promote.sh <镜像包路径> <tag> [<commit>]
#
set -euo pipefail

APP_DIR="/opt/apps/xingyed-site"
IMAGE_NAME="localhost/xingyed-site"
ENV_FILE="$APP_DIR/.env.production"
UNIT="xingyed-site.service"
CANARY_NAME="xingyed-canary"
CANARY_PORT="${CANARY_PORT:-3111}"
LOG_FILE="$APP_DIR/RELEASES.log"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

TARBALL="${1:?用法: promote.sh <镜像包路径> <tag> [<commit>]}"
TAG="${2:?用法: promote.sh <镜像包路径> <tag> [<commit>]}"
COMMIT="${3:-unknown}"

log() { printf '[promote] %s\n' "$*"; }
die() { printf '[promote] 失败: %s\n' "$*" >&2; exit 1; }

[ -f "$TARBALL" ] || die "找不到镜像包 $TARBALL"
[ -f "$ENV_FILE" ] || die "找不到环境文件 $ENV_FILE"

# ---------- 1. 导入镜像 ----------
PREV_IMAGE_ID="$(podman image inspect --format '{{.Id}}' "$IMAGE_NAME:current" 2>/dev/null || true)"
log "当前线上镜像: ${PREV_IMAGE_ID:0:12}"

log "1/5 导入镜像包"
gunzip -c "$TARBALL" | podman load >/dev/null
podman image exists "$IMAGE_NAME:$TAG" || die "导入完成但找不到 $IMAGE_NAME:$TAG"
NEW_IMAGE_ID="$(podman image inspect --format '{{.Id}}' "$IMAGE_NAME:$TAG")"
log "     待发布镜像: ${NEW_IMAGE_ID:0:12}"

# ---------- 2. 候选容器验证（不影响线上） ----------
log "2/5 候选容器验证（宿主端口 $CANARY_PORT）"
podman rm -f "$CANARY_NAME" >/dev/null 2>&1 || true
podman run -d --name "$CANARY_NAME" --network=host \
	--env-file "$ENV_FILE" \
	-e NODE_ENV=production \
	-e PORT="$CANARY_PORT" \
	-e HOSTNAME=0.0.0.0 \
	"$IMAGE_NAME:$TAG" >/dev/null

canary_ok=0
for _ in $(seq 1 30); do
	code="$(curl -s -m 5 -o /dev/null -w '%{http_code}' "http://127.0.0.1:${CANARY_PORT}/api/health" || true)"
	if [ "$code" = "200" ]; then
		canary_ok=1
		break
	fi
	running="$(podman inspect --format '{{.State.Running}}' "$CANARY_NAME" 2>/dev/null || echo false)"
	[ "$running" = "true" ] || break
	sleep 2
done

if [ "$canary_ok" != "1" ]; then
	echo "----- 候选容器日志 -----"
	podman logs "$CANARY_NAME" 2>&1 | tail -30 || true
	podman rm -f "$CANARY_NAME" >/dev/null 2>&1 || true
	die "候选容器未通过健康检查，线上未做任何改动"
fi

for p in /api/health /api/blog /api/guestbook; do
	code="$(curl -s -m 25 -o /dev/null -w '%{http_code}' "http://127.0.0.1:${CANARY_PORT}${p}" || true)"
	log "     ${p} -> ${code}"
done
podman rm -f "$CANARY_NAME" >/dev/null 2>&1 || true

# ---------- 3. 切换 ----------
log "3/5 切换 :current 并重启 $UNIT"
podman tag "$IMAGE_NAME:$TAG" "$IMAGE_NAME:current"
systemctl --user reset-failed "$UNIT" >/dev/null 2>&1 || true
systemctl --user restart "$UNIT"

# ---------- 4. 线上巡检 ----------
log "4/5 线上巡检"
live_ok=0
for _ in $(seq 1 30); do
	code="$(curl -s -m 5 -o /dev/null -w '%{http_code}' "http://127.0.0.1:3000/api/health" || true)"
	if [ "$code" = "200" ]; then
		live_ok=1
		break
	fi
	sleep 2
done

if [ "$live_ok" != "1" ]; then
	curl -s -m 5 -o /dev/null -w '[promote] 巡检失败，/api/health -> %{http_code}\n' "http://127.0.0.1:3000/api/health" || true
	journalctl --user -u "$UNIT" --since "-3min" --no-pager 2>/dev/null | tail -25 || true
	if [ -n "$PREV_IMAGE_ID" ]; then
		log "回滚到 ${PREV_IMAGE_ID:0:12}"
		podman tag "$PREV_IMAGE_ID" "$IMAGE_NAME:current"
		systemctl --user restart "$UNIT"
		sleep 6
		code="$(curl -s -m 5 -o /dev/null -w '%{http_code}' "http://127.0.0.1:3000/api/health" || true)"
		log "回滚后 /api/health -> $code"
	fi
	die "发布失败（已回滚）"
fi

guest_code="$(curl -s -m 25 -o /dev/null -w '%{http_code}' "http://127.0.0.1:3000/api/guestbook" || true)"
log "     线上 /api/health -> 200, /api/guestbook -> ${guest_code}"

# ---------- 5. 记录与清理 ----------
log "5/5 记录发布并清理旧版本"
printf '%s\ttag=%s\tcommit=%s\timage=%s\tprev=%s\n' \
	"$(date -Iseconds)" "$TAG" "$COMMIT" "${NEW_IMAGE_ID:0:12}" "${PREV_IMAGE_ID:0:12}" >>"$LOG_FILE"

mapfile -t old_tags < <(podman images --format '{{.Tag}}' --filter "reference=${IMAGE_NAME}" 2>/dev/null \
	| grep -E '^[0-9]{12}-' | sort | head -n "-${KEEP_RELEASES}" || true)
for t in "${old_tags[@]:-}"; do
	[ -n "$t" ] || continue
	podman rmi "$IMAGE_NAME:$t" >/dev/null 2>&1 && log "     已清理旧镜像 $t" || true
done

rm -f "$TARBALL"
log "发布完成: $TAG"
