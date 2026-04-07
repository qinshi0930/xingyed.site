## 1. 基础架构创建

- [ ] 1.1 创建 `src/api/middleware/cache.ts` 缓存中间件
- [ ] 1.2 创建 `src/api/index.ts` Hono主应用入口，配置全局错误处理和健康检查
- [ ] 1.3 修改 `app/api/[[...route]]/route.ts` 简化为只导入 `@/api`

## 2. Blog和Contact路由迁移（第1批）

- [ ] 2.1 创建 `src/api/blog.ts`，使用 `@/common/libs/blog` 的getBlogs函数，应用缓存中间件
- [ ] 2.2 在 `src/api/index.ts` 中挂载blog路由
- [ ] 2.3 创建 `src/api/contact.ts`，修复请求体解构bug（使用 `{ name, email, message }`）
- [ ] 2.4 在 `src/api/index.ts` 中挂载contact路由
- [ ] 2.5 验证blog和contact API功能正常
- [ ] 2.6 删除 `app/api/blog/route.ts`、`app/api/contact/route.ts`、`modules/blog/api.ts`、`modules/contact/api.ts`

## 3. 简单GET路由迁移（第2批）

- [ ] 3.1 创建 `src/api/github.ts`，应用缓存中间件
- [ ] 3.2 创建 `src/api/projects.ts`，应用缓存中间件
- [ ] 3.3 创建 `src/api/read-stats.ts`，应用缓存中间件
- [ ] 3.4 在 `src/api/index.ts` 中挂载以上3个路由
- [ ] 3.5 验证3个API功能正常
- [ ] 3.6 删除对应的3个旧 `app/api/*/route.ts` 文件

## 4. 复杂路由迁移（第3批）

- [ ] 4.1 创建 `src/api/views.ts`，支持GET和POST方法，不使用缓存
- [ ] 4.2 创建 `src/api/learn.ts`，应用缓存中间件
- [ ] 4.3 创建 `src/api/content.ts`，应用缓存中间件
- [ ] 4.4 创建 `src/api/comments.ts`，应用缓存中间件
- [ ] 4.5 在 `src/api/index.ts` 中挂载以上4个路由
- [ ] 4.6 验证4个API功能正常
- [ ] 4.7 删除对应的4个旧 `app/api/*/route.ts` 文件

## 5. Spotify路由合并和前端更新（第4批）

- [ ] 5.1 创建 `src/api/spotify.ts`，合并now-playing和available-devices路由，应用缓存中间件
- [ ] 5.2 在 `src/api/index.ts` 中挂载spotify路由
- [ ] 5.3 更新 `common/components/elements/NowPlayingCard.tsx` 中的API路径为 `/api/spotify/now-playing`
- [ ] 5.4 更新 `common/components/elements/NowPlayingBar.tsx` 中的2处API路径
- [ ] 5.5 验证Spotify功能正常（Now Playing组件）
- [ ] 5.6 删除 `app/api/now-playing/route.ts` 和 `app/api/available-devices/route.ts`

## 6. 最终验证和清理

- [ ] 6.1 运行 `pnpm dev` 验证开发服务器启动正常
- [ ] 6.2 测试所有11个API端点可访问且返回正确数据
- [ ] 6.3 验证前端页面正常渲染（首页、博客、联系表单、Now Playing）
- [ ] 6.4 运行 `pnpm tsc --noEmit` 验证无TypeScript错误
- [ ] 6.5 运行 `pnpm build` 验证构建成功
- [ ] 6.6 确认所有旧API文件已删除
- [ ] 6.7 确认Git提交历史清晰，每批迁移有独立commit
