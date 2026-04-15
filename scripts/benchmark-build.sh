#!/bin/bash

# 构建耗时对比测试脚本
# 对比 Node.js 运行时下 Webpack vs Turbopack 的构建耗时

echo "========================================="
echo "Next.js 构建耗时对比测试 (Node.js)"
echo "========================================="
echo ""

cd /home/xingye/workspace/xingyed.site/apps/app

# 测试 1: Webpack
echo "📦 测试 1: Webpack 构建"
echo "-----------------------------------------"
rm -rf .next
START_TIME=$(date +%s%N)
npx next build
END_TIME=$(date +%s%N)
WEBPACK_TIME=$(( (END_TIME - START_TIME) / 1000000 ))
echo ""
echo "✅ Webpack 构建耗时: ${WEBPACK_TIME}ms"
echo ""
sleep 2

# 测试 2: Turbopack
echo "⚡ 测试 2: Turbopack 构建"
echo "-----------------------------------------"
rm -rf .next
START_TIME=$(date +%s%N)
npx next build --turbopack
END_TIME=$(date +%s%N)
TURBOPACK_TIME=$(( (END_TIME - START_TIME) / 1000000 ))
echo ""
echo "✅ Turbopack 构建耗时: ${TURBOPACK_TIME}ms"
echo ""

# 输出对比结果
echo "========================================="
echo "📊 构建耗时对比结果"
echo "========================================="
echo "Webpack:    ${WEBPACK_TIME}ms"
echo "Turbopack:  ${TURBOPACK_TIME}ms"
echo ""

if [ $WEBPACK_TIME -gt $TURBOPACK_TIME ]; then
    DIFF=$((WEBPACK_TIME - TURBOPACK_TIME))
    SPEEDUP=$(( (DIFF * 100) / WEBPACK_TIME ))
    echo "🚀 Turbopack 比 Webpack 快 ${DIFF}ms (提升 ${SPEEDUP}%)"
else
    DIFF=$((TURBOPACK_TIME - WEBPACK_TIME))
    SLOWER=$(( (DIFF * 100) / WEBPACK_TIME ))
    echo "🐌 Turbopack 比 Webpack 慢 ${DIFF}ms (慢 ${SLOWER}%)"
fi

echo "========================================="
