## ADDED Requirements

### Requirement: Webhook script shall accept configuration via environment variables

脚本 MUST 通过环境变量接收所有配置参数，包括 webhook URL、secret、tag、image 等信息。

#### Scenario: All required environment variables provided
- **WHEN** 所有必需的环境变量都已设置（WEBHOOK_URL, WEBHOOK_SECRET, WEBHOOK_TAG, WEBHOOK_IMAGE, WEBHOOK_REPOSITORY, WEBHOOK_TRIGGERED_BY）
- **THEN** 脚本正常执行，构建 payload 并发送 webhook

#### Scenario: Missing required environment variable
- **WHEN** 缺少任一必需的环境变量（如 WEBHOOK_URL 未设置）
- **THEN** 脚本输出错误信息并立即退出，返回非 0 状态码

### Requirement: Webhook script shall generate HMAC-SHA256 signature

脚本 MUST 使用 HMAC-SHA256 算法为 payload 生成签名，并在 HTTP 请求头中携带。

#### Scenario: Signature generation
- **WHEN** 脚本接收到 payload 和 secret
- **THEN** 使用 `crypto.createHmac('sha256', secret)` 生成签名，格式为 `sha256=<hex-digest>`

#### Scenario: Signature included in request header
- **WHEN** 脚本发送 HTTP 请求
- **THEN** 请求头包含 `X-Hub-Signature-256: sha256=<signature>`

### Requirement: Webhook script shall construct valid JSON payload

脚本 MUST 构建包含所有必需字段的 JSON payload，用于审计和监控。

#### Scenario: Payload structure
- **WHEN** 脚本构建 payload
- **THEN** payload 包含以下字段：tag, image, repository, triggered_by

#### Scenario: No ref field required
- **WHEN** 服务器端已移除 ref 验证规则
- **THEN** payload 不包含 ref 字段

### Requirement: Webhook script shall implement retry logic

脚本 MUST 对临时性错误实现智能重试机制，提高部署可靠性。

#### Scenario: Retry on 5xx server error
- **WHEN** 服务器返回 5xx 错误（如 500、502、503）
- **THEN** 脚本重试最多 3 次，使用指数退避（2s → 4s → 8s）

#### Scenario: Retry on 429 rate limit
- **WHEN** 服务器返回 429 错误（限流）
- **THEN** 脚本重试最多 3 次，使用指数退避

#### Scenario: Retry on network error
- **WHEN** 网络请求失败（如连接超时、DNS 解析失败）
- **THEN** 脚本重试最多 3 次，使用指数退避

#### Scenario: No retry on 4xx client error
- **WHEN** 服务器返回 4xx 错误（除 429 外，如 400、403、404）
- **THEN** 脚本立即失败，不重试，输出错误信息

#### Scenario: Logging retry attempts
- **WHEN** 脚本进行重试
- **THEN** 输出日志包含尝试次数和失败原因（如 "Attempt 1/3 failed (HTTP 500)"）

### Requirement: Webhook script shall send HTTP POST request

脚本 MUST 向 webhook URL 发送 HTTP POST 请求，携带 JSON payload 和签名头。

#### Scenario: Successful webhook delivery
- **WHEN** 服务器返回 HTTP 200 状态码
- **THEN** 脚本输出成功日志并正常退出（状态码 0）

#### Scenario: Server returns error status
- **WHEN** 服务器返回非 2xx 状态码（如 403、500）
- **THEN** 脚本输出错误信息（包含状态码）并退出，返回非 0 状态码

#### Scenario: Network error
- **WHEN** 网络请求失败（如连接超时、DNS 解析失败）
- **THEN** 脚本捕获异常，输出错误信息并退出，返回非 0 状态码

### Requirement: Webhook script shall provide structured logging

脚本 MUST 在执行过程中输出结构化的日志信息，便于调试和监控。

#### Scenario: Start logging
- **WHEN** 脚本开始执行
- **THEN** 输出 webhook 触发信息，包含 tag 和 image 详情

#### Scenario: Success logging
- **WHEN** webhook 发送成功
- **THEN** 输出成功日志，包含 HTTP 状态码

#### Scenario: Error logging
- **WHEN** webhook 发送失败
- **THEN** 输出错误日志，包含失败原因和详细信息

### Requirement: Webhook script shall be executable via npx tsx

脚本 MUST 能够通过 `npx tsx scripts/deploy-webhook.ts` 命令直接运行，无需额外编译步骤。

#### Scenario: Direct execution
- **WHEN** 在 CI/CD 环境中执行 `npx tsx scripts/deploy-webhook.ts`
- **THEN** 脚本正常执行，TypeScript 被正确转译和运行

#### Scenario: Local testing
- **WHEN** 在本地开发环境设置环境变量后执行脚本
- **THEN** 脚本正常执行，可用于模拟测试 webhook 发送流程

### Requirement: Workflow shall call webhook script with environment variables

CI/CD workflow MUST 通过环境变量向脚本传递所有必需参数，而非在 YAML 中嵌入逻辑。

#### Scenario: Workflow step configuration
- **WHEN** workflow 执行到 webhook 触发步骤
- **THEN** 通过 `env` 字段设置所有环境变量，然后运行 `npx tsx scripts/deploy-webhook.ts`

#### Scenario: Workflow error tolerance
- **WHEN** 脚本执行失败（返回非 0 状态码）
- **THEN** workflow 继续执行（`continue-on-error: true`），不阻断整个 CI/CD 流程
