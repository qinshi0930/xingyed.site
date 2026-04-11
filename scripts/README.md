# Scripts

## deploy-webhook.ts

部署 Webhook 脚本，用于 CI/CD 流程中触发服务器部署。

### 功能

- ✅ HMAC-SHA256 签名验证
- ✅ 智能重试机制（5xx/429/网络异常重试 3 次）
- ✅ 参数验证和结构化日志
- ✅ 零外部依赖（使用 Node.js 内置模块）

### 环境变量

运行脚本前必须设置以下环境变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `WEBHOOK_URL` | Webhook 端点 URL | `https://server.example.com/hooks/deploy` |
| `WEBHOOK_SECRET` | HMAC 签名密钥 | `your-secret-key` |
| `WEBHOOK_TAG` | Docker 镜像 tag | `v1.0.0` |
| `WEBHOOK_IMAGE` | 完整镜像名称 | `ghcr.io/user/repo:v1.0.0` |
| `WEBHOOK_REPOSITORY` | 仓库名称 | `user/repo` |
| `WEBHOOK_TRIGGERED_BY` | 触发者 | `github-actor` |

### 使用方法

#### 本地测试

```bash
# 设置环境变量
export WEBHOOK_URL=http://localhost:9000/hooks/deploy
export WEBHOOK_SECRET=test-secret
export WEBHOOK_TAG=v0.0.1-test
export WEBHOOK_IMAGE=ghcr.io/test/repo:v0.0.1-test
export WEBHOOK_REPOSITORY=test/repo
export WEBHOOK_TRIGGERED_BY=test-user

# 运行脚本
npx tsx scripts/deploy-webhook.ts
```

#### CI/CD 中使用

参见 `.github/workflows/ci-cd.yml` 中的 "Trigger deployment webhook" 步骤。

### 重试策略

- **5xx 错误**（服务器错误）：重试 3 次，指数退避（2s → 4s → 8s）
- **429 错误**（限流）：重试 3 次，指数退避
- **网络异常**（超时、DNS 失败）：重试 3 次，指数退避
- **4xx 错误**（配置错误，除 429 外）：不重试，立即失败

### Payload 结构

```json
{
  "tag": "v1.0.0",
  "image": "ghcr.io/user/repo:v1.0.0",
  "repository": "user/repo",
  "triggered_by": "github-actor"
}
```

### HTTP 请求头

```
Content-Type: application/json
X-Hub-Signature-256: sha256=<hmac-sha256-hex-digest>
```

### 测试

#### 测试参数验证

```bash
# 不设置环境变量，应该报错
npx tsx scripts/deploy-webhook.ts
```

#### 测试网络错误重试

```bash
# 使用无效的 URL，应该重试 3 次
export WEBHOOK_URL=http://localhost:9999/hooks/deploy
# ... 设置其他环境变量
npx tsx scripts/deploy-webhook.ts
```

### 注意事项

- ⚠️ 不要将真实的 `WEBHOOK_SECRET` 提交到代码仓库
- ⚠️ 使用 GitHub Secrets 管理敏感信息
- ⚠️ 本地测试时使用测试密钥
