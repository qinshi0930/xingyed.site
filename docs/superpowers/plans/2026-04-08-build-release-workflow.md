# Build and Release Workflow 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建 GitHub Actions workflow，实现基于 Git Tag 的自动化构建和 Release 发布流程

**Architecture:** 创建独立的 `build-release.yml` workflow，监听 Git Tag 推送事件，执行类型检查、构建 Next.js standalone 产物、压缩产物并创建 GitHub Release，使用 GitHub 自动生成的 Release Notes

**Tech Stack:** GitHub Actions, pnpm 10, Node.js 22, Next.js 15, softprops/action-gh-release

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `.github/workflows/build-release.yml` | 创建 | 主要的 workflow 文件，包含完整的构建和发布流程 |

---

### Task 1: 创建 Build and Release Workflow

**Files:**
- Create: `.github/workflows/workflows/build-release.yml`

**说明：** 创建完整的 workflow 文件，包含所有必需的步骤：环境设置、依赖安装、类型检查、构建、验证、压缩和 Release 创建。

- [ ] **Step 1: 创建 workflow 文件**

创建 `.github/workflows/build-release.yml`，包含以下内容：

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

env:
  PNPM_VERSION: '10'
  NODE_VERSION: '22'

permissions:
  contents: write

jobs:
  build-and-release:
    name: Build and Release
    runs-on: ubuntu-latest

    steps:
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

      - name: 📦 Compress artifact
        run: |
          VERSION=${GITHUB_REF_NAME}
          echo "Compressing artifact for version: ${VERSION}"
          cd apps/app/.next/standalone
          zip -r ../../../xingyed-site-${VERSION}.zip .
          cd ../../..
          echo "✓ Artifact compressed: xingyed-site-${VERSION}.zip"
          ls -lh xingyed-site-${VERSION}.zip

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

- [ ] **Step 2: 验证 YAML 语法**

检查文件格式是否正确：

```bash
# 如果安装了 yq 或其他 YAML 验证工具
cat .github/workflows/build-release.yml | head -20
```

预期输出：显示文件前 20 行，确认格式正确

- [ ] **Step 3: 检查文件结构**

```bash
ls -la .github/workflows/
```

预期输出：
```
build-test.yml
build-release.yml  # 新文件
deploy-advanced.yml.disabled
deploy.yml.disabled
```

- [ ] **Step 4: 提交更改**

```bash
git add .github/workflows/build-release.yml
git commit -m "feat: 添加 Build and Release workflow"
```

---

## 验证清单

实现完成后，逐项验证：

- [ ] **Workflow 文件存在且格式正确**
  - 文件路径：`.github/workflows/build-release.yml`
  - YAML 语法正确，无缩进错误
  
- [ ] **触发器配置正确**
  - 仅在推送 `v*` 格式的 Tag 时触发
  - 不会在普通 push 或 PR 时触发

- [ ] **环境变量配置**
  - `PNPM_VERSION: '10'`
  - `NODE_VERSION: '22'`

- [ ] **权限配置**
  - `permissions.contents: write`

- [ ] **构建步骤完整**
  - ✅ Checkout code
  - ✅ Setup pnpm
  - ✅ Setup Node.js
  - ✅ Cache dependencies
  - ✅ Install dependencies
  - ✅ Type check（不使用 secrets）
  - ✅ Build（不使用 secrets）
  - ✅ Verify build output（包含 server.js 检查）
  - ✅ Compress artifact
  - ✅ Create GitHub Release

- [ ] **Release 配置**
  - Tag 名称作为 Release 标题
  - `generate_release_notes: true`
  - 上传 zip 文件
  - 使用 `GITHUB_TOKEN`

- [ ] **产物压缩**
  - 在 `standalone` 目录内压缩
  - 命名为 `xingyed-site-{version}.zip`
  - 包含所有必需文件

---

## 测试指南

### 本地测试（可选）

安装 actionlint 验证 workflow 语法：

```bash
# macOS
brew install actionlint

# Linux
go install github.com/rhysd/actionlint/cmd/actionlint@latest

# 运行验证
actionlint .github/workflows/build-release.yml
```

预期输出：无错误

### GitHub 测试

推送一个测试 Tag 触发 workflow：

```bash
# 1. 创建测试 Tag
git tag v0.0.1-test

# 2. 推送 Tag（触发 workflow）
git push origin v0.0.1-test

# 3. 在 GitHub 查看
# - Actions 页面：查看 workflow 执行状态
# - Releases 页面：查看创建的 Release
```

**预期结果：**
1. ✅ Workflow 成功执行
2. ✅ 所有步骤通过
3. ✅ 创建 Release `v0.0.1-test`
4. ✅ 包含 `xingyed-site-v0.0.1-test.zip` 附件
5. ✅ 自动生成 Release Notes

**清理测试 Tag：**

```bash
# 删除远程 Tag
git push --delete origin v0.0.1-test

# 删除本地 Tag
git tag -d v0.0.1-test

# 删除 GitHub Release（在 GitHub 界面手动删除）
```

---

## 故障排查

### 问题 1: Type Check 失败

**症状：** Type check 步骤报错

**可能原因：**
- TypeScript 类型错误
- 缺少类型定义

**解决方案：**
- 本地运行 `pnpm --filter @repo/app exec tsc --noEmit` 检查
- 修复类型错误后重新推送 Tag

### 问题 2: Build 失败

**症状：** Build 步骤报错

**可能原因：**
- 依赖问题
- 代码错误

**解决方案：**
- 本地运行 `pnpm build` 检查
- 确认 `.next/standalone` 目录生成

### 问题 3: Release 创建失败

**症状：** 最后一步报错

**可能原因：**
- 权限不足
- Tag 格式不正确

**解决方案：**
- 确认 `permissions.contents: write` 配置
- 确认 Tag 以 `v` 开头（如 `v0.1.0`）

---

## 后续步骤

完成此计划后，可以：

1. **监控首次运行**：推送第一个正式 Tag，观察 workflow 表现
2. **优化构建速度**：如有需要，可以优化缓存策略
3. **增强 Release Notes**：后续可以切换到 `release-drafter` 获得更详细的笔记
4. **添加 Docker 支持**：Phase 2 计划
