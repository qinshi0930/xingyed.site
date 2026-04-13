# ============================================================
# 单阶段构建 - 使用预编译产物
# 职责：仅打包已构建的 standalone 产物和运行时依赖
# 注意：需要先执行 pnpm build 生成产物
# ============================================================
FROM node:22-alpine
ENV NODE_ENV=production

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# 复制预编译的 standalone 产物
# 这些文件由 CI/CD 流程中的 pnpm build 生成
# 目录结构（从 monorepo 根目录执行构建后）：
# .next/standalone/    - Next.js standalone 输出（包含 server.js 和 node_modules）
# .next/static/        - 静态资源（CSS、JS chunks）
# public/              - 公共静态文件
# src/contents/        - MDX 内容
# packages/            - Monorepo 共享包（@repo/types, @repo/utils）
COPY .next/standalone/ ./
COPY .next/static ./apps/app/.next/static
COPY public/ ./apps/app/public
COPY src/contents ./apps/app/src/contents
COPY packages ./packages

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "apps/app/server.js"]
