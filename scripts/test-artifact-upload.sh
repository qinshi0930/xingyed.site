#!/bin/bash
# 本地测试 CI/CD artifact 上传流程
# 模拟符号链接解析和大小检查

set -e

echo "🧪 测试 CI/CD Artifact 上传流程"
echo "================================"

# 清理之前的测试
rm -rf /tmp/cicd-test
mkdir -p /tmp/cicd-test

echo ""
echo "📦 步骤 1: 复制构建产物"
cp -r apps/app/.next/standalone /tmp/cicd-test/standalone-original
cp -r apps/app/.next/static /tmp/cicd-test/static
cp -r apps/app/public /tmp/cicd-test/public
cp -r apps/app/src/contents /tmp/cicd-test/contents
cp -r packages /tmp/cicd-test/packages
cp Dockerfile podman-compose.yml /tmp/cicd-test/

echo "✅ 产物已复制到 /tmp/cicd-test/"

echo ""
echo "📊 步骤 2: 解析前大小（带符号链接）"
echo "standalone: $(du -sh /tmp/cicd-test/standalone-original | cut -f1)"
echo "  符号链接数量: $(find /tmp/cicd-test/standalone-original -type l | wc -l)"

echo ""
echo "🔗 步骤 3: 解析符号链接（模拟 CI/CD 流程）"
cd /tmp/cicd-test
mv standalone-original standalone

# 先移除断裂的符号链接
echo "  查找并移除断裂的符号链接..."
BROKEN_LINKS=$(find standalone -xtype l 2>/dev/null | wc -l)
if [ "$BROKEN_LINKS" -gt 0 ]; then
  echo "  ⚠️  发现 $BROKEN_LINKS 个断裂的符号链接"
  find standalone -xtype l -delete 2>/dev/null
  echo "  ✓ 已移除断裂的符号链接"
fi

# 复制并解析符号链接
cp -aL standalone standalone-resolved 2>/dev/null || true
rm -rf standalone
mv standalone-resolved standalone

echo "✅ 符号链接已解析"
echo "  符号链接数量: $(find /tmp/cicd-test/standalone -type l | wc -l)"

echo ""
echo "📊 步骤 4: 解析后大小（无符号链接）"
echo "standalone: $(du -sh /tmp/cicd-test/standalone | cut -f1)"

echo ""
echo "📦 步骤 5: 完整 artifact 大小"
TOTAL=$(du -sh /tmp/cicd-test | cut -f1)
echo "总计: $TOTAL"

echo ""
echo "📁 步骤 6: 各组件大小分布"
cd /tmp/cicd-test
du -sh standalone static public contents packages Dockerfile podman-compose.yml 2>/dev/null | sort -hr

echo ""
echo "🎯 步骤 7: 验证产物结构"
echo "✓ standalone: $(test -d standalone && echo '存在' || echo '缺失')"
echo "✓ standalone/node_modules: $(test -d standalone/node_modules && echo '存在' || echo '缺失')"
echo "✓ static: $(test -d static && echo '存在' || echo '缺失')"
echo "✓ public: $(test -d public && echo '存在' || echo '缺失')"
echo "✓ contents: $(test -d contents && echo '存在' || echo '缺失')"
echo "✓ packages: $(test -d packages && echo '存在' || echo '缺失')"
echo "✓ Dockerfile: $(test -f Dockerfile && echo '存在' || echo '缺失')"

echo ""
echo "🐳 步骤 8: 测试 Docker 构建上下文"
# 创建一个临时 .dockerignore 来测试
cat > /tmp/cicd-test/.dockerignore << 'DOCKERIGNORE'
node_modules
.pnpm-store
.next
!.next/standalone
!.next/static
out
dist
.git
.gitignore
DOCKERIGNORE

echo "✓ .dockerignore 已创建"
echo ""
echo "💡 提示: 要测试 Docker 构建，请运行:"
echo "   cd /tmp/cicd-test && podman build -t test-cicd ."

echo ""
echo "✅ 测试完成！Artifact 大小: $TOTAL"
echo "📂 测试目录: /tmp/cicd-test"
