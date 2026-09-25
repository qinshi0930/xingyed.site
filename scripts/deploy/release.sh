#!/usr/bin/env bash
#
# 主站发布 · 第一步（在开发机仓库根目录执行）
#   安装依赖 → 构建 → 校验产物 → 组装构建上下文 → 构建镜像 → 本地冒烟 → 导出镜像包
# 产物落在 release-out/，由 deploy.sh 负责上传。
#
# 用法: bash scripts/deploy/release.sh
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

IMAGE_NAME="localhost/xingyed-site"
SMOKE_NAME="xingyed-smoke"
SMOKE_PORT="${SMOKE_PORT:-3111}"
OUT_DIR="${OUT_DIR:-release-out}"

log() { printf '[release] %s\n' "$*"; }
die() { printf '[release] 失败: %s\n' "$*" >&2; exit 1; }

# 从 apps/app/.env.local 取一个变量并剥掉外层引号。
# podman 的 --env-file / -e 不解析引号，带引号的值会被原样写进环境变量，
# 因此这里统一剥壳后再传。
env_arg() {
	local key="$1" def="${2:-}" val
	val="$(grep -E "^${key}=" "apps/app/.env.local" 2>/dev/null | head -1 | cut -d= -f2- || true)"
	val="${val%\"}"
	val="${val#\"}"
	val="${val%\'}"
	val="${val#\'}"
	[ -n "$val" ] || val="$def"
	printf '%s=%s' "$key" "$val"
}

# ---------- 0. 前置检查 ----------
command -v podman >/dev/null 2>&1 || die "未找到 podman"
if ! command -v bun >/dev/null 2>&1 && [ -s "$HOME/.nvm/nvm.sh" ]; then
	# shellcheck disable=SC1091
	. "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 || true
fi
command -v bun >/dev/null 2>&1 || die "未找到 bun（检查 nvm 是否已初始化）"

SHA="$(git rev-parse --short HEAD)"
if [ -n "$(git status --porcelain)" ]; then
	DIRTY="true"
	TAG="$(date +%Y%m%d%H%M)-${SHA}-dirty"
	log "警告: 工作区存在未提交改动，本次发布标记为 dirty"
else
	DIRTY="false"
	TAG="$(date +%Y%m%d%H%M)-${SHA}"
fi
STAGE="/tmp/xingyed-release-${TAG}"
log "发布标签: $TAG"

# ---------- 1. 构建 ----------
log "1/7 安装依赖"
bun install --frozen-lockfile >/dev/null

log "2/7 构建 Next.js standalone 产物"
# 自托管部署需要展示 ICP 备案号；Vercel 不注入该变量，页脚便不渲染
NEXT_PUBLIC_ICP_BEIAN="${NEXT_PUBLIC_ICP_BEIAN:-赣ICP备2025078961号}" bun run app:build

# ---------- 2. 校验产物 ----------
log "3/7 校验产物结构与符号链接"
STANDALONE="apps/app/.next/standalone"
[ -f "$STANDALONE/apps/app/server.js" ] || die "缺少 $STANDALONE/apps/app/server.js"
[ -d "apps/app/.next/static" ] || die "缺少 apps/app/.next/static"
[ -d "apps/app/public" ] || die "缺少 apps/app/public"
[ -d "apps/app/src/contents" ] || die "缺少 apps/app/src/contents"

# standalone 里的 node_modules 是相对符号链接，必须能在原地解析。
# 历史上打包方式不当（如 tar --transform 改写了链接目标）会让链接失效，
# 镜像构建成功但运行时报 Cannot find module 'next'。
NEXT_PKG="$(readlink -f "$STANDALONE/apps/app/node_modules/next" 2>/dev/null || true)"
if [ -z "$NEXT_PKG" ] || [ ! -f "$NEXT_PKG/package.json" ]; then
	die "standalone 的 next 依赖链接失效，检查构建产物"
fi

# ---------- 3. 组装构建上下文 ----------
log "4/7 组装镜像构建上下文"
rm -rf "$STAGE"
mkdir -p "$STAGE/apps/app/.next" "$STAGE/apps/app/src"
cp -a "$STANDALONE" "apps/app/.next/static" "$STAGE/apps/app/.next/"
cp -a apps/app/public "$STAGE/apps/app/"
cp -a apps/app/src/contents "$STAGE/apps/app/src/"
cp Dockerfile "$STAGE/Dockerfile"
# 构建上下文刻意不放 .dockerignore：避免规则误删 standalone 内部的 node_modules

