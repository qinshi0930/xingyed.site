## ADDED Requirements

### Requirement: API 服务层职责
系统 SHALL 在 `api/services/` 目录下存放业务逻辑代码，与 `api/routes/`（HTTP 层）和 `api/middleware/`（中间件层）形成清晰分层。

#### Scenario: 服务层职责范围
- **WHEN** 实现 API 业务逻辑
- **THEN** 代码 SHALL 存放在 `api/services/` 目录
- **AND** 包含数据处理、缓存管理、外部服务调用等逻辑
- **AND** 不包含 HTTP 请求/响应处理

#### Scenario: 路由层职责范围
- **WHEN** 处理 HTTP 请求
- **THEN** 代码 SHALL 存放在 `api/routes/` 目录
- **AND** 仅负责参数解析、调用服务层、返回响应
- **AND** 不包含业务逻辑实现

### Requirement: 后端逻辑隔离
系统 SHALL 确保后端专用代码（文件系统操作、数据库访问、缓存管理）不被前端组件直接引用。

#### Scenario: 服务层路径隔离
- **WHEN** 前端组件尝试导入后端服务
- **THEN** 导入路径 SHALL 指向 `api/services/` 而非 `common/libs/`
- **AND** 前端组件 SHALL 通过 API 调用而非直接导入（Server Component 除外）

#### Scenario: 删除重复的后端逻辑
- **WHEN** 发现 `common/libs/` 或 `modules/` 中存在后端逻辑
- **THEN** 系统 SHALL 将其迁移至 `api/services/`
- **AND** 删除原始重复代码
- **AND** 更新所有引用点

### Requirement: 前端通过 API 获取数据
系统 SHALL 确保前端页面组件通过 API 端点获取数据，而非直接调用后端服务函数。

#### Scenario: 博客详情页数据获取
- **WHEN** 渲染博客详情页面
- **THEN** 页面组件 SHALL 通过 `fetch()` 调用 `/api/blog` 端点
- **AND** 不直接导入 `loadBlogFiles()` 或 `getBlogById()`
- **AND** 处理加载状态和错误情况

#### Scenario: 博客列表页数据获取
- **WHEN** 渲染博客列表页面
- **THEN** 组件 SHALL 通过客户端 fetcher 调用 API
- **AND** 支持分页、搜索、分类筛选参数
- **AND** 显示加载指示器

### Requirement: 服务层接口规范
系统 SHALL 为每个服务模块定义清晰的公共接口。

#### Scenario: 导出函数命名
- **WHEN** 服务层导出公共函数
- **THEN** 函数名 SHALL 使用动词开头（如 `getBlogs`, `warmBlogCache`）
- **AND** 参数 SHALL 使用接口类型定义
- **AND** 返回值 SHALL 使用接口类型定义

#### Scenario: 错误处理
- **WHEN** 服务层函数执行失败
- **THEN** 函数 SHALL 抛出 Error 对象
- **AND** 错误信息 SHALL 包含上下文信息
- **AND** 调用方（路由层）负责捕获并转换为 HTTP 响应
