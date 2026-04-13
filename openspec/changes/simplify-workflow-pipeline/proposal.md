## Why

当前的 GitHub Actions workflow 采用多文件架构（build-test.yml、build-release.yml、docker-publish.yml、manual-deploy.yml），导致以下问题：

1. **Artifact 跨域问题**：不同 workflow 触发时产生不同的 run_id，artifact 无法跨 workflow run 下载，导致打 tag 时 release 和 docker 发布流程失败
2. **触发逻辑分散**：push to main 和 push tag 的触发条件分布在多个文件中，难以理解和维护
3. **重复的环境配置**：多个 workflow 文件重复 checkout、setup pnpm/node、cache、install 等步骤

## What Changes

- 合并所有 CI/CD 逻辑到单一 `ci-cd.yml` workflow 文件
- 采用多 job 架构，通过条件控制（`if`）实现不同触发场景的执行策略
- 消除 artifact 跨域问题：同一 workflow run 内天然共享 artifact
- 保留适度的 job 职责分离，维持代码可读性
- 删除旧的 workflow 文件（build-test.yml、build-release.yml、docker-publish.yml）

## Capabilities

### New Capabilities
- `unified-ci-cd-pipeline`: 统一 CI/CD pipeline，包含 code-quality、build、release、docker-publish 四个 job，通过触发条件控制执行流程

### Modified Capabilities
- `github-actions-cicd`: 简化触发规则，明确不同事件类型的执行范围
- `build-release-workflow`: 从独立 workflow 改为统一 workflow 中的条件 job

## Impact

- **Affected Files**:
  - 新建: `.github/workflows/ci-cd.yml`
  - 删除: `.github/workflows/build-test.yml`
  - 删除: `.github/workflows/build-release.yml`
  - 删除: `.github/workflows/docker-publish.yml`
  - 保留: `.github/workflows/manual-deploy.yml`（本次不改造）
  
- **Behavior Changes**:
  - PR to main: 仅执行 code-quality（lint + type check），不触发 build
  - Push to main: 执行 code-quality + build，上传 artifact
  - Push tag v*: 执行 code-quality + build + release + docker-publish（完整流程）
  - **不再使用 workflow_dispatch**：暂时移除，后续改造 manual-deploy 时再加
  - **不再使用 paths-ignore**：确保 tag 推送 100% 触发 workflow
  
- **Artifact Strategy**:
  - 同一 workflow run 内通过 upload/download-artifact 传递构建产物
  - Artifact retention 从 1 天调整为 7 天（应对延迟打 tag 场景）
  - 保持完整 monorepo 路径结构（因上传路径前缀不一致）
  
- **Security**:
  - code-quality job 不传递 GitHub API secrets（支持 Fork PR）
  - build job 传递 secrets（仅在 push main/tag 时执行）
  - Workflow 级别声明 permissions：contents: write + packages: write

