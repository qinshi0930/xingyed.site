## Why

当前 CI/CD workflow (`.github/workflows/ci-cd.yml`) 中直接嵌入了 webhook 发送的复杂逻辑（HMAC-SHA256 签名、payload 构建、HTTP 请求），导致：
- Workflow 文件冗长（160+ 行），难以阅读和维护
- 业务逻辑分散在 YAML 中，无法独立测试
- 签名算法变更需要修改 workflow 文件
- 无法在本地模拟测试 webhook 发送流程
- YAML 中的字符串转义容易出错

将这部分逻辑抽离为独立脚本，可以让 Workflow 专注于流程编排，具体实现由脚本负责，职责更清晰。

## What Changes

- 创建 `scripts/deploy-webhook.ts` 脚本，封装 webhook 发送逻辑
  - 参数解析和验证
  - JSON payload 构建
  - HMAC-SHA256 签名生成
  - HTTP 请求发送与错误处理
  - 日志输出
- 简化 `.github/workflows/ci-cd.yml` 中的 webhook 触发步骤
  - 从 20+ 行 YAML 逻辑简化为 1 行脚本调用
  - 通过环境变量传递参数
  - 保留 `continue-on-error: true` 容错机制
- 添加脚本使用文档和测试说明

## Capabilities

### New Capabilities
- `webhook-deployment-script`: 独立的 webhook 发送脚本，支持 HMAC-SHA256 签名、参数验证、错误处理和本地测试

### Modified Capabilities
- 无（现有 spec 不变，这是实现层面的优化，不改变行为需求）

## Impact

- **Workflow 文件**: `.github/workflows/ci-cd.yml` 简化
- **新增脚本**: `scripts/deploy-webhook.ts` (TypeScript)
- **依赖**: 需要 `tsx` 运行时（已通过项目依赖提供）
- **GitHub Secrets**: 无需变更（继续使用 `DEPLOY_WEBHOOK_URL` 和 `WEBHOOK_SECRET`）
- **服务器端**: 无需变更（webhook 接收逻辑不变）
