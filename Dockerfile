FROM node:22-alpine AS base
# RUN corepack enable && corepack prepare pnpm@10.21.0 --activate
RUN npm install -g pnpm@10.21.0 --registry=https://registry.npmjs.org/ --proxy=false --https-proxy=false

WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/app/package.json ./apps/app/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
RUN pnpm install --prod --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app
COPY --from=base --chown=nextjs:nodejs /app/apps/app/.next/standalone ./
COPY --from=base --chown=nextjs:nodejs /app/apps/app/.next/static ./apps/app/.next/static
COPY --from=base --chown=nextjs:nodejs /app/apps/app/public ./apps/app/public
COPY --from=base --chown=nextjs:nodejs /app/apps/app/src/contents ./apps/app/src/contents
COPY --from=base --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=nextjs:nodejs /app/packages ./packages

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "apps/app/server.js"]
