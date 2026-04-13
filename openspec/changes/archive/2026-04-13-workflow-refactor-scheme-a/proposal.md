## Why

当前 GitHub Actions workflows 存在功能重复和职责混乱的问题：

1. **`ci-cd.yml` 和 `build-release.yml` 功能重复**：两者都由 `push tags: v*` 触发，执行相同的构建+Release 流程，浪费 CI 资源
2. **违反 workflow 分类规范**：`ci-cd.yml` 混合了构建测试和部署逻辑，违反"构建测试类 vs 部署类"职责分离原则
3. **未采用 workflow_call 复用**：`build-test.yml` 未改造为可复用 workflow，导致 `build-release.yml` 和 `ci-cd.yml` 重复实现构建逻辑
4. **废弃文件未清理**：`deploy-advanced.yml.disabled` 和 `deploy.yml.disabled` 已无用处

## What Changes

- **删除** `ci-cd.yml`（功能重复，职责混乱）
- **改造** `build-test.yml` 支持 `workflow_call`（实现逻辑复用）
- **简化** `build-release.yml` 调用 `build-test.yml`（避免重复构建逻辑）
- **创建** `docker-publish.yml`（独立负责 Docker 镜像构建和 GHCR 推送）
- **创建** `manual-deploy.yml`（手动触发部署，通过 Webhook 通知服务器）
- **修改** `webhook/hooks.json`（移除 ref 验证，只保留 HMAC 签名）
- **删除** 废弃的 `.disabled` 文件

## Capabilities

### New Capabilities

- `workflow-call-reuse`: 改造 `build-test.yml` 为可复用 workflow，支持 `workflow_call` 触发
- `docker-publish-deploy`: 独立的 Docker 镜像构建 workflow，包含 GHCR 推送
- `manual-deploy-workflow`: 手动触发部署 workflow，通过 Webhook 通知服务器拉取镜像并部署
- `workflow-parallel-execution`: `build-release.yml` 和 `docker-publish.yml` 并行执行，提升 CI/CD 效率

### Modified Capabilities

- `build-release-workflow`: 简化为只负责构建验证和 Release 创建，通过 `workflow_call` 复用 `build-test.yml`
- `build-test-workflow`: 添加 `workflow_call` 支持，保持原有 PR/push 触发不变

## Impact

**Affected workflows**:
- `.github/workflows/build-test.yml`（添加 `workflow_call` 支持）
- `.github/workflows/build-release.yml`（简化，调用 `build-test.yml`）
- `.github/workflows/ci-cd.yml`（删除）
- `.github/workflows/docker-publish.yml`（新建）
- `.github/workflows/manual-deploy.yml`（新建）
- `webhook/hooks.json`（修改 trigger-rule）
- `.github/workflows/deploy-*.yml.disabled`（删除）

**CI/CD behavior changes**:
- 推送 tag 时，`build-release.yml` 和 `docker-publish.yml` 并行执行（原 `ci-cd.yml` 串行执行）
- 构建逻辑通过 `workflow_call` 复用，避免代码重复
- Docker 镜像构建独立运行，失败不影响 Release 创建
- 部署通过手动触发 `manual-deploy.yml`，发送 Webhook 让服务器拉取镜像并部署

**No breaking changes**: 对外行为保持一致（仍然创建 Release、推送镜像、触发部署）
