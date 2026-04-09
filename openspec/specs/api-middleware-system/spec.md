## ADDED Requirements

### Requirement: 全局错误处理中间件
系统 SHALL 提供全局错误处理中间件，捕获所有未处理的异常并返回统一的错误响应格式。

#### Scenario: 未处理异常捕获
- **WHEN** 路由处理器抛出异常且未catch
- **THEN** 全局错误中间件捕获异常，返回 `{ status: false, error: <message> }` 和HTTP 500状态码

#### Scenario: 错误日志记录
- **WHEN** 全局错误中间件处理异常
- **THEN** 使用 `console.error` 记录错误详情到控制台

### Requirement: 缓存中间件
系统 SHALL 提供可配置的HTTP缓存中间件，自动添加Cache-Control响应头。

#### Scenario: 应用默认缓存策略
- **WHEN** GET路由使用 `cache()` 中间件无参数
- **THEN** 响应头包含 `Cache-Control: public, s-maxage=60, stale-while-revalidate=30`

#### Scenario: 自定义缓存时间
- **WHEN** GET路由使用 `cache(300, 60)` 中间件
- **THEN** 响应头包含 `Cache-Control: public, s-maxage=300, stale-while-revalidate=60`

#### Scenario: POST路由不使用缓存
- **WHEN** POST路由处理请求
- **THEN** 不应用缓存中间件，响应不包含Cache-Control头

### Requirement: 中间件目录结构
系统 SHALL 将API中间件放置在 `src/api/middleware/` 目录下。

#### Scenario: 中间件文件组织
- **WHEN** 开发者查找中间件实现
- **THEN** 中间件文件位于 `apps/app/src/api/middleware/` 目录（如 `cache.ts`）