log "5/7 构建镜像"
podman build -q -t "${IMAGE_NAME}:${TAG}" "$STAGE" >/dev/null || die "镜像构建失败"
IMAGE_ID="$(podman image inspect --format '{{.Id}}' "${IMAGE_NAME}:${TAG}")"
log "     镜像 ${IMAGE_NAME}:${TAG} (${IMAGE_ID:0:12})"

# ---------- 4. 本地冒烟 ----------
log "6/7 本地冒烟（宿主端口 $SMOKE_PORT）"
podman rm -f "$SMOKE_NAME" >/dev/null 2>&1 || true

# DATABASE_URL 只用于模块级非空校验，冒烟阶段不会真正建连；
# REDIS_URL 指向本地 redis，用于顺带验证博客缓存链路。
SMOKE_ENV_ARGS=(
	-e "$(env_arg DATABASE_URL 'postgresql://smoke:smoke@127.0.0.1:5432/smoke')"
	-e "$(env_arg REDIS_URL '')"
	-e "$(env_arg BETTER_AUTH_SECRET 'smoke-local-only')"
	-e "$(env_arg BETTER_AUTH_URL "http://localhost:${SMOKE_PORT}")"
)

podman run -d --name "$SMOKE_NAME" --network=host \
	"${SMOKE_ENV_ARGS[@]}" \
	-e NODE_ENV=production \
	-e PORT="$SMOKE_PORT" \
	-e HOSTNAME=0.0.0.0 \
	"${IMAGE_NAME}:${TAG}" >/dev/null

smoke_ok=0
for _ in $(seq 1 30); do
	code="$(curl -s -m 5 -o /dev/null -w '%{http_code}' "http://127.0.0.1:${SMOKE_PORT}/api/health" || true)"
	if [ "$code" = "200" ]; then
		smoke_ok=1
		break
	fi
	# 容器已退出就没必要继续等
	running="$(podman inspect --format '{{.State.Running}}' "$SMOKE_NAME" 2>/dev/null || echo false)"
	[ "$running" = "true" ] || break
	sleep 1
done

if [ "$smoke_ok" != "1" ]; then
	echo "----- 冒烟容器日志 -----"
	podman logs "$SMOKE_NAME" 2>&1 | tail -30 || true
	podman rm -f "$SMOKE_NAME" >/dev/null 2>&1 || true
	die "本地冒烟未通过，已放弃本次发布"
fi

blog_code="$(curl -s -m 20 -o /dev/null -w '%{http_code}' "http://127.0.0.1:${SMOKE_PORT}/api/blog" || true)"
log "     冒烟结果 /api/health -> 200, /api/blog -> ${blog_code}（博客依赖 Redis，非阻塞项）"
podman rm -f "$SMOKE_NAME" >/dev/null 2>&1 || true

# ---------- 5. 导出 ----------
log "7/7 导出镜像包"
mkdir -p "$OUT_DIR"
TARBALL="$OUT_DIR/xingyed-site-${TAG}.tar.gz"
rm -f "$TARBALL"
podman save --format docker-archive "${IMAGE_NAME}:${TAG}" | gzip -1 >"$TARBALL"
[ -s "$TARBALL" ] || die "镜像导出失败"
TARBALL_SHA="$(sha256sum "$TARBALL" | cut -d' ' -f1)"
TARBALL_BYTES="$(stat -c %s "$TARBALL")"

cat >"$OUT_DIR/manifest.json" <<-EOF
	{
	  "tag": "$TAG",
	  "imageId": "$IMAGE_ID",
	  "commit": "$SHA",
	  "dirty": $DIRTY,
	  "builtAt": "$(date -Iseconds)",
	  "tarball": "$(basename "$TARBALL")",
	  "tarballSha256": "$TARBALL_SHA",
	  "tarballBytes": $TARBALL_BYTES
	}
EOF

printf '%s' "$TAG" >"$OUT_DIR/.last-tag"
printf '%s' "$TARBALL" >"$OUT_DIR/.last-artifact"

log "完成"
printf '[release]   标签    : %s\n' "$TAG"
printf '[release]   镜像包  : %s (%s MB)\n' "$TARBALL" "$((TARBALL_BYTES / 1024 / 1024))"
printf '[release]   sha256  : %s\n' "$TARBALL_SHA"
printf '[release]   下一步  : bash scripts/deploy/deploy.sh --skip-build\n'
