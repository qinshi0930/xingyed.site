## ADDED Requirements

### Requirement: Redis 缓存博客数据
系统 SHALL 将完整的博客数据数组缓存到 Redis，缓存键为 `blog:all`，TTL 为 7 天（604800 秒）。

#### Scenario: 缓存命中
- **WHEN** API 请求获取博客列表
- **THEN** 系统从 Redis 读取 `blog:all` 并返回解析后的数据

#### Scenario: 缓存未命中
- **WHEN** Redis 中不存在 `blog:all` 或已过期
- **THEN** 系统从文件系统读取所有 MDX 文件
- **AND** 将解析后的数据写入 Redis（TTL=604800 秒）
- **AND** 返回博客数据

#### Scenario: Redis 不可用
- **WHEN** Redis 连接失败或抛出异常
- **THEN** 系统降级到直接从文件系统读取博客数据
- **AND** 记录警告日志
- **AND** 正常返回数据（不报错）

### Requirement: 应用启动时预热缓存
系统 SHALL 在 API 应用启动时异步预热博客缓存，不阻塞应用启动流程。

#### Scenario: 预热成功
- **WHEN** 应用启动完成
- **THEN** 系统异步调用缓存预热函数
- **AND** 将博客数据写入 Redis
- **AND** 记录预热成功日志

#### Scenario: 预热失败
- **WHEN** 预热过程中发生错误（如 Redis 不可用）
- **THEN** 系统记录错误日志
- **AND** 不阻塞应用启动
- **AND** 首次 API 请求时重新尝试构建缓存

### Requirement: 内存过滤与分页
系统 SHALL 在从 Redis 获取博客数据后，在内存中执行分类筛选、搜索和分页操作。

#### Scenario: 按分类筛选
- **WHEN** API 请求包含 `category` 参数
- **THEN** 系统过滤出包含该分类的博客
- **AND** 返回过滤后的分页结果

#### Scenario: 搜索功能
- **WHEN** API 请求包含 `search` 参数
- **THEN** 系统在博客标题、摘要和标签中执行不区分大小写的搜索
- **AND** 返回匹配的分页结果

#### Scenario: 分页
- **WHEN** API 请求包含 `page` 和 `per_page` 参数
- **THEN** 系统返回对应页码的博客列表
- **AND** 包含总页数和总文章数元数据

### Requirement: 缓存键与数据格式
系统 SHALL 使用一致的缓存键和数据序列化格式。

#### Scenario: 缓存键格式
- **WHEN** 读写博客缓存
- **THEN** 系统使用固定键名 `blog:all`
- **AND** 不使用查询参数作为键的一部分

#### Scenario: 数据序列化
- **WHEN** 写入缓存
- **THEN** 系统将博客数组序列化为 JSON 字符串
- **AND** 使用 `SETEX` 命令设置 TTL

#### Scenario: 数据反序列化
- **WHEN** 从缓存读取
- **THEN** 系统将 JSON 字符串解析为博客对象数组
- **AND** 处理可能的解析错误
