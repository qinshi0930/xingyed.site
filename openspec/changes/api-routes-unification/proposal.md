## Why

当前项目的API路由实现混乱：11个API路由分散在两个位置（`app/api/*/route.ts` 和 `modules/*/api.ts`），混用Next.js原生Route Handler和Hono框架，且存在上次Monorepo迁移遗留的死代码。这导致代码维护困难、职责不清、错误处理和缓存策略无法统一。

## What Changes

- **统一API路由目录**：将所有API路由从 `app/api/*/route.ts` 和 `modules/*/api.ts` 迁移到 `src/api/` 目录
- **统一使用Hono框架**：移除Next.js原生Route Handler混用，全部采用Hono + hono/vercel适配器
- **创建中间件系统**：添加全局错误处理中间件和缓存中间件，统一横切关注点
- **清理死代码**：删除上次Monorepo迁移遗留的 `modules/blog/api.ts` 和 `modules/contact/api.ts`
- **合并Spotify路由**：将 `/api/now-playing` 和 `/api/available-devices` 合并为 `/api/spotify/now-playing` 和 `/api/spotify/available-devices`
- **修复Contact API bug**：修正请求体解构错误（从错误的 `{ formData }` 改为正确的 `{ name, email, message }`）
- **职责分离**：`src/api/` 负责路由，`src/modules/` 负责UI和业务逻辑，`src/services/` 负责第三方API客户端

## Capabilities

### New Capabilities
- `unified-api-routes`: 统一的API路由系统，所有HTTP路由集中在 `src/api/` 目录，使用Hono框架实现
- `api-middleware-system`: API中间件系统，包括全局错误处理和缓存策略中间件

### Modified Capabilities
- `isomorphic-api`: Hono与Next.js App Router的同构集成方式从分散挂载改为统一入口

## Impact

**Affected Code**:
- 删除11个 `app/api/*/route.ts` 文件
- 删除2个 `modules/*/api.ts` 死代码文件
- 创建12个新文件（`src/api/` 目录下的路由和中间件）
- 修改 `app/api/[[...route]]/route.ts` 为简化适配器

**Breaking Changes**:
- **BREAKING**: `/api/now-playing` 路径变更为 `/api/spotify/now-playing`
- **BREAKING**: `/api/available-devices` 路径变更为 `/api/spotify/available-devices`
- 需要同步更新3处前端调用（NowPlayingCard.tsx和NowPlayingBar.tsx）

**Dependencies**: 
- 依赖已有的 `hono` (4.10.4) 和 `hono/vercel` 适配器
- 无新增外部依赖

**Systems**:
- 影响所有API端点（共11个）
- 影响前端Spotify相关组件
- 不影响业务逻辑层（services和common/libs保持不变）
