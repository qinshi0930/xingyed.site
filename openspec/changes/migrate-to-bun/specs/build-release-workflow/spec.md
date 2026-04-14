## MODIFIED Requirements

### Requirement: 本地构建流程
本地构建流程 MUST 使用 Bun 替代 pnpm。

**变更说明：**
- 原方案：`pnpm build` 生成 standalone 产物
- 新方案：`bun run build` 生成 standalone 产物

#### Scenario: 本地构建命令
- **WHEN** 开发者执行本地构建
- **THEN** 使用 `bun run build`
- **AND** 生成 `.next/standalone` 目录

#### Scenario: 构建产物结构
- **WHEN** 构建完成
- **THEN** `.next/standalone` 包含 `apps/app/server.js`
- **AND** `.next/standalone/node_modules/.bun` 包含所有依赖（实际目录）

#### Scenario: Docker 本地构建
- **WHEN** 执行 `bun run docker:build`
- **THEN** 先执行 `bun run build`
- **AND** 验证 `.next/standalone` 存在
- **AND** 执行 `podman-compose build`

### Requirement: Docker 本地部署
本地 Docker 部署流程 MUST 使用 Bun 构建。

**变更说明：**
- 原方案：`pnpm run docker:deploy`
- 新方案：`bun run docker:deploy`

#### Scenario: 一键部署
- **WHEN** 执行 `bun run docker:deploy`
- **THEN** 依次执行：构建 → 验证 → podman-compose build → podman-compose up

#### Scenario: 构建验证
- **WHEN** 构建完成
- **THEN** 验证 `.next/standalone` 存在
- **AND** 如果验证失败，输出错误并退出

### Requirement: Release 构建
Release Workflow MUST 使用 Bun 进行构建。

**变更说明：**
- 原方案：build-release.yml 使用 pnpm
- 新方案：build-release.yml 使用 Bun

#### Scenario: Release 构建命令
- **WHEN** Workflow 执行构建
- **THEN** 使用 `bun install --frozen-lockfile`
- **AND** 使用 `bun run build`

#### Scenario: Release 产物打包
- **WHEN** 打包 Release 产物
- **THEN** 包含 `.next/standalone`（完整依赖）
- **AND** 不包含 `pnpm-lock.yaml`（已被 `bun.lock` 替代）
