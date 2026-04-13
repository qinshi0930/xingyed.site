## Context

当前 GitHub Actions 有 5 个 workflow 文件：
- `ci-cd.yml`（158 行）：完整 CI/CD 流程（构建+Release+Docker+Webhook）
- `build-release.yml`（111 行）：构建+Release（与 `ci-cd.yml` 重复）
- `build-test.yml`（71 行）：构建验证（PR/push main 触发）
- `deploy-*.yml.disabled`：已废弃的 SSH 部署方案

**问题**：
1. `ci-cd.yml` 和 `build-release.yml` 同时由 `push tags: v*` 触发，功能重复
2. `build-test.yml` 不支持 `workflow_call`，无法被复用
3. `ci-cd.yml` 混合构建测试和部署逻辑，违反职责分离原则

## Goals / Non-Goals

**Goals:**
- 消除 workflow 功能重复，节省 CI 资源
- 通过 `workflow_call` 实现构建逻辑复用
- 严格遵循"构建测试类 vs 部署类"职责分离
- 实现 `build-release.yml` 和 `docker-publish.yml` 并行执行
- 清理废弃文件，保持代码库整洁

**Non-Goals:**
- 不修改构建逻辑本身（保持 `build-test.yml` 的步骤不变）
- 不修改 Docker 构建配置（保持现有 Dockerfile）
- 不修改 Webhook 脚本（保持 `scripts/deploy-webhook.ts`）
- 不修改服务器端部署逻辑（保持 `hooks.json` 和 `deploy.sh`）

## Decisions

### 1. Workflow 拆分策略：方案 A（职责分离 + workflow_call）

**决策**: 采用 3 个 workflow 文件，通过 `workflow_call` 复用构建逻辑

**理由**:
- ✅ 职责清晰：构建验证、Release、Docker 部署完全分离
- ✅ 并行执行：`build-release.yml` 和 `docker-publish.yml` 可同时运行
- ✅ 逻辑复用：通过 `workflow_call` 避免重复
- ✅ 符合规范：严格遵循"构建测试类 vs 部署类"分离原则

**备选方案**:
- ❌ 方案 B（单 Workflow 多 Job）：仍然混合职责，违反规范
- ❌ 方案 C（手动触发部署）：非自动化，违反需求

### 2. build-test.yml 改造：添加 workflow_call 支持

**决策**: 在 `build-test.yml` 中添加 `workflow_call` 触发器

**实现**:
```yaml
on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]
  workflow_call:  # 新增
```

**理由**:
- ✅ 保持原有功能不变（PR/push 仍然触发）
- ✅ 允许 `build-release.yml` 调用
- ✅ 零代码重复，统一维护

### 3. build-release.yml 简化：调用 build-test.yml

**决策**: `build-release.yml` 通过 `uses:` 调用 `build-test.yml`

**实现**:
```yaml
jobs:
  build:
    name: Build & Test
    uses: ./.github/workflows/build-test.yml
    secrets: inherit
  
  release:
    name: Create Release
    needs: build
    runs-on: ubuntu-latest
    steps:
      # 只负责压缩和创建 Release
```

**理由**:
- ✅ 避免重复构建逻辑
- ✅ 明确的依赖关系（`needs: build`）
- ✅ secrets 自动传递（`secrets: inherit`）

### 4. docker-publish.yml 独立：负责镜像构建和部署

**决策**: 新建独立的 `docker-publish.yml`，包含两个 Job

**结构**:
```yaml
jobs:
  docker-publish:
    # 构建 Docker 镜像并推送至 GHCR
  
  deploy:
    needs: docker-publish
    # 触发 Webhook 部署
```

**理由**:
- ✅ 与 `build-release.yml` 并行执行，提升速度
- ✅ 失败不影响 Release 创建（独立 workflow）
- ✅ 职责单一：只负责 Docker 和部署

### 5. 触发策略：保持 tag 触发不变

**决策**: `build-release.yml` 和 `docker-publish.yml` 都由 `push tags: v*` 触发

**理由**:
- ✅ 保持现有 CI/CD 触发方式
- ✅ GitHub Actions 自动并行执行同触发的 workflow
- ✅ 无需手动干预

### 6. manual-deploy.yml 设计：手动触发部署

**决策**: 新建 `manual-deploy.yml`，通过 `workflow_dispatch` 手动触发

