## MODIFIED Requirements

### Requirement: Dockerfile 多阶段结构
Dockerfile MUST 使用单阶段构建，直接复制 Bun 构建的 standalone 产物，无需重新安装依赖。

**变更说明：**
- 原方案：多阶段构建（builder + runner），runner 阶段执行 `pnpm install --prod`
- 新方案：单阶段构建，直接复制 standalone 产物（依赖已完整）

#### Scenario: Runner 阶段配置
- **WHEN** 检查 Dockerfile
- **THEN** runner 阶段包含：node:22-alpine、非 root 用户、产物复制、启动命令
- **AND** 不包含 pnpm 安装或依赖安装步骤

#### Scenario: 产物复制
- **WHEN** Docker 构建执行
- **THEN** 复制 `.next/standalone`（包含完整 node_modules/.bun）
- **AND** 复制 `.next/static`、`public`、`contents`、`packages`

#### Scenario: 依赖完整性验证
- **WHEN** 容器启动
- **THEN** 所有依赖可用，无 `MODULE_NOT_FOUND` 错误
- **AND** 无需执行额外的依赖安装步骤

### Requirement: Docker 构建简化
Dockerfile MUST 移除 pnpm 相关配置，直接使用 Bun 构建的产物。

**变更说明：**
- 移除：`COPY pnpm-lock.yaml ./`
- 移除：`RUN pnpm install --prod --frozen-lockfile`
- 移除：`corepack enable` 和 pnpm 安装

#### Scenario: 构建步骤减少
- **WHEN** 对比新旧 Dockerfile
- **THEN** 新 Dockerfile 步骤数减少至少 2 步
- **AND** 构建时间缩短（无需下载和安装依赖）

#### Scenario: 镜像体积对比
- **WHEN** 对比新旧镜像
- **THEN** 新镜像体积不大于旧镜像
- **AND** 不包含 pnpm 缓存或额外依赖
