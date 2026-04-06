## ADDED Requirements

### Requirement: Hono API 统一入口
系统 SHALL 提供统一的 Hono API 入口点,通过 Next.js App Router 的 `[[...route]]` 捕获路由处理所有 API 请求。

#### Scenario: API 路由初始化
- **WHEN** 应用启动时
- **THEN** Hono 实例在 `src/app/api/[[...route]]/route.ts` 中初始化,basePath 设置为 `/api`

#### Scenario: 子路由挂载
- **WHEN** 模块 API 路由定义完成
- **THEN** 通过 `app.route()` 方法将子路由挂载到统一入口

#### Scenario: HTTP 方法导出
- **WHEN** Next.js 需要处理不同 HTTP 方法
- **THEN** 文件导出 GET、POST、PUT、DELETE、PATCH 方法,均调用 `handle(app)`

### Requirement: hono/vercel 适配器集成
系统 SHALL 使用 `hono/vercel` 适配器将 Hono 应用转换为 Next.js Route Handler。

#### Scenario: 适配器导入
- **WHEN** 创建 API 入口文件
- **THEN** 从 `hono/vercel` 导入 `handle` 函数

#### Scenario: 请求处理
- **WHEN** HTTP 请求到达 API 路由
- **THEN** `handle(app)` 将 Next.js Request 转换为 Hono Context 并返回 Response

### Requirement: 模块 API 路由结构
每个业务模块 SHALL 提供独立的 Hono 路由定义文件,位于 `src/modules/<name>/api.ts`。

#### Scenario: Blog API 路由
- **WHEN** 访问 `/api/blog`
- **THEN** 路由到 `src/modules/blog/api.ts`,返回博客列表(分页、搜索、分类)

#### Scenario: Contact API 路由
- **WHEN** POST 请求发送到 `/api/contact`
- **THEN** 路由到 `src/modules/contact/api.ts`,处理邮件发送

### Requirement: 同域 API 调用
前端 SHALL 使用相对路径调用 API,无需配置 CORS。

#### Scenario: Fetcher 更新
- **WHEN** 前端服务层发起 API 请求
- **THEN** 使用相对路径如 `/api/blog`,自动同域请求

#### Scenario: 环境变量移除
- **WHEN** 迁移完成后
- **THEN** `NEXT_PUBLIC_API_URL` 环境变量不再被使用
