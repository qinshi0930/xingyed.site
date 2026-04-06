## ADDED Requirements

### Requirement: Blog API 保留架构
Blog API SHALL 保留 API 层抽象,即使当前数据来自本地 MDX 文件,为未来数据库扩展预留空间。

#### Scenario: API 路由定义
- **WHEN** 访问 `/api/blog`
- **THEN** Hono 路由从 `src/modules/blog/api.ts` 处理请求

#### Scenario: 数据源切换准备
- **WHEN** 未来需要迁移到数据库
- **THEN** 只需修改 service 层实现,API 接口保持不变

### Requirement: MDX 文件读取
Blog API SHALL 从 `src/contents/blog` 目录读取 MDX 文件,解析 frontmatter 和内容。

#### Scenario: 博客列表获取
- **WHEN** GET 请求发送到 `/api/blog?page=1&per_page=9`
- **THEN** 返回分页的博客列表,包含元数据(id, title, slug, date, categories 等)

#### Scenario: 搜索功能
- **WHEN** 请求包含 `search` 参数
- **THEN** 过滤标题、摘要、标签中包含搜索关键词的博客

#### Scenario: 分类筛选
- **WHEN** 请求包含 `category` 参数
- **THEN** 只返回指定分类的博客

#### Scenario: Featured 筛选
- **WHEN** 请求包含 `categories=16` 参数
- **THEN** 只返回 `is_featured=true` 的博客

### Requirement: 缓存控制
Blog API SHALL 设置适当的 HTTP 缓存头,优化 CDN 缓存。

#### Scenario: 缓存头设置
- **WHEN** 返回博客列表响应
- **THEN** 设置 `Cache-Control: public, s-maxage=60, stale-while-revalidate=30`
