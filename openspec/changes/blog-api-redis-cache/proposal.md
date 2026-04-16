## Why

当前 blog API 每次请求都会重复读取文件系统并解析 MDX 文档（约 50-100ms），即使博客数据极少变更（月更频率）。项目中已有 Redis 基础设施但未被利用，同时存在代码重复问题（`common/libs/blog.ts` 与 `modules/blog/service.ts` 完全相同，134 行代码重复）。这导致不必要的性能浪费和架构混乱。

## What Changes

- 引入 Redis 缓存层，将博客数据缓存 7 天，API 响应时间从 ~50-100ms 降至 ~2-5ms
- 应用启动时主动预热缓存，避免首次请求延迟
- 新增 `api/services/blog.ts` 业务逻辑层，统一管理博客数据和缓存策略
- 优化 Redis 客户端单例模式：使用 `globalThis` 确保 Next.js 开发模式下的正确生命周期管理
- 删除重复代码：移除 `modules/blog/service.ts` 和 `common/libs/blog.ts`
- 前端博客详情页改为通过 API 获取数据，实现前后端完全解耦
- 保持 Redis 不可用时的降级策略，确保系统可靠性

## Capabilities

### New Capabilities
- `blog-api-cache`: 博客 API Redis 缓存策略，包括缓存预热、TTL 管理、降级处理
- `api-service-layer`: API 服务层架构规范，明确 routes 层与 services 层的职责边界
- `redis-client-lifecycle`: Redis 客户端生命周期管理，包括 globalThis 单例模式、事件监听器防重复注册、优雅关闭机制

### Modified Capabilities
<!-- 无现有能力的需求变更 -->

## Impact

**Affected Code:**
- 新增: `apps/app/src/api/services/blog.ts`
- 修改: `apps/app/src/api/routes/blog.ts`（调用 services 层）
- 修改: `apps/app/src/api/index.ts`（添加缓存预热）
- 修改: `apps/app/src/app/(page)/blog/[slug]/page.tsx`（改为 API 调用）
- 删除: `apps/app/src/modules/blog/service.ts`（重复代码）
- 删除: `apps/app/src/common/libs/blog.ts`（后端逻辑迁移）

**Dependencies:**
- 依赖现有 Redis 基础设施（`ioredis` 客户端）
- 依赖现有的 `api/middleware/cache.ts` HTTP 缓存中间件（双层缓存）

**Systems:**
- Blog API 性能优化
- 代码架构清理与职责分离

