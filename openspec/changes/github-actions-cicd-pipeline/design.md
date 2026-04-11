## Context

**当前状态**：
- Dockerfile：单阶段构建（28行），依赖本地 `pnpm build` 产物
- Workflow：`build-release.yml`（发布 Release）、`build-test.yml`（构建测试）
- 部署方式：Webhook 已禁用，需重新启用

**目标状态**：
- Dockerfile：多阶段构建（自包含，CI/CD 可独立构建）
- Workflow：完整的 CI/CD 流水线（构建 → Release → Docker → Webhook）
- 部署方式：Webhook 自动触发服务器拉取镜像部署

## Goals / Non-Goals

**Goals:**
- 修改 Dockerfile 为多阶段构建（builder + runner）
- 创建 `ci-cd.yml` 工作流（tag 触发）
- 推送 Docker 镜像至 GHCR（ghcr.io/qinshi0930/xingyed.site）
- 通过 Webhook 通知服务器部署
- pnpm 依赖缓存优化（加速 CI 构建）

**Non-Goals:**
- 不创建 Dockerfile.ci（直接修改现有 Dockerfile）
- 不自动部署到服务器（仅触发 Webhook）
- 不修改现有 `build-release.yml` 和 `build-test.yml`

## Decisions

### 决策 1：Dockerfile 多阶段构建
**选择**：修改现有 Dockerfile 为多阶段构建

**实现**：
```dockerfile
# Builder 阶段
FROM node:22-alpine AS builder
WORKDIR /app
# 安装 pnpm + 依赖 + 构建

# Runner 阶段
FROM node:22-alpine AS runner
# 复制 standalone 产物 + 运行
```

**理由**：
- ✅ 单一文件，易于维护
- ✅ CI/CD 可独立构建（无需本地产物）
- ✅ 本地开发仍可用（Docker 会缓存 builder 阶段）

**替代方案**：
- ~~创建 Dockerfile.ci~~：维护两个文件增加复杂度

### 决策 2：Workflow 触发方式
**选择**：Push Tag（`v*`）触发

**理由**：
- ✅ 明确的发布意图
- ✅ 与 `build-release.yml` 保持一致
- ✅ 避免每次 push 都触发完整 CI/CD

### 决策 3：镜像标签策略
**选择**：使用 Git Tag 作为镜像标签

**示例**：
- `ghcr.io/qinshi0930/xingyed.site:v1.0.0`
- `ghcr.io/qinshi0930/xingyed.site:latest`

**理由**：
- ✅ 版本明确，易于回滚
- ✅ 与 Release 对应
- ✅ 支持 latest 标签获取最新版本

### 决策 4：pnpm 缓存优化
**选择**：缓存 `~/.pnpm-store` + `node_modules`

**配置**（复用现有）：
```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.pnpm-store
      node_modules
    key: ${{ runner.os }}-pnpm-${{ hashFiles('pnpm-lock.yaml') }}
```

**理由**：
- ✅ 已有配置，直接复用
- ✅ 显著加速依赖安装（从 60s → 10s）

### 决策 5：Webhook 触发方式
**选择**：HTTP POST 请求通知服务器

**实现**：
```yaml
- name: 🚀 Trigger deployment webhook
  run: |
    curl -X POST ${{ secrets.DEPLOY_WEBHOOK_URL }} \
      -H "Content-Type: application/json" \
      -d '{"tag": "${{ github.ref_name }}", "image": "ghcr.io/${{ github.repository }}:${{ github.ref_name }}"}'
```

**理由**：
- ✅ 简单可靠
- ✅ 服务器自主控制部署时机
- ✅ 支持重试和错误处理

## Risks / Trade-offs

### Risk 1：Docker 构建时间
**风险**：多阶段构建可能耗时较长（5-10 分钟）

**缓解**：
- pnpm 缓存优化（减少依赖安装时间）
- Docker 层缓存（builder 阶段缓存）
- 仅在 tag 推送时触发（非频繁操作）

### Risk 2：GHCR 存储限制
**风险**：GitHub Packages 有存储限制（免费 500MB）

**缓解**：
- 镜像大小约 285MB，在限制内
- 定期清理旧镜像
- 按需保留最近 N 个版本

### Trade-off：灵活性 vs 简便性
- **牺牲**：本地开发和 CI/CD 使用同一 Dockerfile（可能需要重新构建）
- **获得**：单一文件，维护简单，CI/CD 自包含

## Migration Plan

### 部署步骤
1. 修改 Dockerfile 为多阶段构建
2. 创建 `.github/workflows/ci-cd.yml`
3. 配置 GHCR 权限（`packages: write`）
4. 配置 Webhook URL（`DEPLOY_WEBHOOK_URL` secret）
5. 创建测试 tag（`v0.0.1-test`）验证流程
6. 观察 Webhook 触发和服务器部署

### 回滚策略
- 删除测试 tag
- 回滚 Dockerfile 和 workflow 修改
- 服务器手动部署旧版本镜像

## Open Questions

无 - 所有设计决策已确认。
