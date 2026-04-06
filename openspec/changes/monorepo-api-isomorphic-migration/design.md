## Context

当前项目采用 Monorepo 架构,包含两个独立应用:
- `apps/api`: Hono 后端服务(端口 3001),提供 Blog API
- `apps/web`: Next.js 前端应用(端口 3000),包含页面和组件

两个应用通过 HTTP 通信,需要配置 CORS、管理两个进程、处理跨应用类型共享。对于个人博客项目,这种分离带来了不必要的复杂度。

**约束条件:**
- 必须保留 Hono 框架的使用(团队偏好)
- 需要为未来数据库扩展预留架构空间
- 生产环境使用外部 `.env.production` 文件管理环境变量
- Docker 部署需要简化为单镜像

## Goals / Non-Goals

**Goals:**
- 合并 `apps/api` 和 `apps/web` 为单一的 `@repo/app`
- 使用 `hono/vercel` 适配器将 Hono 嵌入 Next.js App Router
- 迁移 Blog API 和 Contact API 到统一的 Hono 入口
- 引入 Sonner Toast 通知系统,统一用户反馈
- 简化 Docker 配置为单应用、单端口
- 零 CORS 配置,同域 API 调用

**Non-Goals:**
- 不迁移 Chat 模块(已废弃)
- 不引入新的数据库(继续使用 MDX 文件)
- 不改变现有的业务逻辑
- 不重写前端组件

## Decisions

### 1. 应用命名: `@repo/app`

**决策:** 将合并后的应用命名为 `@repo/app`,目录为 `apps/app`

**理由:**
- 简洁明了,符合 monorepo 惯例
- 暗示"主应用"的地位
- 避免 `blog_app` 的下划线命名不规范

**替代方案:**
- `@repo/blog_app`: 语义更明确,但下划线不符合常见规范
- `@repo/web`: 保持原名,但语义不够准确(现在包含 API)

### 2. Hono 集成方式: `[[...route]]` 捕获路由

**决策:** 创建 `src/app/api/[[...route]]/route.ts` 作为统一 API 入口,使用 `hono/vercel` 适配器

**理由:**
- Next.js App Router 的标准做法
- 支持所有 HTTP 方法
- Hono 的路由定义保持优雅
- 可以使用 Hono 中间件生态

**实现:**
```typescript
import { Hono } from 'hono'
import { handle } from 'hono/vercel'

const app = new Hono().basePath('/api')
app.route('/blog', blogRoute)
app.route('/contact', contactRoute)

export const GET = handle(app)
export const POST = handle(app)
// ... 其他方法
```

### 3. Blog API 保留决策

**决策:** 保留 Blog API 层,即使数据来自本地 MDX 文件

**理由:**
- 为未来数据库扩展预留架构空间
- 保持前后端职责分离
- 可以添加缓存层、速率限制等中间件
- API 抽象层便于未来重构

**替代方案:**
- 前端直接调用 `getBlogs()`: 更简单,但失去扩展性

### 4. Contact API 请求体结构

**决策:** 前端直接发送 `formData` 对象,不嵌套在 `{ formData: {...} }` 中

**理由:**
- 符合 RESTful API 最佳实践
- 减少一层嵌套,更简洁
- 后端验证逻辑更清晰

**实现:**
```typescript
// 前端
await axios.post('/api/contact', formData)

// 后端
const formData = await c.req.json()
const { name, email, message } = formData
```

### 5. Toast 通知系统: Sonner

**决策:** 使用 Sonner 作为全局 Toast 通知系统

**配置:**
- 位置: `bottom-right` (右下角)
- 样式: `richColors` (彩色)
- 持续时间: 默认 4 秒
- 范围: 所有模块统一使用

**理由:**
- 轻量级,性能好
- 与 shadcn/ui 集成良好
- API 简洁易用
- 支持自动消失和手动关闭

### 6. 环境变量管理

**决策:** 使用 `.env.production` 外部配置文件,不提交到 Git

**理由:**
- 生产环境和开发环境分离
- 敏感信息( SMTP 密码)不暴露
- Docker Compose 通过 `env_file` 加载

**必需变量:**
- SMTP 配置 (Contact API)
- Redis 配置
- GitHub/Spotify/Wakatime/Dev.to API Keys

### 7. Docker 部署简化

**决策:** 单阶段构建,单一端口 3000,直接运行 `node server.js`

**变化:**
- 移除 `apps/api` 相关配置
- 只暴露一个端口
- 不使用 `concurrently` 进程管理
- 直接使用 Next.js standalone 输出

## Risks / Trade-offs

### [Risk] Hono 与 Next.js 兼容性

**风险:** Hono 在 Next.js App Router 中可能存在边缘情况的兼容性问题

**缓解:**
- 使用官方推荐的 `hono/vercel` 适配器
- 保持 Node.js Runtime(不使用 Edge)
- 充分测试所有 API 端点

### [Risk] 路径别名冲突

**风险:** `@/modules/*/api.ts` 可能与现有导入冲突

**缓解:**
- TypeScript 编译时会捕获冲突
- 检查所有现有导入
- 使用唯一的文件名

### [Risk] 性能回归

**风险:** 同构架构可能导致启动时间变慢

**缓解:**
- 使用 Turbopack 加速开发
- 监控生产环境性能指标
- Next.js standalone 模式已经优化

### [Trade-off] 失去独立扩展性

**权衡:** API 和前端耦合在一起,无法单独横向扩展 API 服务

**接受原因:**
- 个人博客不需要微服务级别的分离
- 简化部署和维护的收益大于损失
- 未来如有需要,可以重新分离

### [Trade-off] Blog API 冗余

**权衡:** MDX 文件就在项目中,Blog API 显得冗余

**接受原因:**
- 为未来数据库扩展预留空间
- 保持架构一致性
- API 抽象层的长期价值

## Migration Plan

### 部署步骤

1. **重命名目录**: `apps/web` → `apps/app`
2. **更新 package.json**: name 改为 `@repo/app`
3. **安装依赖**: `pnpm add sonner`
4. **创建 Hono 入口**: `src/app/api/[[...route]]/route.ts`
5. **迁移 API 路由**:
   - Blog: `apps/api/src/routes/blog.ts` → `apps/app/src/modules/blog/api.ts`
   - Contact: 创建 `apps/app/src/modules/contact/api.ts`
6. **更新前端调用**: 所有 API 调用改为 `/api/*`
7. **添加 Toaster**: 在 `layout.tsx` 中添加 `<Toaster />`
8. **删除旧应用**: 移除 `apps/api` 目录
9. **更新配置**: 根目录 package.json、pnpm-workspace.yaml、Dockerfile
10. **测试验证**: 确保所有功能正常

### 回滚策略

如果迁移后出现问题:

1. **Git 回滚**: `git revert` 或切换到迁移前的 commit
2. **备份目录**: 迁移前备份 `apps/web` 和 `apps/api`
3. **渐进式验证**: 
   - 先验证构建成功
   - 再验证开发服务器启动
   - 最后验证所有 API 端点

### 验证清单

- [ ] `pnpm dev` 成功启动
- [ ] 前端页面正常渲染
- [ ] `/api/blog` 返回正确的博客列表
- [ ] `/api/contact` 成功发送邮件
- [ ] Toast 通知正常显示
- [ ] `pnpm build` 构建成功
- [ ] Docker 镜像构建成功
- [ ] 生产环境启动成功

## Open Questions

无 - 所有设计决策已在 grill-me 讨论中明确。
