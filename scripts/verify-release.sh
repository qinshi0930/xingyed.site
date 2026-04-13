#!/bin/bash
set -e

echo "========================================="
echo "Release 产物验证脚本"
echo "========================================="

RELEASE_ZIP="/tmp/xingyed-site-v0.1.0-test-ci-cd.zip"
TEST_CONTAINER="xingyed-test-release"

# 步骤 1: 检查 ZIP 文件
echo ""
echo "[1/7] 检查 Release ZIP 文件..."
if [ ! -f "$RELEASE_ZIP" ]; then
    echo "❌ ZIP 文件不存在: $RELEASE_ZIP"
    exit 1
fi
ls -lh "$RELEASE_ZIP"
echo "✅ ZIP 文件存在"

# 步骤 2: 创建临时目录并解压
echo ""
echo "[2/7] 解压 Release 产物..."
TEMP_DIR=$(mktemp -d /tmp/release-test-XXXXXX)
echo "临时目录: $TEMP_DIR"
cd "$TEMP_DIR"
unzip -q "$RELEASE_ZIP"
echo "✅ 解压完成"

# 步骤 3: 验证解压后的文件结构
echo ""
echo "[3/7] 验证文件结构..."
echo "文件结构:"
find . -maxdepth 4 -type d | head -20
echo ""

REQUIRED_FILES=(
    "apps/app/.next/standalone"
    "apps/app/.next/static"
    "apps/app/public"
    "Dockerfile"
    "packages"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -e "$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 缺失"
        exit 1
    fi
done

# 步骤 4: 清理旧容器
echo ""
echo "[4/7] 清理旧容器..."
podman rm -f "$TEST_CONTAINER" 2>/dev/null || echo "无旧容器需要清理"
podman rmi "$TEST_CONTAINER" 2>/dev/null || echo "无旧镜像需要清理"
echo "✅ 清理完成"

# 步骤 5: 构建 Docker 镜像
echo ""
echo "[5/7] 构建 Docker 镜像..."
podman build -t "$TEST_CONTAINER" .
echo "✅ 镜像构建完成"

# 步骤 6: 运行容器
echo ""
echo "[6/7] 启动容器..."
podman run -d --name "$TEST_CONTAINER" -p 3001:3000 "$TEST_CONTAINER"
echo "等待容器启动..."
sleep 5

# 步骤 7: 验证服务
echo ""
echo "[7/7] 验证服务..."
echo "检查容器状态:"
podman ps | grep "$TEST_CONTAINER"

echo ""
echo "测试 HTTP 响应:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 服务正常运行 (HTTP $HTTP_CODE)"
    echo ""
    echo "访问地址: http://localhost:3001"
    echo ""
    echo "清理命令 (测试完成后执行):"
    echo "  podman rm -f $TEST_CONTAINER"
    echo "  podman rmi $TEST_CONTAINER"
else
    echo "❌ 服务未正常运行 (HTTP $HTTP_CODE)"
    echo ""
    echo "查看容器日志:"
    echo "  podman logs $TEST_CONTAINER"
    exit 1
fi

echo ""
echo "========================================="
echo "✅ Release 产物验证完成"
echo "========================================="
