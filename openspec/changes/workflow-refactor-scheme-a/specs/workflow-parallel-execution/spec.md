## ADDED Requirements

### Requirement: build-release.yml and docker-publish.yml SHALL execute in parallel

当推送 tag 时，`build-release.yml` 和 `docker-publish.yml` MUST 并行执行。

#### Scenario: Both workflows triggered by tag push
- **WHEN** 推送 tag `v1.0.0`
- **THEN** GitHub Actions 同时触发两个 workflow

#### Scenario: Independent execution
- **WHEN** 两个 workflow 同时运行
- **THEN** 互不阻塞，独立执行

#### Scenario: Failure isolation
- **WHEN** `docker-publish.yml` 失败
- **THEN** `build-release.yml` 不受影响，继续创建 Release

### Requirement: build-release.yml SHALL call build-test.yml via workflow_call

`build-release.yml` MUST 通过 `workflow_call` 复用 `build-test.yml` 的构建逻辑。

#### Scenario: workflow_call invocation
- **WHEN** `build-release.yml` 执行
- **THEN** 调用 `./.github/workflows/build-test.yml`

#### Scenario: Secrets inherited
- **WHEN** 调用 `build-test.yml`
- **THEN** 使用 `secrets: inherit` 传递所有 secrets

#### Scenario: Build dependency enforced
- **WHEN** `release` job 执行
- **THEN** 等待 `build` job 完成（`needs: build`）
