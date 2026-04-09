## Why

当前的 Docker 构建流程采用多阶段构建（builder + runner），在 Docker 内部完成依赖安装和构建，导致构建时间长、镜像体积大、Dockerfile 复杂。改为本地构建 + Docker 打包产物模式可以显著提升构建效率、简化 Dockerfile、减小镜像体积。

## What Changes

- **Dockerfile 简化**：从多阶段构建改为单阶段，仅包含运行时环境和构建产物
- **`.dockerignore` 调整**：添加 `.next/standalone` 和 `.next/static` 例外规则，允许构建产物进入 Docker 上下文
- **npm scripts 增强**：添加 `docker:build`、`docker:up`、`docker:deploy` 脚本，封装构建流程并添加产物验证
- **构建流程变更**：本地先执行 `pnpm build` 生成 standalone 产物，Docker 仅负责打包镜像

## Capabilities

### New Capabilities
- `docker-standalone-build`: Docker 本地构建 + 镜像打包流程，包括 Dockerfile 简化、npm scripts 封装、构建产物验证

### Modified Capabilities
- 无

## Impact

- **Dockerfile**：从 68 行多阶段构建简化为约 20 行单阶段
- **`.dockerignore`**：添加 2 行例外规则
- **`package.json`**：新增 3 个 Docker 相关 npm scripts
- **构建流程**：开发者需要先执行 `pnpm build`，再执行 Docker 构建
- **CI/CD**：不涉及（webhook 已禁用）
