# ============================================================
# Docker 单阶段构建 - 仅包含运行时环境
# 职责：运行本地构建生成的 standalone 产物
# 前置条件：本地已执行 pnpm build 生成 .next/standalone
# ============================================================
FROM node:22-alpine AS runner
ENV NODE_ENV=production

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# 复制 standalone 构建产物（已包含所有生产依赖）
COPY --chown=nextjs:nodejs apps/app/.next/standalone ./
COPY --chown=nextjs:nodejs apps/app/.next/static ./apps/app/.next/static
COPY --chown=nextjs:nodejs apps/app/public ./apps/app/public
COPY --chown=nextjs:nodejs apps/app/src/contents ./apps/app/src/contents
COPY --chown=nextjs:nodejs packages ./packages

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "apps/app/server.js"]
