## Context

当前博客系统采用文件系统直接读取方式，每次 API 请求都会：
1. 读取 8 个 MDX 文件
2. 使用 remark 解析 Markdown 内容
3. 执行过滤和分页逻辑
4. 返回 JSON 响应

整个过程约 50-100ms，且 `common/libs/blog.ts` 与 `modules/blog/service.ts` 存在 134 行完全重复的代码。

项目已有 Redis 基础设施（`ioredis` 客户端，`podman-compose.yml` 中配置），但仅用于 `views` 计数，未用于博客缓存。

## Goals / Non-Goals

**Goals:**
- 通过 Redis 缓存将博客 API 响应时间降至 2-5ms
- 消除代码重复，统一博客数据管理逻辑
- 明确 API 层职责边界（routes 处理 HTTP，services 处理业务逻辑）
- 前端页面通过 API 获取数据，实现完全解耦
- 保持系统可靠性（Redis 降级策略）

**Non-Goals:**
- 不引入手动缓存失效 API（7 天 TTL 自动过期已满足需求）
- 不改变博客数据结构或 MDX 解析逻辑
- 不影响其他 API 路由（如 views, comments 等）
- 不修改构建流程或部署配置

## Decisions

### 1. 缓存策略：分层缓存（缓存全部数据 + 内存过滤）

**选择：** 缓存完整博客数组到 Redis（`blog:all`），在内存中执行过滤和分页。

**理由：**
- 只需存储一份数据，Redis 内存占用最小
- 过滤操作在内存中极快（<1ms）
- 不同查询参数可复用同一缓存
- 避免缓存冗余（如方案 A 的按查询参数缓存）

**替代方案：**
- 方案 A（按查询参数缓存）：会导致缓存冗余，命中率低
- 方案 C（缓存完整响应）：灵活性差，任何参数变化都会 miss

### 2. TTL 设置：7 天

**选择：** 604800 秒（7 天）

**理由：**
- 博客更新频率极低（月更），7 天几乎永久命中
- 提供安全网：缓存异常时自动修复
- 平衡性能与实时性

**替代方案：**
- 永久缓存：需要手动失效机制，增加复杂度
- 短 TTL（5-10 分钟）：不必要的 Redis 读写开销

### 3. 启动预热：异步执行

**选择：** 在 `api/index.ts` 中异步调用 `warmBlogCache()`，不阻塞应用启动。

**理由：**
- 避免首次请求延迟
- 不延长应用启动时间
- 即使预热失败，首次请求仍会构建缓存

### 4. 前端页面渲染策略：ISR（Incremental Static Regeneration）

**选择：** 博客详情页使用 ISR 模式，配置 `revalidate = 3600`（1 小时）。

**理由：**
- 适配前后端分离架构，运行时利用 Redis 缓存
- 构建速度快（不生成博客页面）
- 访问速度快（ISR 缓存 + Redis 缓存双层加速）
- 内容可更新（无需重新部署）
- 无构建期 Redis 依赖（完美解决构建环境问题）

**实现方式：**
```typescript
export const dynamic = 'force-static';
export const revalidate = 3600; // 1 小时重新验证

// 删除空的 generateStaticParams()，完全延迟到运行时
```

**访问流程：**
```
用户访问 /blog/post-1
   ↓
页面不存在（构建时未生成）
   ↓
运行时渲染（调用 API，~5ms Redis 缓存）
   ↓
ISR 缓存页面 1 小时
   ↓
后续访问直接返回缓存页面（<1ms）
```

**替代方案：**
- SSG（`generateStaticParams`）：构建时需要 Redis，增加复杂度（rejected）
- SSR（`force-dynamic`）：每次都调用 API，浪费缓存优势（rejected）

### 5. 博客详情页 URL 格式：简化为纯 slug

**选择：** URL 格式从 `/blog/slug-name?id=123` 简化为 `/blog/slug-name`。

**理由：**
- URL 更简洁美观
- SEO 更友好
- 直接使用 `params.slug` 查询，无需解析 searchParams
- API 已支持 slug 查询

**实现方式：**
```typescript
// 旧格式
const { id } = await searchParams;
const res = await fetch(`${API_URL}/api/blog?id=${id}`);

// 新格式
const { slug } = await params;
const res = await fetch(`${API_URL}/api/blog?slug=${slug}`);
```

