## Context

当前 CI/CD 架构中，`build-release.yml` 和 `docker-publish.yml` 都通过 `workflow_call` 调用 `build-test.yml`，导致：
- 同一次 tag 推送触发两次完整构建
- 违反"构建一次，部署多次"原则
- Dockerfile 路径错误（当前假设从 monorepo root 构建，实际应该是 `apps/app/.next/...`）

**目标**：改为基于 artifact 的部署架构，确保构建产物一致性。

## Goals / Non-Goals

**Goals:**
- 消除重复构建，节省 CI 资源
- 确保"构建一次，部署多次"，保证产物一致性
- 修正 Dockerfile 路径匹配 monorepo 真实结构
- artifact 包含完整部署所需文件（Dockerfile + podman-compose.yml）
- 增加 artifact 可用性检查，提供清晰的错误提示

**Non-Goals:**
- 不修改构建逻辑本身（保持 `pnpm build` 命令不变）
- 不修改 Docker 镜像运行时配置（保持 node:22-alpine 基础镜像）
- 不修改发布流程的触发条件（仍然由 `push tags: v*` 触发）
- 不修改 artifact 保留时间（保持 1 天）

## Decisions

### 1. Artifact 架构：保持 monorepo 路径隔离

**决策**: artifact 保持 `apps/app/` 路径前缀，不为 Docker 单独扁平化

**理由**:
- ✅ 为未来多子项目预留隔离性（apps/api, apps/web 等）
- ✅ 与 monorepo 结构一致，易于理解
- ✅ 避免路径冲突和特殊处理
- ❌ 需要 Dockerfile 使用完整路径（可接受）

**Artifact 结构**:
```
artifact: build-output
├── apps/
│   └── app/
│       ├── .next/
│       │   ├── standalone/      # Next.js standalone 输出（内部有 apps/app/ 结构）
│       │   └── static/          # 客户端静态资源
│       ├── public/
│       └── src/
│           └── contents/
├── packages/                    # Monorepo 共享包
├── Dockerfile                   # 新增
└── podman-compose.yml           # 新增
```

### 2. 代码质量检查顺序：快速失败优先

**决策**: build-test.yml 中的检查顺序为 Lint → Type Check → Build

**理由**:
- ✅ Lint 最快，快速发现代码风格问题
- ✅ Type Check 较慢，发现类型错误
- ✅ Build 最慢，最后执行
- ✅ 任何一步失败都会终止流程，节省 CI 时间

**实现**:
```yaml
jobs:
  code-quality:
    steps:
      - 🔍 Lint (pnpm lint)
      - 🔍 Type Check (tsc --noEmit)
  
  build:
    steps:
      - 🏗️ Build (pnpm build)
      - 📦 Upload Artifact
```

### 3. Dockerfile 路径修正：匹配 monorepo 真实结构

**决策**: 修正所有 COPY 路径，添加 `apps/app/` 前缀

**当前（错误）**:
```dockerfile
COPY .next/standalone/ ./
COPY .next/static ./apps/app/.next/static
COPY public/ ./apps/app/public
COPY src/contents ./apps/app/src/contents
```

**修正后**:
```dockerfile
COPY apps/app/.next/standalone/ ./
COPY apps/app/.next/static/ ./apps/app/.next/static/
COPY apps/app/public/ ./apps/app/public/
COPY apps/app/src/contents/ ./apps/app/src/contents/
COPY packages/ ./packages/
```

**理由**:
- ✅ 匹配 monorepo 真实目录结构
- ✅ 同时适用于本地开发和 CI artifact
- ✅ 路径清晰，不会混淆

### 4. Artifact 可用性检查：失败时提供明确提示

**决策**: build-release 和 docker-publish 下载 artifact 失败时，输出清晰的中文 + 英文错误提示

**实现**:
```yaml
- name: 📥 Download build artifact
  uses: actions/download-artifact@v4
  with:
    name: build-output
  continue-on-error: true
  id: download

- name: 🔍 Check artifact availability
  if: steps.download.outcome == 'failure'
  run: |
    echo "::error::构建产物未找到！"
    echo "Artifact 'build-output' not found."
    echo ""
    echo "请确保在打 tag 之前："
    echo "1. 已将代码推送到 main 分支"
    echo "2. main 分支的 build-test workflow 已成功完成"
    exit 1
```

