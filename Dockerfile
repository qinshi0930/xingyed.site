# ============================================================
# 阶段 1: Builder - 构建应用
# 职责：安装依赖并执行 Next.js 构建
# ============================================================
FROM node:22-alpine AS builder

# 安装 pnpm 包管理器
RUN npm install -g pnpm@10.21.0 --registry=https://registry.npmjs.org/ --proxy=false --https-proxy=false

WORKDIR /app

# 复制依赖配置文件
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/app/package.json ./apps/app/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/

# 安装所有依赖（包括 devDependencies，用于构建）
RUN pnpm install --frozen-lockfile

# 复制完整源代码
COPY . .

# 执行构建
RUN pnpm build

# ============================================================
# 阶段 2: Runner - 生产运行环境
# 职责：仅包含运行时环境和构建产物
# ============================================================
FROM node:22-alpine AS runner
ENV NODE_ENV=production

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# 从 builder 阶段复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/.next/static ./apps/app/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/public ./apps/app/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/src/contents ./apps/app/src/contents
COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "apps/app/server.js"]