### 6. 代码组织：新增 api/services 目录

**选择：** 在 `api/` 下新增 `services/` 目录存放业务逻辑。

**理由：**
- 明确标识为后端专用代码
- 前端组件无法直接访问（路径隔离）
- 与 `routes/` 和 `middleware/` 形成清晰分层

### 7. Redis 客户端单例模式：使用 globalThis（新增）

**选择：** 将 Redis 单例从模块级变量提升到 `globalThis` 层级，并添加事件监听器防重复注册机制。

**理由：**
- Next.js Turbopack 开发模式下会频繁重载模块
- 模块级变量在每次重载时会被重置，导致重复创建连接
- `globalThis` 在同一进程内共享，可避免重复初始化
- 添加 `__redisListenersRegistered` 标记防止事件监听器重复注册
- 确保优雅关闭逻辑正确执行，避免连接泄漏

**实现方式：**
```typescript
declare global {
  var __redisInstance: Redis | null;
  var __redisListenersRegistered: boolean;
}

export const getRedis = (): Redis => {
  const g = globalThis as any;
  
  if (!g.__redisInstance) {
    g.__redisInstance = new Redis(...);
    
    // 只在首次注册事件监听器
    if (!g.__redisListenersRegistered) {
      g.__redisListenersRegistered = true;
      process.on("SIGTERM", gracefulShutdown);
      process.on("SIGINT", gracefulShutdown);
    }
  }
  
  return g.__redisInstance;
};
```

**发现的技术细节：**
1. Turbopack 在开发模式下可能为每次编译创建独立上下文
2. 即使使用 `globalThis`，在某些情况下仍会被重置
3. 这是 Next.js 开发模式的正常行为，生产环境（`next start`）不会有此问题
4. 优雅关闭机制确保连接不泄漏，无需手动清理 `globalThis`

**替代方案：**
- 模块级变量：开发模式下每次重载都会重置（rejected）
- 外部进程管理器：过度复杂化（rejected）
- 阻止模块重载：破坏 HMR 功能（rejected）

## Risks / Trade-offs

### [Risk 1] Redis 不可用导致性能下降
**Mitigation:** 实现降级策略，Redis 故障时自动回退到文件系统读取，确保功能可用。

### [Risk 2] 缓存过期后首次请求延迟
**Mitigation:** 应用启动时预热缓存，7 天内缓存持续命中，降低过期概率。

### [Risk 3] 多实例缓存不一致（未来扩展）
**Mitigation:** 当前单实例部署无此问题。未来多实例时，Redis 天然共享缓存，仍保持一致。

### [Trade-off] 前端页面通过 API 获取数据的性能损耗
**说明:** 相比直接导入函数，`fetch()` 有微小开销（约 1-2ms），但换来的是：
1. 避免构建时 Redis 依赖问题
2. 架构清晰度和可维护性
3. 配合 ISR 实现双层缓存
总体可接受。

### [Trade-off] 删除 generateStaticParams()
**说明:** 构建时不生成博客页面，首次访问会触发运行时渲染。但由于：
1. 应用启动时已预热 Redis 缓存
2. API 响应时间 < 5ms
3. ISR 会缓存页面 1 小时
首次访问延迟可接受（约 50-100ms，包含页面渲染）。

### [Trade-off] 不实现手动缓存失效
**说明:** 发布新文章后需等待最多 7 天或重新部署。考虑到更新频率极低，可接受。未来可通过 webhook 或管理 API 扩展。

## Migration Plan

### 部署步骤
1. 创建 `api/services/blog.ts`（新功能，支持 id/slug 查询）
2. 修改 `api/routes/blog.ts`（切换数据源，添加 id/slug 参数支持）
3. 修改 `api/index.ts`（添加预热）
4. 测试验证 API 功能正常
5. 修改 `app/(page)/blog/[slug]/page.tsx`（改为 ISR + API 调用，使用 slug 参数）
6. 测试验证博客详情页正常（URL 格式：`/blog/slug-name`）
7. 删除 `modules/blog/service.ts` 和 `common/libs/blog.ts`

### 回滚策略
- 保留 git 历史记录，可快速恢复被删除的文件
- 如发现 Redis 缓存问题，可临时回退到直接调用 `loadBlogFiles()`

## Open Questions

**无** - 所有设计决策已明确。