**理由**:
- ✅ 用户友好，明确告知问题原因
- ✅ 提供解决步骤
- ✅ 防止静默失败

### 5. Docker Publish 简化：移除 checkout 步骤

**决策**: docker-publish.yml 不再需要 checkout code，完全依赖 artifact

**当前**:
```yaml
steps:
  - 📥 Checkout code
  - 📥 Download build artifact
  - 🐳 Build and push
```

**简化后**:
```yaml
steps:
  - 📥 Download build artifact (包含 Dockerfile)
  - 🐳 Build and push
```

**理由**:
- ✅ 减少步骤，加快速度
- ✅ artifact 已包含所有需要的文件
- ✅ 确保使用的 Dockerfile 与构建产物匹配

### 6. Artifact 保留时间：保持 1 天

**决策**: 保持 `retention-days: 1`

**理由**:
- ✅ 要求发布流程紧凑（push main → 验证 → 打 tag）
- ✅ 减少 GitHub 存储空间占用
- ❌ 如果超过 1 天再打 tag，需要重新推送 main 分支触发构建（可接受）

## Workflow 架构图

```
Push to main:
└── build-test.yml
    ├── Job: code-quality
    │   ├── Checkout
    │   ├── Setup pnpm + Node
    │   ├── Install dependencies
    │   ├── 🔍 Lint (pnpm lint)
    │   └── 🔍 Type Check (tsc --noEmit)
    │
    └── Job: build
        ├── Checkout
        ├── Setup pnpm + Node
        ├── Install dependencies
        ├── 🏗️ Build (pnpm build)
        ├── ✅ Verify build output
        └── 📦 Upload Artifact
            name: build-output
            path:
              - apps/app/.next/standalone
              - apps/app/.next/static
              - apps/app/public
              - apps/app/src/contents
              - packages
              - Dockerfile
              - podman-compose.yml
            retention-days: 1

Push tag v*:
├── build-release.yml
│   └── Job: release
│       ├── 📥 Download Artifact (检查可用性)
│       ├── 🔍 Verify artifact structure
│       ├── 📦 Compress to zip
│       └── 🚀 Create GitHub Release
│
└── docker-publish.yml
    └── Job: docker-build-push
        ├── 📥 Download Artifact (检查可用性)
        ├── 🔍 Verify artifact structure
        ├── 🔐 Login to GHCR
        ├── 🏷️ Extract metadata
        ├── 🐳 Build and push Docker image
        └── ✅ Verify image pushed
```

## Risks / Trade-offs

### Risk 1: Artifact 不存在导致发布失败
**风险**: 用户直接打 tag 而未推送 main 分支，artifact 不存在导致发布失败
**缓解**: 
- 清晰的错误提示告知用户如何解决
- 文档说明正确的发布流程

### Risk 2: 1 天保留时间过短
**风险**: 用户推送 main 后超过 1 天才打 tag，artifact 已过期
**缓解**:
- 重新推送 main 分支即可重新触发构建
- 或者增加 retention-days（但当前选择保持 1 天）

### Risk 3: Artifact 下载失败
**风险**: GitHub Actions artifact 服务临时不可用
**缓解**:
- GitHub artifact 服务可靠性很高（>99.9%）
- 失败时可以重新运行 workflow

### Trade-off: 发布流程变长
**权衡**: 从"直接打 tag"变为"先 push main → 等待构建 → 再打 tag"
**收益**:
- 构建产物一致性保证
- 避免重复构建浪费资源
- 发布速度与 artifact 可用性成正比

## Migration Plan

1. 修正 `Dockerfile` 中的 COPY 路径
2. 修改 `build-test.yml` 增加 lint 步骤和调整 artifact 上传
3. 修改 `build-release.yml` 移除 workflow_call 并增加 artifact 检查
4. 修改 `docker-publish.yml` 移除 workflow_call、checkout 并增加 artifact 检查
5. 推送 main 分支验证 build-test workflow
6. 创建测试 tag 验证 build-release 和 docker-publish 使用 artifact
7. 验证 artifact 不可用时的错误提示
8. 验证 Docker 镜像构建成功并推送到 GHCR

## Open Questions

无
