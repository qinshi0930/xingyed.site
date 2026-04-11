# GitHub Actions CI/CD Pipeline 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建完整的 CI/CD 流水线，实现 Push Tag → 构建 → Release → Docker 镜像推送至 GHCR → Webhook 触发服务器部署的自动化流程。

**Architecture:** 修改现有 Dockerfile 为多阶段构建（builder + runner），创建新的 `ci-cd.yml` workflow 整合构建、Release、Docker 镜像推送和 Webhook 触发，复用已有的 pnpm 缓存配置优化构建速度。

**Tech Stack:** GitHub Actions, Docker multi-stage, pnpm, Next.js standalone, GitHub Container Registry (GHCR), Webhook

---

## 文件结构

### 创建的文件
- `.github/workflows/ci-cd.yml` - 完整的 CI/CD 工作流

### 修改的文件
- `Dockerfile` - 从单阶段改为多阶段构建（添加 builder 阶段）

---

### Task 1: Dockerfile 多阶段重构

**Files:**
- Modify: `Dockerfile` (完整重写，28行 → 约45行)

**目标**: 将当前单阶段 Dockerfile 改为多阶段构建，使 CI/CD 可以独立构建无需本地产物。

- [ ] **Step 1: 重写 Dockerfile 为多阶段构建**

将 `Dockerfile` 完整替换为以下内容：

```dockerfile
# ============================================================
# 阶段 1: Builder - 构建应用
# 职责：安装依赖并执行 Next.js 构建
# ============================================================
FROM node:22-alpine AS builder

# 安装 pnpm 包管理器
RUN npm install -g pnpm@10.21.0 --registry=https://registry.npmjs.org/ --proxy=false --https-proxy=false

WORKDIR /app

# 复制依赖配置文件
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/app/package.json ./apps/app/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/

# 安装所有依赖（包括 devDependencies，用于构建）
RUN pnpm install --frozen-lockfile

# 复制完整源代码
COPY . .

# 执行构建
RUN pnpm build

# ============================================================
# 阶段 2: Runner - 生产运行环境
# 职责：仅包含运行时环境和构建产物
# ============================================================
FROM node:22-alpine AS runner
ENV NODE_ENV=production

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# 从 builder 阶段复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/.next/static ./apps/app/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/public ./apps/app/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/src/contents ./apps/app/src/contents
COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "apps/app/server.js"]
```

**关键变更**:
- 添加 `builder` 阶段：安装 pnpm → 复制依赖 → 安装 → 复制源码 → 构建
- 修改 `runner` 阶段：从 `builder` 复制产物（`COPY --from=builder`）
- 保留：非 root 用户、端口配置、启动命令

- [ ] **Step 2: 验证 Dockerfile 语法**

检查文件完整性：
```bash
cat Dockerfile | grep -E "^FROM|^COPY|^RUN|^CMD"
```

预期输出应包含：
- 2 个 FROM 语句（builder, runner）
- builder 阶段：npm install pnpm, COPY, pnpm install, pnpm build
- runner 阶段：COPY --from=builder（5次）, CMD

- [ ] **Step 3: 本地测试多阶段构建（可选但推荐）**

```bash
docker build -t xingyed-site:test .
```

预期：
- 构建成功（约 5-10 分钟）
- 输出：`Successfully tagged xingyed-site:test`

- [ ] **Step 4: 提交 Dockerfile 修改**

```bash
git add Dockerfile
git commit -m "重构(docker): 将 Dockerfile 改为多阶段构建

- 添加 builder 阶段：安装依赖并执行 Next.js 构建
- 修改 runner 阶段：从 builder 复制构建产物
- 使 CI/CD 可独立构建，无需本地产物"
```

---

### Task 2: 创建 CI/CD Workflow 基础结构

**Files:**
- Create: `.github/workflows/ci-cd.yml` (约150行)

**目标**: 创建完整的 CI/CD 工作流，包含触发条件、权限和环境变量配置。

- [ ] **Step 1: 创建 workflow 文件（基础配置）**

创建 `.github/workflows/ci-cd.yml`，添加基础配置：

```yaml
name: CI/CD Pipeline

on:
  push:
    tags:
      - 'v*'

env:
  PNPM_VERSION: '10'
  NODE_VERSION: '22'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

permissions:
  contents: write
  packages: write

jobs:
  build-and-deploy:
    name: Build, Release & Deploy
    runs-on: ubuntu-latest

    steps:
      # 步骤将在后续 task 中添加
```

