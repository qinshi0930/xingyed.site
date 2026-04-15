## 1. 创建 API 服务层

- [x] 1.1 创建 `apps/app/src/api/services/` 目录
- [x] 1.2 创建 `apps/app/src/api/services/blog.ts` 文件
- [x] 1.3 实现 `loadBlogFiles()` 函数（从 common/libs/blog.ts 迁移）
- [x] 1.4 实现 `getCachedBlogs()` 函数（包含 Redis 缓存逻辑，TTL=7天）
- [x] 1.5 实现 `getBlogs()` 函数（支持 id/slug 查询 + 列表过滤分页）
- [x] 1.6 实现 `warmBlogCache()` 函数（启动预热）
- [x] 1.7 添加 TypeScript 类型定义和接口

## 2. 修改 Blog API 路由

- [x] 2.1 修改 `apps/app/src/api/routes/blog.ts` 导入路径（从 services 导入）
- [x] 2.2 将 `getBlogs()` 调用改为异步（`await`）
- [x] 2.3 添加 `id` 和 `slug` 查询参数支持
- [x] 2.4 验证 API 路由功能正常（分页、搜索、分类、id查询、slug查询）
- [x] 2.5 测试 API 响应格式保持不变

## 3. 添加缓存预热逻辑

- [x] 3.1 修改 `apps/app/src/api/index.ts`
- [x] 3.2 导入 `warmBlogCache` 函数
- [x] 3.3 在应用启动时异步调用 `warmBlogCache()`
- [x] 3.4 添加错误处理（不阻塞启动）
- [x] 3.5 测试启动日志输出

## 4. Redis 客户端优化（新增）

- [x] 4.1 将 Redis 单例从模块级变量提升到 `globalThis`
- [x] 4.2 添加 TypeScript 类型声明（`declare global`）
- [x] 4.3 实现事件监听器防重复注册机制（`__redisListenersRegistered`）
- [x] 4.4 优化优雅关闭逻辑（使用 globalThis 引用）
- [x] 4.5 添加 `cleanupRedisGlobalState()` 工具函数（供测试使用）
- [x] 4.6 验证 Next.js 开发模式下的生命周期管理
- [x] 4.7 记录 Turbopack 模块重载行为分析文档

## 5. 修改前端博客详情页

- [x] 5.1 修改 `apps/app/src/app/(page)/blog/[slug]/page.tsx`
- [x] 5.2 添加 ISR 配置（`export const dynamic = 'force-static'`）
- [x] 5.3 设置 revalidate = 3600（1小时）
- [x] 5.4 删除 `generateStaticParams()` 函数
- [x] 5.5 移除 `getBlogById` 和 `loadBlogFiles` 导入
- [x] 5.6 改为通过 `fetch()` 调用 `/api/blog?slug={slug}`
- [x] 5.7 使用 `params.slug` 替代 `searchParams.id`
- [x] 5.8 处理加载状态和错误情况
- [x] 5.9 测试博客详情页渲染正常（URL 格式：`/blog/slug-name`）
- [x] 5.10 测试 metadata 生成正常

## 6. 删除重复代码

- [ ] 6.1 确认无其他文件引用 `modules/blog/service.ts`
- [ ] 6.2 删除 `apps/app/src/modules/blog/service.ts`
- [ ] 6.3 确认无其他文件引用 `common/libs/blog.ts`
- [ ] 6.4 删除 `apps/app/src/common/libs/blog.ts`
- [ ] 6.5 运行类型检查确认无编译错误

## 7. 测试与验证

- [ ] 7.1 启动开发服务器，验证缓存预热日志
- [ ] 7.2 测试博客列表 API（分页、搜索、分类）
- [ ] 7.3 测试博客详情 API（id 查询、slug 查询）
- [ ] 7.4 测试博客详情页数据加载（ISR 模式）
- [ ] 7.5 验证 URL 格式为 `/blog/slug-name`（无 ?id=）
- [ ] 7.6 检查 Redis 缓存键 `blog:all` 是否存在
- [ ] 7.7 验证 API 响应时间（应 < 5ms）
- [ ] 7.8 验证 ISR 缓存生效（首次 ~100ms，后续 < 1ms）
- [ ] 7.9 运行 lint 和类型检查
- [ ] 7.10 测试 Redis 不可用时的降级逻辑（可选）

## 8. 提交与文档

- [ ] 8.1 提交代码到 git
- [ ] 8.2 编写清晰的 commit message
- [ ] 8.3 更新 README（如需要，说明缓存策略）
- [ ] 8.4 归档此 OpenSpec 变更
