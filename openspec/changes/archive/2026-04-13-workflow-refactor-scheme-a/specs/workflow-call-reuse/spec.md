## ADDED Requirements

### Requirement: build-test.yml SHALL support workflow_call trigger

`build-test.yml` MUST 添加 `workflow_call` 触发器，允许被其他 workflow 调用。

#### Scenario: workflow_call trigger added
- **WHEN** 查看 `build-test.yml` 的 `on` 部分
- **THEN** 包含 `workflow_call` 触发器

#### Scenario: Existing triggers preserved
- **WHEN** `build-test.yml` 被 PR 或 push main 触发
- **THEN** 正常执行构建验证流程（行为不变）

### Requirement: build-test.yml SHALL expose build outputs

`build-test.yml` MUST 通过 `outputs` 暴露构建状态，供调用方使用。

#### Scenario: Build success output
- **WHEN** 构建验证成功
- **THEN** workflow 输出 `status: success`

#### Scenario: Build failure output
- **WHEN** 构建验证失败
- **THEN** workflow 输出 `status: failure` 并返回非 0 状态码
