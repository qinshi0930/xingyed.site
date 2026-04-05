FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.21.0 --activate

WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app
COPY --from=base --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=base --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=base --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=base --chown=nextjs:nodejs /app/apps/web/src/contents ./apps/web/src/contents
COPY --from=base --chown=nextjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=base --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=nextjs:nodejs /app/packages ./packages

USER nextjs

EXPOSE 3000 3001
ENV PORT=3000
ENV API_PORT=3001

CMD ["pnpm", "start"]