**关键配置**:
- 触发条件：`push.tags: 'v*'`（仅 tag 推送触发）
- 环境变量：PNPM_VERSION、NODE_VERSION、REGISTRY、IMAGE_NAME
- 权限：`contents: write`（创建 Release）、`packages: write`（推送镜像）

- [ ] **Step 2: 验证 YAML 语法**

```bash
# 使用 yq 或在线 YAML 验证器
cat .github/workflows/ci-cd.yml | python3 -c "import yaml, sys; yaml.safe_load(sys.stdin); print('✓ YAML 语法正确')"
```

- [ ] **Step 3: 提交 workflow 基础结构**

```bash
git add .github/workflows/ci-cd.yml
git commit -m "新增(ci/cd): 创建 CI/CD workflow 基础结构

- 配置 tag 触发（v*）
- 设置权限：contents: write, packages: write
- 定义环境变量：PNPM_VERSION, NODE_VERSION, REGISTRY, IMAGE_NAME"
```

---

### Task 3: 添加构建和 Release 步骤

**Files:**
- Modify: `.github/workflows/ci-cd.yml:31-` (在 jobs.build-and-deploy.steps 中添加)

**目标**: 复用 `build-release.yml` 的逻辑，添加构建、验证和 Release 发布步骤。

- [ ] **Step 1: 添加 checkout、pnpm setup、Node.js setup 和缓存配置**

在 `steps:` 数组中添加：

```yaml
      - name: 📥 Checkout code
        uses: actions/checkout@v4

      - name: 🐿️ Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: ⎔ Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: 💾 Cache pnpm dependencies
        uses: actions/cache@v4
        id: pnpm-cache
        with:
          path: |
            ~/.pnpm-store
            node_modules
          key: ${{ runner.os }}-pnpm-${{ hashFiles('pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-

      - name: 📦 Install dependencies
        run: pnpm install --frozen-lockfile

      - name: 🔍 Type check
        run: pnpm --filter @repo/app exec tsc --noEmit
```

**来源**: 完全复用 `build-release.yml:21-50`

- [ ] **Step 2: 添加构建和产物验证步骤**

继续添加：

```yaml
      - name: 🏗️ Build Next.js app
        run: pnpm build

      - name: ✅ Verify build output
        run: |
          echo "Checking build artifacts..."
          test -d apps/app/.next && echo "✓ .next directory exists" || (echo "✗ .next directory missing" && exit 1)
          test -f apps/app/.next/BUILD_ID && echo "✓ BUILD_ID exists" || (echo "✗ BUILD_ID missing" && exit 1)
          test -d apps/app/.next/standalone && echo "✓ standalone output exists" || (echo "✗ standalone output missing" && exit 1)
          test -f apps/app/.next/standalone/apps/app/server.js && echo "✓ server.js exists" || (echo "✗ server.js missing" && exit 1)
          echo "Build verification passed!"
```

**来源**: 复用 `build-release.yml:52-62`

- [ ] **Step 3: 添加 Release 发布步骤**

继续添加：

```yaml
      - name: 📦 Compress artifact
        run: |
          VERSION=${GITHUB_REF_NAME}
          ARTIFACT_NAME="xingyed-site-${VERSION}.zip"
          echo "Compressing artifact for version: ${VERSION}"
          
          # 创建临时目录构建完整的产物结构
          RELEASE_DIR="${GITHUB_WORKSPACE}/release"
          mkdir -p "${RELEASE_DIR}"
          
          # 1. 复制 standalone 核心文件（已包含 @repo 包和 styled-jsx）
          cp -r apps/app/.next/standalone/* "${RELEASE_DIR}/"
          
          # 2. 复制静态资源
          mkdir -p "${RELEASE_DIR}/apps/app/.next"
          cp -r apps/app/.next/static "${RELEASE_DIR}/apps/app/.next/static"
          
          # 3. 复制 public 和 contents
          if [ -d "apps/app/public" ]; then
            cp -r apps/app/public "${RELEASE_DIR}/apps/app/public"
          fi
          if [ -d "apps/app/src/contents" ]; then
            cp -r apps/app/src/contents "${RELEASE_DIR}/apps/app/src/contents"
          fi
          
          # 4. 压缩
          cd "${RELEASE_DIR}"
          zip -r "${GITHUB_WORKSPACE}/${ARTIFACT_NAME}" .
          
          # 验证
          cd "${GITHUB_WORKSPACE}"
          echo "✓ Artifact compressed: ${ARTIFACT_NAME}"
          ls -lh "${ARTIFACT_NAME}"
          
          # 显示产物内容
          echo "📦 Artifact structure:"
          unzip -l "${ARTIFACT_NAME}" | head -40

      - name: 🚀 Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ github.ref_name }}
          name: ${{ github.ref_name }}
          generate_release_notes: true
          files: xingyed-site-${{ github.ref_name }}.zip
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**来源**: 复用 `build-release.yml:64-110`

- [ ] **Step 4: 提交构建和 Release 步骤**

```bash
git add .github/workflows/ci-cd.yml
git commit -m "新增(ci/cd): 添加构建和 Release 发布步骤

