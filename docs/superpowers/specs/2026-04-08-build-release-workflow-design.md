# Build and Release Workflow 设计文档

**创建日期**: 2026-04-08  
**状态**: 待实现  
**作者**: AI Assistant  

---

## 1. 概述

为 xingyed.site 项目创建 GitHub Actions workflow，实现基于 Git Tag 的自动化构建和 Release 发布流程。

### 1.1 目标

- 当推送 Git Tag（格式 `v*`）时，自动触发构建和 Release 创建
- 编译 Next.js 应用并验证构建产物
- 压缩构建产物并上传到 GitHub Release
- 自动生成 Release Notes

### 1.2 范围（简化版本）

**包含**：
- ✅ Type Check（类型检查）
- ✅ Build（构建 Next.js standalone 产物）
- ✅ 压缩构建产物
- ✅ 创建 GitHub Release
- ✅ 上传构建产物到 Release
- ✅ 自动生成 Release Notes

**不包含**（后续迭代）：
- ❌ Docker 镜像构建和推送
- ❌ 自动版本号管理
- ❌ 部署到服务器

---

## 2. 设计决策

### 2.1 Workflow 配置

| 配置项 | 决策 | 理由 |
|--------|------|------|
| 文件名 | `build-release.yml` | 清晰表达 workflow 用途 |
| Workflow 名称 | `Build and Release` | 与文件名一致 |
| 触发方式 | `push.tags: 'v*'` | 标准实践，手动控制发布时机 |
| 编译方式 | 独立执行 | 不依赖其他 workflow，简单直接 |
| Secrets | 不使用 | 简化版本，避免外部依赖 |
| 权限 | `contents: write` | 创建 Release 需要写入权限 |

### 2.2 构建流程

```
Checkout → Setup pnpm/Node → Install → Type Check → Build → Verify → Zip → Release
```

**关键步骤**：

1. **Type Check**
   - 命令：`pnpm --filter @repo/app exec tsc --noEmit`
   - 不使用 GitHub API secrets
   - 失败则终止 workflow

2. **Build**
   - 命令：`pnpm build`
   - 生成 standalone 产物到 `apps/app/.next/standalone/`
   - 不使用 GitHub API secrets
   - 失败则终止 workflow

3. **Verify Build Output**
   - 验证 `.next` 目录存在
   - 验证 `BUILD_ID` 文件存在
   - 验证 `standalone` 目录存在
   - 验证 `server.js` 存在

4. **Compress Artifact**
   - 格式：zip
   - 命名：`xingyed-site-{version}.zip`
   - 内容：`apps/app/.next/standalone/` 目录

### 2.3 Release 配置

| 配置项 | 决策 | 理由 |
|--------|------|------|
| Release 标题 | Tag 名称（如 `v0.1.0`） | 简洁标准 |
| Release Notes | GitHub 自动生成（`generate_release_notes: true`） | 零配置，满足基本需求 |
| 产物上传 | `xingyed-site-{version}.zip` | 单一文件，易于下载 |
| 失败策略 | 编译失败不创建 Release | 保证 Release 质量 |

### 2.4 Release Notes 生成方案

**采用方案 C：GitHub 自动生成**

使用 `softprops/action-gh-release` 的 `generate_release_notes: true` 选项。

**优点**：
- 零配置，最简单
- GitHub 自动基于 commits 和 PRs 生成
- 第一个 Tag 时显示所有历史 commits

**缺点**：
- 格式不可控
- 分类不够精细

**后续升级路径**：
- 如需更详细分类 → 切换到 `release-drafter/release-drafter`
- 如需完全自定义 → 使用 `actions/github-script`

---

## 3. 技术细节

### 3.1 环境变量

```yaml
env:
  PNPM_VERSION: '10'
  NODE_VERSION: '22'
```

### 3.2 构建产物结构

Next.js standalone 输出：
```
apps/app/.next/standalone/
├── apps/app/
│   ├── server.js          # 应用入口
│   ├── .next/static/      # 静态资源
│   ├── public/            # 公共资源
│   └── src/contents/      # MDX 内容
├── node_modules/          # 生产依赖
├── package.json
└── packages/              # workspace 包
```

### 3.3 压缩策略

```bash
# 在 standalone 目录内压缩，保持相对路径
cd apps/app/.next/standalone
zip -r ../../../../../xingyed-site-${VERSION}.zip .
```

解压后可以直接运行：
```bash
unzip xingyed-site-v0.1.0.zip
node apps/app/server.js
```

### 3.4 权限配置

```yaml
permissions:
  contents: write  # 创建 Release 和上传产物
```

---

## 4. Workflow 结构

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
      1. Checkout code
      2. Setup pnpm
      3. Setup Node.js
      4. Install dependencies
      5. Type check
      6. Build Next.js app
      7. Verify build output
      8. Compress artifact
      9. Create GitHub Release
```

---

## 5. 使用方式

### 5.1 创建 Release

```bash
# 1. 创建 Tag
git tag v0.1.0

# 2. 推送 Tag（触发 workflow）
git push origin v0.1.0

# 3. Workflow 自动执行
#    - 编译应用
#    - 创建 Release
#    - 上传产物
```

### 5.2 查看结果

- GitHub Actions 页面查看 workflow 执行状态
- Releases 页面查看创建的 Release 和下载的产物

---

## 6. 后续迭代计划

### 6.1 Phase 2：Docker 镜像

- 构建 Docker 镜像
- 推送到容器注册表（Docker Hub / GitHub Container Registry）
- Release 包含镜像 tag 信息

### 6.2 Phase 3：自动版本号

- 基于 Conventional Commits 自动递增版本
- 自动创建 Tag
- 支持 major/minor/patch 自动判断

### 6.3 Phase 4：工作流复用

- 将 `build-test.yml` 改造为可复用 workflow（`workflow_call`）
- `build-release.yml` 复用编译逻辑
- 减少代码重复

---

## 7. 风险和缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 第一个 Tag 没有 Release Notes | 用户体验差 | GitHub 会自动显示所有历史 commits，可接受 |
| 构建产物体积过大 | 下载慢 | 仅包含 standalone，不包含源码和 devDependencies |
| 并发推送多个 Tags | 资源竞争 | 后续可添加 concurrency 控制 |
| 编译失败但未发现 | 发布无效版本 | 严格的验证步骤，失败则终止 |

---

## 8. 参考文档

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [softprops/action-gh-release](https://github.com/softprops/action-gh-release)
- [Next.js Standalone Output](https://nextjs.org/docs/app/api-reference/next-config-js/output)
- [现有 build-test.yml](../../.github/workflows/build-test.yml)
