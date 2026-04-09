## MODIFIED Requirements

### Requirement: Hono API 统一入口
系统 SHALL 提供统一的 Hono API 入口点，通过 Next.js App Router 的 `[[...route]]` 捕获路由处理所有 API 请求。

#### Scenario: API 路由初始化
- **WHEN** 应用启动时
- **THEN** Hono 实例在 `src/app/api/[[...route]]/route.ts` 中初始化，通过导入 `@/api` 获取配置好的Hono应用

#### Scenario: 子路由挂载
- **WHEN** 模块 API 路由定义完成
- **THEN** 所有子路由在 `src/api/index.ts` 中通过 `app.route()` 方法统一挂载，而非在 `[[...route]]/route.ts` 中分散挂载

#### Scenario: HTTP 方法导出
- **WHEN** Next.js 需要处理不同 HTTP 方法
- **THEN** `[[...route]]/route.ts` 文件导出 GET、POST、PUT、DELETE、PATCH 方法，均调用 `handle(app)` 委托给统一的Hono应用

### Requirement: 模块 API 路由结构
每个业务模块 SHALL 提供独立的 Hono 路由定义文件，位于 `src/api/<name>.ts` 而非 `src/modules/<name>/api.ts`。

#### Scenario: Blog API 路由
- **WHEN** 访问 `/api/blog`
- **THEN** 路由到 `src/api/blog.ts`，返回博客列表（支持分页、搜索、分类）

#### Scenario: Contact API 路由
- **WHEN** POST 请求发送到 `/api/contact`
- **THEN** 路由到 `src/api/contact.ts`，处理邮件发送，使用 `{ name, email, message }` 作为请求体结构

#### Scenario: GitHub API 路由
- **WHEN** 访问 `/api/github`
- **THEN** 路由到 `src/api/github.ts`，返回GitHub用户信息