**结构**:
```yaml
on:
  workflow_dispatch:
    inputs:
      image_tag:
        description: '要部署的镜像 tag（如 v1.0.0）'
        required: true
        type: string

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Validate image tag format
        run: |
          if [[ ! "${{ github.event.inputs.image_tag }}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+ ]]; then
            echo "❌ Invalid tag format. Expected: v1.0.0"
            exit 1
          fi
      
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Trigger Webhook
        run: |
          npx tsx scripts/deploy-webhook.ts
        env:
          WEBHOOK_URL: ${{ secrets.WEBHOOK_URL }}
          WEBHOOK_SECRET: ${{ secrets.WEBHOOK_SECRET }}
          WEBHOOK_TAG: ${{ github.event.inputs.image_tag }}
          WEBHOOK_IMAGE: ghcr.io/qinshi0930/xingyed.site:${{ github.event.inputs.image_tag }}
          WEBHOOK_REPOSITORY: ${{ github.repository }}
          WEBHOOK_TRIGGERED_BY: ${{ github.actor }}
```

**理由**:
- ✅ 部署与镜像推送解耦，可以灵活选择部署时机和版本
- ✅ 输入验证防止错误 tag 格式
- ✅ 复用现有 `deploy-webhook.ts` 脚本
- ✅ 标记 `WEBHOOK_TRIGGERED_BY: manual` 区分手动部署

### 7. hooks.json 修改：移除 ref 验证

**决策**: 修改 `webhook/hooks.json` 的 trigger-rule，移除 `ref` 字段验证

**修改前**:
```json
"trigger-rule": {
  "and": [
    { "match": { "type": "value", "value": "refs/heads/main", "parameter": { "source": "payload", "name": "ref" } } },
    { "match": { "type": "payload-hash-sha256", "secret": "...", "parameter": { "source": "header", "name": "X-Hub-Signature-256" } } }
  ]
}
```

**修改后**:
```json
"trigger-rule": {
  "match": {
    "type": "payload-hash-sha256",
    "secret": "...",
    "parameter": {
      "source": "header",
      "name": "X-Hub-Signature-256"
    }
  }
}
```

**理由**:
- ✅ manual-deploy.yml 发送的 payload 不包含 `ref` 字段
- ✅ 保留 HMAC 签名验证，安全性不受影响
- ✅ 简化验证逻辑，减少误拒绝

**服务器部署步骤**:
1. 修改 `webhook/hooks.json` 文件
2. 将新配置复制到服务器（`scp webhook/hooks.json server:/opt/webhook/`）
3. 重载 webhook 服务（`systemctl reload webhook`）
4. 验证配置生效（`curl -s http://localhost:9000/hooks/deploy-xingyed-site`）

## Risks / Trade-offs

### Risk 1: workflow_call 兼容性
**风险**: `workflow_call` 可能在某些 GitHub Actions 版本中不兼容
**缓解**: `workflow_call` 是 GitHub Actions 核心功能，自 2020 年起支持，无兼容问题

### Risk 2: 并行执行资源竞争
**风险**: `build-release.yml` 和 `docker-publish.yml` 同时运行可能竞争 CI 资源
**缓解**: 
- 两者使用不同的 runner（独立环境）
- pnpm 缓存共享（通过 `actions/cache@v4`）
- 无代码冲突（只读 checkout）

### Risk 3: 调试复杂度增加
**风险**: 3 个 workflow 文件可能增加调试难度
**缓解**:
- 职责清晰，更容易定位问题
- GitHub Actions UI 清晰显示每个 workflow 状态
- 日志独立，便于排查

### Trade-off: 文件数量增加
**权衡**: 从 2 个有效文件变为 3 个文件
**收益**: 
- 职责分离，可维护性提升
- 并行执行，构建速度提升
- 逻辑复用，代码量减少

## Migration Plan

1. 改造 `build-test.yml` 添加 `workflow_call` 支持
2. 简化 `build-release.yml` 调用 `build-test.yml`
3. 创建 `docker-publish.yml` 实现 Docker 构建和 GHCR 推送
4. 创建 `manual-deploy.yml` 实现手动触发部署
5. 修改 `webhook/hooks.json` 并部署到服务器
6. 删除 `ci-cd.yml` 和废弃文件
7. 推送测试 tag 验证并行执行
8. 手动触发部署验证 Webhook 流程
9. 确认 Release 创建、镜像推送和部署成功

## Open Questions

无
