## Context

当前 CI/CD workflow 中 webhook 发送逻辑直接嵌入在 YAML 的 `run` 字段中，包含：
- 使用 `jq` 构建 JSON payload
- 使用 `openssl` 生成 HMAC-SHA256 签名
- 使用 `curl` 发送 HTTP 请求
- 错误处理通过 `|| echo` 实现

这种实现方式存在以下问题：
1. YAML 中嵌入 Shell 脚本，可读性差
2. 无法利用 TypeScript 类型安全
3. 难以进行单元测试
4. 无法在本地模拟测试
5. 错误处理不够完善

## Goals / Non-Goals

**Goals:**
- 将 webhook 发送逻辑抽离为独立的 TypeScript 脚本
- 提供完善的参数验证和错误处理
- 支持本地测试和调试
- 简化 workflow 文件，职责分离
- 保持与现有 webhook 服务器的兼容性（HMAC-SHA256 签名）

**Non-Goals:**
- 不修改 webhook 服务器端逻辑（`hooks.json`、`deploy.sh`）
- 不改变 CI/CD 流程的其他步骤
- 不引入新的外部依赖（使用 Node.js 内置模块）
- 不修改 GitHub Secrets 配置

## Decisions

### 1. 脚本语言选择：TypeScript

**决策**: 使用 TypeScript 而非 Bash

**理由**:
- ✅ 与项目技术栈一致
- ✅ 类型安全，避免参数传递错误
- ✅ 可以使用现代 HTTP 客户端（`fetch` API）
- ✅ 更好的错误处理和堆栈跟踪
- ✅ 可编写单元测试

**备选方案**:
- ❌ Bash 脚本：缺乏类型安全，错误处理复杂
- ❌ Python 脚本：引入额外运行时依赖

### 2. 运行时：tsx

**决策**: 使用 `npx tsx` 运行脚本

**理由**:
- ✅ 零配置，无需编译步骤
- ✅ 支持 TypeScript 和 ESM
- ✅ 支持顶层 await
- ✅ 现代、快速、TypeScript 原生支持

**注意事项**:
- ⚠️ 需要将 `tsx` 添加到 devDependencies（项目当前只有 ts-node）
- ⚠️ 在 GitHub Actions 中通过 `npx tsx` 自动安装

**备选方案**:
- ❌ `ts-node`：配置复杂，启动慢
- ❌ 先编译后运行：增加构建复杂度

### 3. 参数传递：环境变量

**决策**: 通过环境变量而非命令行参数传递配置

**理由**:
- ✅ 避免 Shell 转义问题（特别是 secret 中的特殊字符）
- ✅ 与 GitHub Actions 的 `env` 字段天然契合
- ✅ 更安全（不会出现在进程列表中）
- ✅ 便于本地测试（`.env` 文件）

**备选方案**:
- ❌ 命令行参数：需要处理 Shell 转义，secret 可能泄露

### 4. HTTP 客户端：原生 fetch

**决策**: 使用 Node.js 22 内置的 `fetch` API

**理由**:
- ✅ 零依赖
- ✅ 现代 API，支持 Promise
- ✅ Node.js 22 已原生支持
- ✅ 与浏览器 API 一致

**备选方案**:
- ❌ `axios`：引入外部依赖
- ❌ `node-fetch`：Node.js 22 已内置

### 5. 签名生成：crypto 模块

**决策**: 使用 Node.js 内置 `crypto.createHmac`

**理由**:
- ✅ 零依赖
- ✅ 性能优于 `openssl` 子进程
- ✅ 类型安全
- ✅ 跨平台兼容

**备选方案**:
- ❌ 调用 `openssl` 命令：需要子进程，错误处理复杂

### 6. 重试机制

**决策**: 添加智能重试逻辑

**策略**:
- ✅ **5xx 错误**（服务器错误）：重试 3 次
- ✅ **429 错误**（限流）：重试 3 次
- ✅ **网络异常**（超时、DNS 失败）：重试 3 次
- ❌ **4xx 错误**（配置错误，除 429 外）：不重试，立即失败
- ⏱️ **退避策略**: 指数退避 2s → 4s → 8s

**理由**:
- 提高 CI/CD 部署可靠性
- 避免网络抖动导致部署失败
- 配合 `continue-on-error: true` 提供双重保障

## Script Structure

```typescript
scripts/deploy-webhook.ts
├── 接口定义 (WebhookPayload, WebhookOptions)
├── 签名生成 (generateSignature)
├── Webhook 发送 (sendWebhook)
├── 参数验证 (validateParams)
└── 主函数 (main)
```

## Error Handling Strategy

- **参数缺失**: 立即退出，返回非 0 状态码
- **网络错误**: 捕获异常，输出错误信息，返回非 0 状态码
- **HTTP 错误**: 检查 `response.ok`，输出状态码，返回非 0 状态码
- **Workflow 容错**: 保留 `continue-on-error: true`

## Logging

```
🚀 Triggering deployment webhook...
   Tag: v1.0.0
   Image: ghcr.io/qinshi0930/xingyed.site:v1.0.0
   Repository: qinshi0930/xingyed.site
   Triggered by: actor
✅ Webhook triggered successfully (HTTP 200)

❌ Webhook failed: HTTP 403 Forbidden
```

## Risks / Trade-offs

### Risk 1: tsx 依赖安装
**风险**: 项目当前未安装 tsx，需要添加到 devDependencies
**缓解**: 在 tasks.md 中添加安装步骤，使用 `pnpm add -D tsx`

### Risk 2: Node.js 版本兼容性
**风险**: `fetch` API 需要 Node.js 18+
**缓解**: 项目已使用 Node.js 22，无兼容问题

### Risk 3: 脚本执行权限
**风险**: 脚本可能没有执行权限
**缓解**: 在 workflow 中添加 `chmod +x` 或使用 `npx tsx` 直接运行

### Trade-off: 增加文件数量
**权衡**: 从 1 个文件变为 2 个文件（workflow + script）
**收益**: 职责分离，可维护性提升，可测试性增强

## Migration Plan

1. 创建 `scripts/deploy-webhook.ts` 脚本
2. 在本地测试脚本功能
3. 更新 `.github/workflows/ci-cd.yml` 调用脚本
4. 提交代码，推送测试 tag
5. 验证 GitHub Actions 执行成功
6. 验证服务器接收 webhook 并部署成功

## Open Questions

无