- 复用 build-release.yml 的构建逻辑
- 添加 pnpm 缓存优化
- 添加产物验证（.next, BUILD_ID, standalone, server.js）
- 添加 Release 发布（softprops/action-gh-release@v2）"
```

---

### Task 4: 添加 Docker 镜像构建和推送步骤

**Files:**
- Modify: `.github/workflows/ci-cd.yml` (在 Release 步骤后添加)

**目标**: 添加 GHCR 登录、Docker 元数据配置和镜像构建推送步骤。

- [ ] **Step 1: 添加 GHCR 登录步骤**

在 Release 步骤后添加：

```yaml
      - name: 🔐 Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: 添加 Docker 元数据和构建推送步骤**

继续添加：

```yaml
      - name: 🏷️ Extract Docker metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=tag
            type=raw,value=latest

      - name: 🐳 Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**关键配置**:
- 标签策略：`v1.0.0` + `latest`
- 缓存：GitHub Actions 缓存（`type=gha`）加速构建
- 推送：`push: true`（直接推送至 GHCR）

- [ ] **Step 3: 提交 Docker 步骤**

```bash
git add .github/workflows/ci-cd.yml
git commit -m "新增(ci/cd): 添加 Docker 镜像构建和推送步骤

- 添加 GHCR 登录（docker/login-action@v3）
- 添加 Docker 元数据（version + latest 标签）
- 添加构建和推送（docker/build-push-action@v5）
- 启用 GHA 缓存优化构建速度"
```

---

### Task 5: 添加 Webhook 触发部署步骤

**Files:**
- Modify: `.github/workflows/ci-cd.yml` (在 Docker 步骤后添加)

**目标**: 添加 Webhook 触发步骤，通知服务器拉取新镜像部署。

- [ ] **Step 1: 添加 Webhook 触发步骤**

在 Docker 构建推送步骤后添加：

```yaml
      - name: 🚀 Trigger deployment webhook
        run: |
          echo "Triggering deployment webhook..."
          curl -X POST ${{ secrets.DEPLOY_WEBHOOK_URL }} \
            -H "Content-Type: application/json" \
            -d '{
              "tag": "${{ github.ref_name }}",
              "image": "${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.ref_name }}",
              "repository": "${{ github.repository }}",
              "triggered_by": "${{ github.actor }}"
            }' || echo "⚠️ Webhook trigger failed (non-blocking)"
        continue-on-error: true
```

**关键配置**:
- Webhook 载荷：tag、image、repository、triggered_by
- 错误处理：`continue-on-error: true`（Webhook 失败不阻止 workflow）

- [ ] **Step 2: 添加完成通知步骤（可选）**

```yaml
      - name: ✅ Deployment triggered
        run: |
          echo "🎉 CI/CD Pipeline completed successfully!"
          echo "📦 Tag: ${{ github.ref_name }}"
          echo "🐳 Image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.ref_name }}"
          echo "🚀 Deployment webhook triggered"
```

- [ ] **Step 3: 提交 Webhook 步骤**

```bash
git add .github/workflows/ci-cd.yml
git commit -m "新增(ci/cd): 添加 Webhook 触发部署步骤

