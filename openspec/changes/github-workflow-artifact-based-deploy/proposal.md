## Why

当前 CI/CD 架构存在以下问题：

1. **重复构建浪费资源**：`build-release.yml` 和 `docker-publish.yml` 都通过 `workflow_call` 调用 `build-test.yml`，导致同一次 tag 推送触发两次完整的构建流程
2. **构建产物不一致风险**：两次构建可能因缓存、依赖版本微调等因素产生差异，违反"构建一次，部署多次"原则
3. **Dockerfile 路径错误**：当前 Dockerfile 中的 COPY 路径假设从 monorepo 根目录构建，但实际应该是 `apps/app/.next/...` 结构
4. **artifact 缺少部署文件**：当前 artifact 不包含 `Dockerfile` 和 `podman-compose.yml`，导致 `docker-publish.yml` 仍需 checkout 代码
5. **artifact 保留时间过短**：`retention-days: 1` 要求在极短时间内完成发布流程

## What Changes

- **改造** `build-test.yml` 为完整的代码质量检查 + 构建流程，上传包含 Dockerfile 和 podman-compose.yml 的 artifact
- **修改** `build-release.yml` 移除 `workflow_call` 调用，改为直接下载 artifact 并检查可用性
- **修改** `docker-publish.yml` 移除 `workflow_call` 调用和 checkout 步骤，直接使用 artifact 构建 Docker 镜像
- **修正** `Dockerfile` 中的 COPY 路径，匹配 monorepo 真实的目录结构（`apps/app/.next/...`）
- **增加** artifact 可用性检查，不可用时提供明确的错误提示

## Capabilities

### New Capabilities

- `artifact-based-deployment`: 基于 artifact 的部署流程，build-release 和 docker-publish 直接下载 artifact，不再重复构建
- `artifact-availability-check`: artifact 可用性检查机制，确保发布前 main 分支构建已成功
- `monorepo-path-isolation`: monorepo artifact 路径隔离，保持 `apps/app/` 前缀确保多子项目隔离性

### Modified Capabilities

- `build-test-workflow`: 扩展为代码质量检查（lint + type check）+ 构建 + artifact 上传（包含 Dockerfile 和 podman-compose.yml）
- `build-release-workflow`: 从"调用 build-test + 构建"改为"下载 artifact + 检查可用性 + 压缩发布"
- `docker-publish-workflow`: 从"调用 build-test + checkout + 构建"改为"下载 artifact + 直接使用 Dockerfile 构建镜像"
- `dockerfile-paths`: 修正 Dockerfile 中的 COPY 路径，匹配 monorepo 真实结构

## Impact

**Affected files**:
- `Dockerfile`（修正 COPY 路径）
- `.github/workflows/build-test.yml`（增加 lint + 调整 artifact 上传内容）
- `.github/workflows/build-release.yml`（移除 workflow_call + 增加 artifact 检查）
- `.github/workflows/docker-publish.yml`（移除 workflow_call + 移除 checkout + 增加 artifact 检查）

**CI/CD behavior changes**:
- 推送 main 分支时，执行完整的代码质量检查 + 构建 + artifact 上传
- 推送 tag 时，build-release 和 docker-publish 直接使用 main 分支的 artifact，不再重复构建
- 如果 artifact 不存在（main 分支未构建），发布 workflow 会失败并提示用户先推送 main 分支
- artifact 保留 1 天，要求发布流程紧凑（push main → 验证 → 打 tag）

**Breaking changes**: 
- 必须先推送 main 分支等待构建完成，才能打 tag 发布
- 如果直接打 tag 而 main 分支未构建，发布会失败
