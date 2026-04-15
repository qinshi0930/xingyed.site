## ADDED requirements

### Requirement: Redis 客户端单例模式
系统 SHALL 使用 `globalThis` 存储 Redis 单例实例，确保在 Next.js 开发模式的模块重载中正确复用连接。

#### Scenario: 首次获取 Redis 实例
- **WHEN** 应用首次调用 `getRedis()`
- **THEN** 系统创建新的 Redis 连接
- **AND** 存储到 `globalThis.__redisInstance`
- **AND** 注册事件监听器（仅首次）
- **AND** 设置 `globalThis.__redisListenersRegistered = true`

#### Scenario: 重复获取 Redis 实例
- **WHEN** 应用再次调用 `getRedis()`
- **THEN** 系统返回 `globalThis.__redisInstance` 中的现有实例
- **AND** 不创建新连接
- **AND** 不重复注册事件监听器

#### Scenario: 模块重载后获取实例
- **WHEN** Next.js Turbopack 重新编译并加载模块
- **AND** 模块代码再次调用 `getRedis()`
- **THEN** 系统检查 `globalThis.__redisInstance`
- **AND** 如果实例仍存在，直接返回（复用连接）
- **AND** 如果实例已被清理，创建新连接

### Requirement: 事件监听器防重复注册
系统 SHALL 确保 SIGTERM 和 SIGINT 事件监听器只注册一次，避免重复触发关闭逻辑。

#### Scenario: 首次注册监听器
- **WHEN** 创建 Redis 实例
- **THEN** 系统检查 `globalThis.__redisListenersRegistered`
- **AND** 如果为 `false`，注册 SIGTERM 和 SIGINT 监听器
- **AND** 设置 `globalThis.__redisListenersRegistered = true`

#### Scenario: 重复注册尝试
- **WHEN** 再次调用 `getRedis()`（无论实例是否存在）
- **THEN** 系统检查 `globalThis.__redisListenersRegistered`
- **AND** 如果为 `true`，跳过监听器注册
- **AND** 不重复添加监听器

### Requirement: 优雅关闭机制
系统 SHALL 在收到进程退出信号时优雅关闭 Redis 连接，确保资源不泄漏。

#### Scenario: 收到 SIGTERM 信号
- **WHEN** 进程收到 SIGTERM 信号
- **THEN** 系统触发优雅关闭回调
- **AND** 调用 `redis.quit()` 等待命令完成
- **AND** 打印 "Redis connection closed gracefully." 日志
- **AND** 设置 `globalThis.__redisInstance = null`
- **AND** 进程正常退出

#### Scenario: 收到 SIGINT 信号
- **WHEN** 进程收到 SIGINT 信号（Ctrl+C）
- **THEN** 系统触发优雅关闭回调
- **AND** 调用 `redis.quit()` 等待命令完成
- **AND** 打印 "Redis connection closed gracefully." 日志
- **AND** 设置 `globalThis.__redisInstance = null`
- **AND** 进程正常退出

#### Scenario: 关闭过程出错
- **WHEN** `redis.quit()` 抛出异常
- **THEN** 系统捕获错误并记录日志
- **AND** 强制调用 `redis.disconnect()` 断开连接
- **AND** 设置 `globalThis.__redisInstance = null`
- **AND** 进程继续退出

### Requirement: TypeScript 类型安全
系统 SHALL 为 `globalThis` 扩展提供正确的 TypeScript 类型声明。

#### Scenario: 类型声明
- **WHEN** 编写 Redis 客户端代码
- **THEN** 系统使用 `declare global` 扩展 `globalThis` 类型
- **AND** 声明 `__redisInstance: Redis | null`
- **AND** 声明 `__redisListenersRegistered: boolean`
- **AND** TypeScript 编译器不报错

### Requirement: 清理工具函数
系统 SHALL 提供 `cleanupRedisGlobalState()` 工具函数，用于测试环境重置状态。

#### Scenario: 测试环境清理
- **WHEN** 单元测试或集成测试需要重置 Redis 状态
- **THEN** 测试代码调用 `cleanupRedisGlobalState()`
- **AND** 函数断开当前 Redis 连接（如果存在）
- **AND** 设置 `globalThis.__redisInstance = null`
- **AND** 设置 `globalThis.__redisListenersRegistered = false`
- **AND** 测试可以重新初始化干净的 Redis 实例

#### Scenario: 生产环境不使用清理函数
- **WHEN** 应用在生产或开发环境正常运行
- **THEN** 系统不调用 `cleanupRedisGlobalState()`
- **AND** 进程退出时由操作系统自动回收 `globalThis`
- **AND** 无需手动清理

### Requirement: Next.js 开发模式兼容性
系统 SHALL 正确处理 Next.js Turbopack 开发模式下的模块重载行为。

#### Scenario: 开发模式模块重载
- **WHEN** Turbopack 检测到文件变更并重新编译
- **AND** 模块代码被重新加载
- **THEN** 系统可能在新的上下文中执行
- **AND** `globalThis` 可能被重置（取决于 Turbopack 实现）
- **AND** 新上下文创建新的 Redis 连接
- **AND** 旧上下文的连接通过 SIGTERM 优雅关闭
- **AND** 这是正常行为，不影响功能

#### Scenario: 生产模式单进程
- **WHEN** 应用在生产模式运行（`next start`）
- **THEN** 系统只启动一次，不重新编译
- **AND** `globalThis` 在整个进程生命周期内保持
- **AND** Redis 连接只创建一次
- **AND** 应用停止时才关闭连接
