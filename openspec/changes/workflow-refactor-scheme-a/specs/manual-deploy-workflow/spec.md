## ADDED Requirements

### Requirement: manual-deploy.yml SHALL support manual deployment trigger

`manual-deploy.yml` MUST 支持通过 `workflow_dispatch` 手动触发部署。

#### Scenario: Manual trigger with image tag input
- **WHEN** 用户在 GitHub Actions 页面手动触发 workflow
- **THEN** 要求输入 `image_tag` 参数（如 `v1.0.0`）

#### Scenario: Image tag format validation
- **WHEN** 用户输入 image_tag
- **THEN** 验证格式符合 `^v[0-9]+\.[0-9]+\.[0-9]+` 正则表达式
- **AND** 如果格式不正确，workflow 立即失败并显示错误提示

### Requirement: manual-deploy.yml SHALL trigger deployment webhook

`manual-deploy.yml` MUST 通过 `deploy-webhook.ts` 脚本发送 Webhook 通知服务器部署。

#### Scenario: Webhook script executed with correct environment
- **WHEN** workflow 执行部署步骤
- **THEN** 通过 `env` 设置所有必需环境变量：
  - `WEBHOOK_URL`: Webhook 端点 URL
  - `WEBHOOK_SECRET`: HMAC 签名密钥
  - `WEBHOOK_TAG`: 用户输入的镜像 tag
  - `WEBHOOK_IMAGE`: 完整镜像名（`ghcr.io/qinshi0930/xingyed.site:{tag}`）
  - `WEBHOOK_REPOSITORY`: GitHub 仓库名
  - `WEBHOOK_TRIGGERED_BY`: 触发者（`manual`）

#### Scenario: Webhook HMAC signature
- **WHEN** 发送 Webhook 请求
- **THEN** `deploy-webhook.ts` 自动生成 HMAC-SHA256 签名
- **AND** 在请求头中包含 `X-Hub-Signature-256`

#### Scenario: Webhook success response
- **WHEN** Webhook 请求成功（HTTP 200）
- **THEN** workflow 显示成功消息并退出

#### Scenario: Webhook failure handling
- **WHEN** Webhook 请求失败（非 2xx 状态码）
- **THEN** workflow 显示错误消息并返回非 0 状态码
- **AND** workflow 标记为失败（红色 ✗）

### Requirement: manual-deploy.yml SHALL provide deployment feedback

`manual-deploy.yml` MUST 提供清晰的部署反馈信息。

#### Scenario: Deployment summary on success
- **WHEN** Webhook 触发成功
- **THEN** 输出部署摘要：
  - Tag: 部署的镜像 tag
  - Image: 完整镜像名
  - Repository: 仓库名
  - Triggered by: 触发者

#### Scenario: Checkout repository
- **WHEN** workflow 开始执行
- **THEN** 使用 `actions/checkout@v4` 检出代码
- **AND** 确保 `scripts/deploy-webhook.ts` 可用
