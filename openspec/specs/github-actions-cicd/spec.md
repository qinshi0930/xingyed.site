## MODIFIED Requirements

### Requirement: CI/CD Workflow 包管理器
Workflow MUST 使用 Bun 替代 pnpm 进行依赖安装和构建。

**变更说明：**
- 原方案：`pnpm/action-setup@v4` + `pnpm install`
- 新方案：`oven-sh/setup-bun@v2` + `bun install`

#### Scenario: Bun 环境设置
- **WHEN** Workflow 执行
- **THEN** 使用 `oven-sh/setup-bun@v2` 安装 Bun
- **AND** 版本锁定为 `1.3.11`

#### Scenario: 依赖安装
- **WHEN** 执行依赖安装步骤
- **THEN** 使用 `bun install --frozen-lockfile`
- **AND** 生成 `bun.lock` 而非 `pnpm-lock.yaml`

#### Scenario: 构建命令
- **WHEN** 执行构建步骤
- **THEN** 使用 `bun run build`
- **AND** 生成 `.next/standalone` 产物

### Requirement: pnpm 依赖缓存
Workflow MUST 使用 Bun 缓存替代 pnpm 缓存。

**变更说明：**
- 原方案：缓存 `~/.pnpm-store` 或基于 `pnpm-lock.yaml`
- 新方案：缓存 Bun 的全局缓存目录

#### Scenario: Bun 缓存配置
- **WHEN** 配置缓存步骤
- **THEN** 缓存 Bun 的全局缓存目录
- **AND** 缓存键基于 `bun.lock` 的哈希

#### Scenario: 缓存命中
- **WHEN** `bun.lock` 未变更
- **THEN** 恢复缓存，跳过依赖下载

#### Scenario: 缓存未命中
- **WHEN** `bun.lock` 变更
- **THEN** 重新安装依赖并更新缓存

### Requirement: 构建产物验证
Workflow MUST 验证 Bun 构建的 standalone 产物完整性。

#### Scenario: standalone 产物验证
- **WHEN** `bun run build` 完成
- **THEN** 验证 `.next/standalone` 存在
- **AND** 验证 `.next/standalone/apps/app/server.js` 存在
- **AND** 验证 `.next/standalone/node_modules/.bun` 存在（非符号链接）

#### Scenario: 符号链接检查
- **WHEN** 检查 standalone 产物
- **THEN** `node_modules` 中无断裂的符号链接
- **AND** 所有依赖为实际目录
