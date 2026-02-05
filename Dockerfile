FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@10.21.0 --activate

WORKDIR /app

FROM base AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 直接复制预构建产物（由 GitHub Actions 生成）
COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs .next/static ./.next/static
COPY --chown=nextjs:nodejs public ./public
COPY --chown=nextjs:nodejs src/contents ./src/contents

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
