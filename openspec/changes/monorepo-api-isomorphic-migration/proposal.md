## Why

当前项目采用 Monorepo 分离架构,`apps/api`(Hono) 和 `apps/web`(Next.js) 作为两个独立应用运行。这导致需要管理两个进程、配置 CORS、处理跨应用类型共享等额外复杂度。对于个人博客项目,这种分离带来了不必要的运维负担。

通过将两个应用合并为单一的同构 Next.js 应用,使用 Hono 通过 `hono/vercel` 适配器嵌入 Next.js App Router,可以简化架构、统一技术栈、零 CORS 配置,同时保留 Hono 的优雅 API 定义方式和未来数据库扩展能力。

## What Changes

- **合并应用**: 将 `apps/api` 和 `apps/web` 合并为单一的 `@repo/app`
- **Hono 集成**: 创建统一的 API 入口 `src/app/api/[[...route]]/route.ts`,使用 `hono/vercel` 适配器
- **迁移后端逻辑**: 
  - Blog API: 从 MDX 文件读取,保留 API 层为未来数据库扩展预留空间
  - Contact API: 邮件发送功能迁移到 Hono API
  - 移除 Chat 模块(已废弃)
- **前端调用更新**: 所有 API 调用改为相对路径 `/api/*`,移除 `NEXT_PUBLIC_API_URL` 环境变量
- **Toast 通知系统**: 引入 Sonner,统一全局错误和成功消息展示
- **Docker 简化**: 单应用、单端口部署,移除 `concurrently` 进程管理
- **环境变量管理**: 使用 `.env.production` 外部配置文件

## Capabilities

### New Capabilities
- `isomorphic-api`: Hono 与 Next.js App Router 同构集成,统一 API 路由系统
- `toast-notification`: 基于 Sonner 的全局 Toast 通知系统,统一用户反馈机制
- `env-management`: 生产环境外部配置文件管理,简化环境变量部署

### Modified Capabilities
- `blog-api`: 保留 API 层抽象,从 MDX 文件读取,为未来数据库扩展预留架构空间
- `contact-api`: 从前端直接调用改为 Hono API 后端代理,保护 SMTP 配置

## Impact

**受影响的应用:**
- `apps/web` → 重命名为 `apps/app`
- `apps/api` → 删除

**受影响的文件:**
- `package.json`: 根目录和应用的脚本配置
- `pnpm-workspace.yaml`: 工作区配置
- `Dockerfile`: 简化为单阶段构建
- `podman-compose.yml`: 移除多端口配置
- 前端服务层: `fetcher.ts`, `contact.ts` 等 API 调用
- 联系表单组件: 添加 Toast 通知

**依赖变化:**
- 新增: `sonner` (Toast 通知)
- 保留: `hono`, `@hono/node-server` (已在 web 中)
- 移除: `concurrently` (不再需要)

**破坏性变更:**
- **BREAKING**: API 端口从 3001 变为 3000(同域)
- **BREAKING**: `NEXT_PUBLIC_API_URL` 环境变量不再需要
- **BREAKING**: `apps/api` 目录被删除
