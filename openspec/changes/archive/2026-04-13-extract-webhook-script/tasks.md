## 1. 环境准备

- [ ] 1.1 添加 `tsx` 到 devDependencies：`pnpm add -D tsx`
- [ ] 1.2 验证 tsx 安装成功：`npx tsx --version`

## 2. 创建 Webhook 脚本

- [ ] 2.1 创建 `scripts/deploy-webhook.ts` 文件，定义 TypeScript 接口（WebhookPayload, WebhookOptions）
- [ ] 2.2 实现 `generateSignature(payload, secret)` 函数，使用 `crypto.createHmac` 生成 HMAC-SHA256 签名
- [ ] 2.3 实现 `validateParams()` 函数，验证所有必需环境变量已设置
- [ ] 2.4 实现 `sendWebhook(options)` 函数，使用 `fetch` 发送 HTTP POST 请求
- [ ] 2.5 实现 `sendWebhookWithRetry(options, maxRetries)` 函数，添加智能重试逻辑
- [ ] 2.6 实现 `main()` 主函数，编排参数读取、签名生成和请求发送
- [ ] 2.7 添加结构化日志输出（开始、成功、失败、重试）

## 3. 测试 Webhook 脚本

- [ ] 3.1 在本地创建测试用 `.env.test` 文件，配置测试环境变量
- [ ] 3.2 执行 `npx tsx scripts/deploy-webhook.ts` 验证脚本可运行
- [ ] 3.3 测试参数验证：移除一个环境变量，验证脚本报错退出
- [ ] 3.4 测试签名生成：验证签名格式为 `sha256=<64位十六进制>`
- [ ] 3.5 测试网络错误：使用无效的 webhook URL，验证错误处理
- [ ] 3.6 测试服务器拒绝：使用错误的 secret，验证 403 错误处理
- [ ] 3.7 测试重试机制：使用 mock 服务器返回 500，验证重试 3 次

## 4. 更新 CI/CD Workflow

- [ ] 4.1 重命名 GitHub Secret：`DEPLOY_WEBHOOK_URL` → `WEBHOOK_URL`
- [ ] 4.2 简化 `.github/workflows/ci-cd.yml` 中的 "Trigger deployment webhook" 步骤
- [ ] 4.3 将 webhook 逻辑替换为环境变量设置 + `npx tsx scripts/deploy-webhook.ts`
- [ ] 4.4 保留 `continue-on-error: true` 容错机制
- [ ] 4.5 验证 workflow 文件 YAML 语法正确

## 5. 端到端验证

- [ ] 5.1 提交所有更改到 git
- [ ] 5.2 创建测试 tag（如 `v0.0.1-test`）并推送
- [ ] 5.3 在 GitHub Actions 中验证 workflow 执行成功
- [ ] 5.4 验证 webhook 步骤输出成功日志
- [ ] 5.5 登录服务器验证 webhook 接收成功并触发部署
- [ ] 5.6 检查应用是否正常部署新版本

## 6. 清理和优化

- [ ] 6.1 删除测试用 `.env.test` 文件
- [ ] 6.2 添加脚本使用说明到 `scripts/README.md`（可选）
- [ ] 6.3 运行 `pnpm lint` 确保代码符合规范
- [ ] 6.4 更新相关文档（如 README.md 中的部署说明）
