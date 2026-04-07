## ADDED Requirements

### Requirement: 统一API路由目录
系统 SHALL 将所有API路由统一放置在 `src/api/` 目录下，每个路由模块对应一个文件。

#### Scenario: 路由文件组织
- **WHEN** 开发者需要查找或修改API路由
- **THEN** 所有路由文件位于 `apps/app/src/api/` 目录，按功能命名（如 `blog.ts`, `contact.ts`, `github.ts`）

### Requirement: Hono框架统一实现
系统 SHALL 使用Hono框架实现所有API路由，通过 `hono/vercel` 适配器集成到Next.js App Router。

#### Scenario: Hono路由定义
- **WHEN** 定义新的API路由
- **THEN** 使用 `import { Hono } from "hono"` 创建路由实例，导出默认app

#### Scenario: Next.js适配器
- **WHEN** HTTP请求到达 `/api/*` 路径
- **THEN** `app/api/[[...route]]/route.ts` 使用 `handle(app)` 将请求委托给Hono应用处理

### Requirement: API路由路径规范
系统 SHALL 遵循 RESTful 路径规范，相关功能的路由合并到同一父路径下。

#### Scenario: Spotify路由合并
- **WHEN** 访问Spotify相关API
- **THEN** 使用 `/api/spotify/now-playing` 和 `/api/spotify/available-devices` 路径

### Requirement: 响应格式统一
系统 SHALL 使用统一的响应格式，status字段使用布尔值表示成功或失败。

#### Scenario: 成功响应
- **WHEN** API请求成功处理
- **THEN** 返回 `{ status: true, data: <payload> }` 格式

#### Scenario: 错误响应
- **WHEN** API请求处理失败
- **THEN** 返回 `{ status: false, error: <message> }` 格式

### Requirement: 清理死代码
系统 SHALL 移除上次Monorepo迁移遗留的未使用API文件。

#### Scenario: 删除废弃文件
- **WHEN** 迁移完成后
- **THEN** `modules/blog/api.ts` 和 `modules/contact/api.ts` 文件被删除
