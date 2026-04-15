## ADDED Requirements

### Requirement: Bun 作为包管理器
项目 MUST 使用 Bun（版本 1.3.11+）作为包管理器，替代 pnpm。

#### Scenario: Bun 安装依赖
- **WHEN** 执行 `bun install`
- **THEN** 所有依赖安装到 `node_modules/.bun` 目录（实际目录，非符号链接）

#### Scenario: Bun lockfile 生成
- **WHEN** 执行 `bun install`
- **THEN** 生成 `bun.lock` 文件（替代 `pnpm-lock.yaml`）

#### Scenario: workspace 依赖解析
- **WHEN** 执行 `bun install`
- **THEN** monorepo workspace 依赖正确解析（`@repo/types`、`@repo/utils`）

### Requirement: Bun 作为 TypeScript 执行工具
项目 MUST 使用 Bun 原生 TypeScript 支持，替代 tsx/ts-node。

#### Scenario: 直接运行 TypeScript 脚本
- **WHEN** 执行 `bun run scripts/deploy-webhook.ts`
- **THEN** 脚本直接执行，无需 tsx 或 ts-node

#### Scenario: seed 脚本执行
- **WHEN** 执行 `bun run src/lib/seed/index.ts`
- **THEN** seed 脚本正常运行

### Requirement: package.json workspaces 配置
项目 MUST 在根 package.json 中使用 `workspaces` 字段配置 monorepo。

#### Scenario: workspaces 字段定义
- **WHEN** 检查根 package.json
- **THEN** 包含 `"workspaces": ["apps/app", "packages/*"]`

#### Scenario: pnpm-workspace.yaml 移除
- **WHEN** 检查项目根目录
- **THEN** 不存在 `pnpm-workspace.yaml` 文件

### Requirement: packageManager 字段
所有 package.json MUST 声明 `packageManager` 字段为 Bun。

#### Scenario: 根 package.json 声明
- **WHEN** 检查根 package.json
- **THEN** 包含 `"packageManager": "bun@1.3.11"`

#### Scenario: apps/app package.json 声明
- **WHEN** 检查 apps/app/package.json
- **THEN** 包含 `"packageManager": "bun@1.3.11"`

### Requirement: Bun 脚本命令
所有 package.json 中的脚本 MUST 使用 Bun 命令。

#### Scenario: 开发服务器启动
- **WHEN** 执行 `bun run dev`
- **THEN** 使用 `bun --bun next dev` 启动（不使用 Turbopack）

#### Scenario: 生产构建
- **WHEN** 执行 `bun run build`
- **THEN** 使用 `bun --bun next build` 构建（不使用 Turbopack）

#### Scenario: 生产服务器启动
- **WHEN** 执行 `bun run start`
- **THEN** 使用 `bun --bun next start` 启动

### Requirement: 关键依赖兼容性
所有关键依赖 MUST 在 Bun 环境下正常工作。

#### Scenario: better-auth 导入
- **WHEN** 导入 `better-auth`
- **THEN** 无错误，类型正常

#### Scenario: Firebase 导入
- **WHEN** 导入 `firebase` 相关模块
- **THEN** 无错误，构建正常

#### Scenario: sharp 原生模块
- **WHEN** 使用 `sharp` 图像处理
- **THEN** 原生模块正常加载，无编译错误

#### Scenario: ioredis 连接
- **WHEN** 使用 `ioredis` 连接 Redis
- **THEN** 连接正常，命令执行成功