- 添加 HTTP POST 请求触发服务器部署
- 传递 tag、image、repository 信息
- 使用 continue-on-error 避免阻塞 workflow"
```

---

### Task 6: 验证和测试

**Files:**
- No file changes (testing and validation only)

**目标**: 创建测试 tag 验证完整流程。

- [ ] **Step 1: 查看完整 workflow 文件**

```bash
cat .github/workflows/ci-cd.yml
```

验证内容完整性：
- ✓ 触发条件：`push.tags: 'v*'`
- ✓ 权限：`contents: write`, `packages: write`
- ✓ 构建步骤：checkout → pnpm → build → verify
- ✓ Release 步骤：compress → create release
- ✓ Docker 步骤：login → metadata → build & push
- ✓ Webhook 步骤：curl POST → continue-on-error

- [ ] **Step 2: 提交所有修改**

```bash
git status
git add -A
git commit -m "完成(ci/cd): CI/CD pipeline 实施完成

- Dockerfile 多阶段重构（builder + runner）
- 完整 CI/CD workflow（构建 → Release → Docker → Webhook）
- pnpm 依赖缓存优化
- GHCR 镜像推送（version + latest）
- Webhook 触发服务器部署"
```

- [ ] **Step 3: 推送至远程仓库**

```bash
git push origin main
```

- [ ] **Step 4: 创建测试 tag 验证流程**

```bash
git tag v0.0.1-test
git push origin v0.0.1-test
```

**观察点**:
1. GitHub Actions 触发执行
2. 构建和类型检查通过
3. Release 创建成功（含 zip 附件）
4. Docker 镜像推送至 GHCR
5. Webhook 请求发送成功

- [ ] **Step 5: 验证 GitHub Release**

访问：`https://github.com/qinshi0930/xingyed.site/releases/tag/v0.0.1-test`

检查项：
- ✓ Release 名称正确
- ✓ Release Notes 自动生成
- ✓ 附件 `xingyed-site-v0.0.1-test.zip` 已上传

- [ ] **Step 6: 验证 Docker 镜像**

访问：`https://github.com/qinshi0930/xingyed.site/pkgs/container/xingyed.site`

检查项：
- ✓ 镜像 `v0.0.1-test` 已推送
- ✓ 镜像 `latest` 标签已更新
- ✓ 镜像大小约 285 MB

- [ ] **Step 7: 验证 Webhook（如果已配置）**

检查服务器日志：
```bash
# 在服务器上查看 webhook 日志
journalctl -u webhook -f
```

检查项：
- ✓ 收到 POST 请求
- ✓ 载荷包含正确的 tag 和 image 信息

- [ ] **Step 8: 清理测试资源**

```bash
# 删除测试 tag（本地和远程）
git tag -d v0.0.1-test
git push origin --delete v0.0.1-test

# 删除测试 Release（在 GitHub UI 中手动删除）
# 删除测试镜像（在 GitHub Packages UI 中手动删除）
```

- [ ] **Step 9: 提交清理（如果需要）**

```bash
git commit -m "清理: 删除测试 tag 和相关资源"
```

---

## 后续步骤

### 配置 Secrets（在 GitHub 仓库设置中）

1. 访问：`https://github.com/qinshi0930/xingyed.site/settings/secrets/actions`
2. 添加 Secret：
   - `DEPLOY_WEBHOOK_URL`: Webhook 服务器 URL（例如：`http://your-server:port/hooks/deploy`）

### 配置服务器 Webhook（如果尚未配置）

参考之前的 webhook 配置文档，确保服务器可以：
1. 接收 POST 请求
2. 解析 JSON 载荷（tag、image）
3. 拉取新镜像：`podman pull ghcr.io/qinshi0930/xingyed.site:v*`
4. 重启容器：`podman-compose down && podman-compose up -d`

### 监控和优化

- 监控 GHCR 存储使用量（免费 500MB）
- 定期清理旧镜像（保留最近 3-5 个版本）
- 观察构建时间，优化缓存策略

---

## 风险缓解

### 如果构建失败
1. 检查 GitHub Actions 日志
2. 本地复现：`pnpm install && pnpm build`
3. 修复后重新推送 tag（删除旧 tag 并重新创建）

### 如果 Webhook 失败
1. 检查 workflow 日志中的 curl 输出
2. 验证服务器 URL 和端口
3. 检查服务器防火墙规则
4. 手动触发测试：`curl -X POST <webhook-url> -H "Content-Type: application/json" -d '{"tag":"v1.0.0"}'`

### 如果镜像推送失败
1. 检查 `packages: write` 权限
2. 验证 GITHUB_TOKEN 有效性
3. 检查 GHCR 存储配额
