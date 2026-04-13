## Why

当前项目已有 `build-release.yml`（发布 Release）和 `build-test.yml`（构建测试），但缺少 Docker 镜像构建和推送流程。需要将完整的 CI/CD 流程整合：构建 → 发布 Release → 构建 Docker 镜像 → 推送至 GHCR → Webhook 触发服务器部署，实现完全自动化的发布流程。

## What Changes

- **Dockerfile 重构**：从单阶段构建改为多阶段构建（builder + runner），使 CI/CD 可以独立构建
- **新增 CI/CD Workflow**：整合构建、Release、Docker 镜像推送、Webhook 触发的完整流水线
- **保留构建缓存**：复用已有的 pnpm 依赖缓存配置，加速 CI 构建
- **更新 .dockerignore**：调整规则以支持多阶段 Dockerfile 构建

## Capabilities

### New Capabilities
- `github-actions-cicd`: GitHub Actions 完整 CI/CD 流水线，包括构建、Release、Docker 镜像推送、Webhook 触发部署
- `dockerfile-multi-stage`: Dockerfile 多阶段构建支持，使 CI/CD 无需本地构建产物

### Modified Capabilities
- 无

## Impact

- **Dockerfile**：从单阶段（28行）改为多阶段（约45行）
- **`.github/workflows/`**：新增 `ci-cd.yml` 工作流
- **`.dockerignore`**：可能需要调整（移除 Dockerfile 排除规则）
- **本地开发**：`pnpm docker:deploy` 仍然可用（Docker 会使用 builder 阶段的缓存）
- **服务器部署**：通过 Webhook 自动拉取镜像部署，无需手动操作
