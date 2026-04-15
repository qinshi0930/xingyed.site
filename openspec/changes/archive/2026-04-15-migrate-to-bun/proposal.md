## Why

pnpm 的符号链接依赖管理机制在 Docker 容器化部署场景中存在固有缺陷。standalone 产物中的符号链接在 CI/CD artifact 传递过程中会断裂，导致生产容器启动时出现 `MODULE_NOT_FOUND` 错误。虽然可以通过在 Dockerfile 中重新安装依赖（`pnpm install --prod`）作为变通方案，但这增加了构建复杂性和时间。

Bun 作为现代化包管理器，其 `node_modules/.bun` 结构使用实际目录而非符号链接，从根本上解决了这一问题，同时提供更快的安装速度和更小的 lockfile。

## What Changes

- 将包管理器从 pnpm 替换为 Bun（版本 1.3.11+）
- 更新所有 package.json 中的脚本命令（`pnpm` → `bun`）
- 移除 pnpm 特有的配置（`pnpm-workspace.yaml`、`pnpm.overrides`）
- 简化 Dockerfile（移除 `pnpm install --prod` 重新安装依赖步骤）
- 更新 CI/CD workflow 使用 Bun 进行依赖安装和构建
- 保留 Node.js 作为生产运行时（`node apps/app/server.js`）

## Capabilities

### New Capabilities
- `bun-package-manager`: 项目使用 Bun 作为包管理器和 TypeScript 执行工具，包括安装、构建、脚本执行等工作流的完整配置

### Modified Capabilities
- `dockerfile-multi-stage`: Docker 构建流程简化，不再需要在 runner 阶段重新安装依赖
- `github-actions-cicd`: CI/CD workflow 中的包管理器从 pnpm 替换为 Bun
- `build-release-workflow`: 本地构建和 Release 流程使用 Bun 替代 pnpm

## Impact

**Affected Systems:**
- 本地开发环境：需要安装 Bun
- CI/CD Pipeline：GitHub Actions 中的 setup-pnpm 替换为 setup-bun
- Docker 构建：Dockerfile 简化，构建时间缩短
- 部署流程：不再需要处理符号链接断裂问题

**Breaking Changes:**
- **BREAKING**: 开发者需要从 pnpm 切换到 Bun（`curl -fsSL https://bun.sh/install | bash`）
- **BREAKING**: CI/CD 环境需要安装 Bun 而非 pnpm

**Dependencies:**
- 移除：`pnpm`、`tsx`（Bun 原生支持 TypeScript）
- 新增：`bun`（版本 1.3.11+）

**Risk Level:** 中等
- 所有依赖已验证兼容（better-auth, Firebase, MDX, Redis）
- 构建和容器运行已验证通过
- 主要风险在于开发者环境迁移和 CI/CD 配置更新
