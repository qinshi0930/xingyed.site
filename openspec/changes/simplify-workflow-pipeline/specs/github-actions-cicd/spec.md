## MODIFIED Requirements

### Requirement: CI/CD Workflow 触发
Workflow SHALL 统一在单一文件中处理多种触发条件，而非分散在多个 workflow 文件中。

#### Scenario: Tag 推送触发
- **WHEN** 推送 `v1.0.0` 等版本 tag
- **THEN** 触发 `ci-cd.yml` 工作流
- **THEN** 执行完整的 code-quality → build → release → docker-publish 流程

#### Scenario: Push to main 触发
- **WHEN** 推送到 main 分支（非 tag）
- **THEN** 触发 `ci-cd.yml` 工作流
- **THEN** 仅执行 code-quality 和 build job
- **THEN** 不执行 release 和 docker-publish job

#### Scenario: PR 触发
- **WHEN** 创建或更新 PR
- **THEN** 触发 `ci-cd.yml` 工作流
- **THEN** 仅执行 code-quality job
- **THEN** 不执行 build、release、docker-publish job

## REMOVED Requirements

### Requirement: 多文件 Workflow 架构
**Reason**: 采用单 workflow 多 job 架构替代，解决 artifact 跨域问题
**Migration**: 所有逻辑迁移至 `ci-cd.yml`，删除 `build-test.yml`、`build-release.yml`、`docker-publish.yml`
