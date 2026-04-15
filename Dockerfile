# ============================================================
# 单阶段构建 - 使用预编译产物（Bun 构建）
# 职责：仅打包已构建的 standalone 产物和运行时依赖
# 注意：需要先执行 bun run build 生成产物
# ============================================================
FROM node:22-alpine
ENV NODE_ENV=production

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# 复制预编译的 standalone 产物
# 这些文件由 CI/CD 流程中的 bun run build 生成
# 目录结构（artifact 解压后的 monorepo 结构）：
# apps/app/.next/standalone/ - Next.js standalone 输出（包含 server.js、node_modules/.bun 和 packages）
# apps/app/.next/static/     - 静态资源（CSS、JS chunks）
# apps/app/public/           - 公共静态文件
# apps/app/src/contents/     - MDX 内容
# 注意：standalone 已通过 transpilePackages 包含 @repo/types 和 @repo/utils
COPY apps/app/.next/standalone/ ./
COPY apps/app/.next/static/ ./apps/app/.next/static/
COPY apps/app/public/ ./apps/app/public/
COPY apps/app/src/contents/ ./apps/app/src/contents/

# 创建缓存目录并设置权限（避免运行时 EACCES 错误）
RUN mkdir -p apps/app/.next/cache && chown nextjs:nodejs apps/app/.next/cache

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "apps/app/server.js"]
