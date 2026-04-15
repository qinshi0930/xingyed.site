# Bun 迁移总结 - 从 pnpm 到 Bun 的完整实践

> **迁移日期**: 2026-04-14  
> **版本**: v1.0.0  
> **Bun 版本**: 1.3.11  
> **归档位置**: `openspec/changes/archive/2026-04-15-migrate-to-bun/`

---

## 📋 目录

- [执行摘要](#执行摘要)
- [迁移背景](#迁移背景)
- [核心成果](#核心成果)
- [遇到的问题与解决方案](#遇到的问题与解决方案)
- [关键技术决策](#关键技术决策)
- [CI/CD 流程变更](#cicd-流程变更)
- [性能对比](#性能对比)
- [经验教训](#经验教训)
- [后续建议](#后续建议)

---

## 执行摘要

本次变更将项目从 **pnpm** 包管理器迁移到 **Bun**，作为统一的包管理器和 TypeScript 执行工具。迁移涉及：

- ✅ 92 个任务全部完成（100%）
- ✅ 4 个 OpenSpec 规范文档同步
- ✅ v1.0.0 正式版本发布并部署
- ✅ 生产环境验证通过

**核心收益**：
- 镜像大小减少 **36%**（440 MB → 283 MB）
- 启动时间减少 **91%**（1000ms → 89ms）
- 构建工具链简化（pnpm + Node.js + tsx → Bun 一体化）

---

## 迁移背景

### pnpm 的历史问题

在迁移前，项目使用 pnpm 作为包管理器，遇到以下核心问题：

1. **符号链接导致的部署问题**
   - pnpm 使用符号链接组织 `node_modules`
   - Docker 多阶段构建中，符号链接指向的路径在 runner 阶段不存在
   - 需要额外的 `pnpm install --prod` 步骤重新安装依赖

2. **构建流程复杂**
   - 需要 `pnpm-lock.yaml` + `pnpm-workspace.yaml` 双文件
   - Dockerfile 需要三阶段构建（base → builder → runner）
   - CI/CD 流程中需要多次依赖安装

3. **工具链碎片化**
   - 包管理：pnpm
   - TypeScript 执行：tsx / ts-node
   - 运行时：Node.js

### 为什么选择 Bun

Bun 提供了以下优势：

1. **不同的依赖组织方式**
   - 依赖存储在 `node_modules/.bun/` 实际目录中
   - 符号链接结构更简单，更容易处理
   - **注意**：Bun 仍然使用符号链接，只是组织方式不同

2. **一体化解决方案**
   - 包管理器 + TypeScript 执行 + 运行时
   - 减少工具链依赖

3. **性能优势**
   - 更快的依赖安装速度
   - 更小的 lockfile
   - 原生 TypeScript 支持

---

## 核心成果

### 技术指标

| 指标 | pnpm 版本 | Bun 版本 (v1.0.0) | 改进 |
|------|-----------|-------------------|------|
| **Docker 镜像大小** | ~440 MB | 283 MB | **-36%** |
| **容器启动时间** | ~1000ms | 89ms | **-91%** |
| **Lockfile 大小** | 472 KB (pnpm-lock.yaml) | 352 KB (bun.lock) | **-25%** |
| **Dockerfile 阶段** | 3 阶段 | 1 阶段 | **简化 67%** |
| **构建步骤** | pnpm install → build → install --prod | bun install → build | **减少 33%** |

### 架构改进

**Before (pnpm)**:
```
pnpm-lock.yaml + pnpm-workspace.yaml
    ↓
pnpm install (开发依赖)
    ↓
next build → standalone
    ↓
Docker: COPY pnpm-lock.yaml → pnpm install --prod (生产依赖)
    ↓
运行应用
```

**After (Bun)**:
```
bun.lock
    ↓
bun install
    ↓
next build → standalone (依赖已完整)
    ↓
Docker: COPY standalone → 直接运行
```

**关键区别**：
- pnpm 和 Bun **都使用符号链接**
- 根本问题相同：CI/CD artifact 打包时符号链接可能丢失
- Bun 的优势：符号链接结构更简单（集中在 `.bun` 目录），更容易通过 tar.gz 保留

---

## 遇到的问题与解决方案

### 问题 1: 构建产物符号链接丢失（严重）

**问题描述**:
- CI/CD Build Job 使用 `upload-artifact` 打包构建产物
- 默认 zip 压缩不保留符号链接
- **pnpm 和 Bun 都会遇到此问题**（根本原因相同）
- Release 和 Docker Job 下载后符号链接断裂
- 导致 `MODULE_NOT_FOUND` 错误

**根本原因**:

**pnpm 的符号链接结构**:
```
standalone/node_modules/
├── .pnpm/                           ← 实际依赖存储
│   ├── next@14.0.0/
│   ├── react@18.0.0/
│   └── @swc+helpers@0.5.15/
├── next/                            ← 符号链接 → .pnpm/next@14.0.0/node_modules/next
├── react/                           ← 符号链接 → .pnpm/react@18.0.0/node_modules/react
└── @swc/helpers/                    ← 符号链接 → .pnpm/@swc+helpers@...
```

**Bun 的符号链接结构**:
```
standalone/node_modules/
├── .bun/                            ← 实际依赖存储
│   ├── next+14.0.0/
│   ├── react+18.0.0/
│   └── @swc+helpers@0.5.15/
├── next/                            ← 符号链接 → .bun/next+14.0.0/node_modules/next
├── react/                           ← 符号链接 → .bun/react+18.0.0/node_modules/react
└── @swc/helpers/                    ← 符号链接 → .bun/@swc+helpers@0.5.15/
```

**共同问题**：
- 两者都使用符号链接组织依赖
- `upload-artifact` 默认 zip 打包**不跟随符号链接**
- 只复制符号链接本身，不复制实际文件
- 解压后符号链接指向的路径不存在

**为什么之前 pnpm 能工作？**
- pnpm 方案使用 `cp -aL` 解析符号链接（变通方案）
- 或在 Docker runner 阶段重新 `pnpm install --prod`
- 这些方案增加了复杂性和构建时间

**Bun 的优势**：
- 符号链接结构更简单（集中在 `.bun` 目录）
- 使用 tar.gz 打包可以完整保留符号链接
- 无需解析符号链接或重新安装依赖

**解决方案**:
```yaml
# Build Job: 使用 tar.gz 替代 zip
tar 默认保留符号链接
- name: 📦 Pack build output
  run: tar -czf build-output.tar.gz -C /tmp/artifact-build .

- name: 📤 Upload artifact
  uses: actions/upload-artifact@v4
  with:
    name: build-output
    path: build-output.tar.gz
    compression-level: 0  # 已压缩，不再压缩
```

**验证结果**:
- ✅ tar.gz 默认保留符号链接
- ✅ Release 包解压后 `.bun` 目录完整
- ✅ Docker 镜像构建成功，无 MODULE_NOT_FOUND

**影响范围**: ci-cd.yml (Build/Release/Docker Jobs)

---

### 问题 2: tar 打包丢失 monorepo 目录结构

**问题描述**:
- 初始实现使用临时目录打包
- tar 打包时将所有文件放在根级别
- 丢失 `apps/app/.next/standalone` 等路径结构
- Release 和 Docker Job 验证失败

**错误示例**:
```bash
# ❌ 错误：丢失路径结构
tar -czf build-output.tar.gz -C /tmp/artifact-build .
# 解压后：standalone/, public/, Dockerfile (无 apps/app/ 前缀)
```

**解决方案**:
```bash
# ✅ 正确：保持完整 monorepo 路径
mkdir -p /tmp/artifact-build/apps/app/.next/standalone
cp -a .next/standalone/* /tmp/artifact-build/apps/app/.next/standalone/
cp -a public /tmp/artifact-build/apps/app/public/
cp Dockerfile podman-compose.yml /tmp/artifact-build/

tar -czf build-output.tar.gz -C /tmp/artifact-build .
# 解压后：apps/app/.next/standalone/, apps/app/public/, Dockerfile
```

**验证步骤**:
```yaml
- name: 📁 Verify artifact structure
  run: |
    cd build-output
    test -d "apps/app/.next/standalone" || exit 1
    test -d "apps/app/.next/static" || exit 1
    test -d "apps/app/public" || exit 1
    test -f "Dockerfile" || exit 1
```

**影响范围**: ci-cd.yml (Build/Release Jobs)

---

### 问题 3: Vercel 部署失败

**问题描述**:
- 迁移到 Bun 后，Vercel 自动部署失败
- 日志显示：`Running "install" command: pnpm install`
- 错误：`ERR_INVALID_THIS`，所有依赖请求失败

**根本原因**:
- Vercel 未识别 `package.json` 中的 `packageManager: "bun@1.3.11"` 字段
- Vercel 默认使用 pnpm 作为包管理器
- pnpm 无法解析 `bun.lock` 文件

**解决方案**:
创建 `vercel.json` 配置文件：
```json
{
  "buildCommand": "bun run build",
  "installCommand": "bun install",
  "framework": "nextjs"
}
```

**验证结果**:
- ✅ Vercel 正确识别 Bun 配置
- ✅ 依赖安装成功
- ✅ 构建和部署正常

**经验教训**:
- 平台特定配置需要显式声明，不能依赖隐式检测
- 迁移包管理器时需检查所有部署平台

**影响范围**: 项目根目录 (新增 vercel.json)

---

### 问题 4: standalone 产物中冗余 packages 复制

**问题描述**:
- CI/CD Build Job 中手动复制 `packages/` 目录到 artifact
- Dockerfile 中也包含 `COPY packages/ ./packages/`
- 实际 Next.js 的 `transpilePackages` 配置已自动包含这些包

**发现过程**:
```bash
# 检查 standalone 产物
$ ls apps/app/.next/standalone/
node_modules/  packages/  server.js

$ ls apps/app/.next/standalone/packages/
@repo/types/  @repo/utils/  # 已存在！
```

**解决方案**:
```yaml
# ❌ 移除冗余步骤
- name: Copy workspace packages
  run: cp -a packages /tmp/artifact-build/

# Dockerfile: 移除冗余 COPY
# COPY packages/ ./packages/  # 已删除
```

**优化效果**:
- CI/CD 构建时间减少 ~5 秒
- Artifact 大小减少 ~2 MB
- Dockerfile 简化

**影响范围**: ci-cd.yml, Dockerfile

---

### 问题 5: IDE 端口映射面板误报

**问题描述**:
- IDE 显示 3000 端口被 `rootlessport(243321)` 占用
- 实际该进程不存在
- 导致无法启动开发服务器

**排查过程**:
```bash
# 1. 检查进程
$ ps -p 243321
进程 243321 不存在

# 2. 检查端口
$ ss -tlnp | grep :3000
# 无输出（端口未被占用）

# 3. 检查 rootlessport 进程
$ ps aux | grep rootlessport
xingye  937101  0.0  rootlessport  # PID 937101，不是 243321
```

**根本原因**:
- IDE 缓存旧的端口映射信息
- rootlessport 实际占用的是 6379 (Redis) 和 5432 (PostgreSQL)

**解决方案**:
- 刷新 IDE 端口面板
- 或重启 IDE 清除缓存
- 使用 `ss` 命令验证真实端口占用

**经验教训**:
- IDE 面板信息可能不准确，需用命令行验证
- rootlessport 是 podman 容器端口映射工具，不影响开发

---

## 关键技术决策

### 决策 1: Bun 仅作为包管理器，运行时仍用 Node.js

**选择**: ✅ 采用

**理由**:
- Next.js standalone 模式生成 Node.js 可执行文件
- Bun 运行时兼容性问题（某些 npm 包可能不兼容）
- 生产环境稳定性优先
- **注意**：此决策与符号链接问题无关

**实现**:
```json
{
  "scripts": {
    "dev": "bun --bun next dev",      // Bun 执行 next
    "build": "bun --bun next build",  // Bun 构建
    "start": "bun --bun next start"   // Bun 启动（实际仍是 Node.js）
  }
}
```

---

### 决策 2: 单阶段 Docker 构建

**选择**: ✅ 从三阶段简化为单阶段

**Before (pnpm - 3 阶段)**:
```dockerfile
FROM node:20-alpine AS base
FROM base AS builder
RUN pnpm install && pnpm build
FROM base AS runner
COPY --from=builder ...
RUN pnpm install --prod  # 重新安装依赖
```

**After (Bun - 1 阶段)**:
```dockerfile
FROM node:20-alpine
COPY standalone/ ./  # 依赖已完整
USER node
CMD ["node", "server.js"]
```

**理由**:
- Bun 的 standalone 产物已包含完整依赖
- 无需重新安装
- 镜像更小，构建更快

---

### 决策 3: tar.gz 替代 zip 打包 Artifact

**选择**: ✅ tar.gz

**对比**:

| 特性 | zip | tar.gz |
|------|-----|--------|
| 符号链接保留 | ❌ 默认不保留 | ✅ 默认保留 |
| 压缩率 | 中等 | 高 |
| Linux 兼容性 | 好 | 原生 |
| 文件大小 | 稍大 | 稍小 |

**实现**:
```yaml
# Build Job
- name: Pack
  run: tar -czf build-output.tar.gz -C /tmp/artifact-build .

- name: Upload
  uses: actions/upload-artifact@v4
  with:
    path: build-output.tar.gz
    compression-level: 0  # 已压缩
```

---

### 决策 4: 禁用 Turbopack

**选择**: ✅ 开发环境禁用 Turbopack

**理由**:
- Turbopack 与 `--bun` 标志不兼容
- Bun 已提供足够的性能
- 避免潜在的类型检查问题

**变更**:
```json
{
  "scripts": {
    "dev": "bun --bun next dev",  // 移除 --turbopack
    "build": "bun --bun next build"  // 移除 --turbopack
  }
}
```

---

## CI/CD 流程变更

### Build Job 变更

**Before (pnpm)**:
```yaml
- uses: pnpm/action-setup@v4
- run: pnpm install
- run: pnpm build
- run: cp -aL standalone/ resolved-standalone/  # 解析符号链接
- uses: actions/upload-artifact@v4
  with:
    path: resolved-standalone/
```

**After (Bun)**:
```yaml
- uses: oven-sh/setup-bun@v2
- run: bun install --frozen-lockfile
- run: bun run build
- run: tar -czf build-output.tar.gz -C /tmp/artifact-build .
- uses: actions/upload-artifact@v4
  with:
    path: build-output.tar.gz
    compression-level: 0
```

**关键变化**:
- ✅ pnpm → Bun
- ✅ 移除符号链接解析步骤（Bun 不需要）
- ✅ 使用 tar.gz 打包（保留符号链接）
- ✅ 保持 monorepo 目录结构

---

### Release Job 变更

**Before (pnpm)**:
```yaml
- uses: actions/download-artifact@v4
- run: cp -a build-output/ release/
- run: zip -r release.zip release/
```

**After (Bun)**:
```yaml
- uses: actions/download-artifact@v4
- run: tar -xzf build-output.tar.gz -C build-output/
- run: |
    cd build-output
    # 验证产物结构
    test -d "apps/app/.next/standalone"
    test -d "apps/app/public"
    test -f "Dockerfile"
- run: tar -czf xingyed-site-${VERSION}.tar.gz .
```

**关键变化**:
- ✅ 解压 tar.gz 而非直接使用
- ✅ 增加产物验证步骤
- ✅ 重新打包为带版本号的 Release 文件

---

### Docker Job 变更

**Before (pnpm)**:
```yaml
- uses: actions/download-artifact@v4
- run: cp -a build-output/ docker-context/
- run: podman build -t xingyed-site .
```

**After (Bun)**:
```yaml
- uses: actions/download-artifact@v4
- run: tar -xzf build-output.tar.gz -C docker-context/
- run: podman build -t xingyed-site .
```

**关键变化**:
- ✅ 解压 tar.gz 到构建上下文
- ✅ Dockerfile 已简化为单阶段

---

## 性能对比

### 构建性能

| 指标 | pnpm | Bun | 改进 |
|------|------|-----|------|
| **依赖安装（首次）** | ~30s | ~30s | 相当 |
| **依赖安装（缓存）** | ~10s | ~8s | -20% |
| **Next.js 构建** | ~60s | ~55s | -8% |
| **CI/CD 总时间** | ~180s | ~165s | -8% |

### 运行时性能

| 指标 | pnpm | Bun | 改进 |
|------|------|-----|------|
| **容器启动时间** | ~1000ms | 89ms | **-91%** |
| **首次请求延迟** | ~200ms | ~180ms | -10% |
| **内存占用** | ~250 MB | ~230 MB | -8% |

### 产物大小

| 指标 | pnpm | Bun | 改进 |
|------|------|-----|------|
| **Lockfile** | 472 KB | 352 KB | **-25%** |
| **node_modules** | ~300 MB | ~77 MB (.bun) | **-74%** |
| **Docker 镜像** | ~440 MB | 283 MB | **-36%** |
| **Release 包** | ~65 MB | 56 MB | **-14%** |

---

## 经验教训

### ✅ 成功经验

1. **充分验证再迁移**
   - 先在实验分支 `experiment/bun-verify` 验证
   - 4 个阶段验证：基础 → 依赖 → 构建 → Docker
   - 确保每个阶段通过后再推进

2. **理解符号链接问题的本质**
   - pnpm 和 Bun **都使用符号链接**组织依赖
   - 根本问题相同：artifact 打包时符号链接可能丢失
   - **关键区别**：Bun 的符号链接结构更简单（集中在 `.bun` 目录）
   - **解决方案**：使用 tar.gz 打包保留符号链接（对两者都有效）
   - 这是理解整个迁移的关键点

3. **CI/CD 流程同步更新**
   - 使用 OpenSpec 管理工作流变更
   - 92 个任务逐步验证
   - 每个阶段都有明确的验证标准

4. **完整的测试验证**
   - 本地 Docker 构建测试
   - Release 包下载解压测试
   - podman-compose 编排测试
   - 生产环境部署测试

---

### ⚠️ 踩过的坑

1. **Vercel 配置陷阱**
   - ❌ 错误假设：Vercel 会自动识别 `packageManager` 字段
   - ✅ 正确做法：显式创建 `vercel.json` 配置
   - 📝 教训：平台特定配置需显式声明

1. **Artifact 打包符号链接**
   - ❌ 错误假设：Bun 没有符号链接问题
   - ✅ 实际情况：**pnpm 和 Bun 都有符号链接**，根本问题相同
   - ✅ 正确做法：使用 tar.gz 打包（保留符号链接）
   - 📝 教训：理解包管理器的依赖组织方式，不要被表象误导

3. **monorepo 目录结构**
   - ❌ 错误：临时目录打包丢失路径结构
   - ✅ 正确：复制时保持完整 monorepo 路径
   - 📝 教训：验证 artifact 解压后的结构

4. **冗余文件复制**
   - ❌ 错误：手动复制 `packages/` 目录
   - ✅ 正确：Next.js 已自动包含（transpilePackages）
   - 📝 教训：理解框架默认行为，避免重复工作

5. **IDE 信息误导**
   - ❌ 错误：完全信任 IDE 端口面板
   - ✅ 正确：用 `ss` / `lsof` 命令验证
   - 📝 教训：IDE 缓存可能不准确

---

### 📚 最佳实践

1. **迁移 checklist**
   ```
   □ 创建实验分支
   □ 备份原配置文件
   □ 修改 package.json
   □ 执行依赖安装
   □ 验证依赖兼容性
   □ 执行构建
   □ 验证产物结构
   □ 本地 Docker 测试
   □ CI/CD 配置更新
   □ 推送测试 tag
   □ 验证 Release 包
   □ 生产环境部署
   □ 监控 24 小时
   ```

2. **CI/CD 验证流程**
   ```
   Build Job → 验证产物打包
      ↓
   Release Job → 验证解压和结构
      ↓
   Docker Job → 验证镜像构建
      ↓
   Webhook → 验证部署成功
      ↓
   本地验证 → 下载 Release 包完整测试
   ```

3. **文档同步**
   - 每个重大变更更新 OpenSpec 文档
   - tasks.md 实时标记完成状态
   - 归档时同步 delta specs 到主 specs

---

## 后续建议

### 短期（1-2 周）

1. **监控生产环境**
   - 观察容器运行稳定性
   - 收集错误日志
   - 监控性能指标

2. **Vercel 部署验证**
   - 确认 Bun 配置生效
   - 验证构建和部署正常
   - 检查冷启动时间

3. **开发者体验**
   - 更新 README 安装说明
   - 添加 Bun 快速入门指南
   - 更新 CI/CD 文档

---

### 中期（1-2 月）

1. **探索 Bun 运行时**
   - 评估 Bun 作为生产运行时的可行性
   - 测试 Bun 原生 HTTP 服务器
   - 对比 Node.js vs Bun 运行时性能

2. **优化 CI/CD**
   - 利用 Bun 的缓存机制加速构建
   - 探索 Bun 的 bundle 功能
   - 减少 CI/CD 运行时间

3. **依赖更新**
   - 定期更新 Bun 版本
   - 关注 Bun 新特性
   - 评估新的优化机会

---

### 长期（3-6 月）

1. **生态兼容性**
   - 关注 Bun 对 Next.js 的支持进展
   - 评估 Bun 原生 API 路由
   - 探索 Bun 测试框架替代 Jest

2. **性能优化**
   - 利用 Bun 的宏（Bundler Macros）
   - 探索 Bun 插件系统
   - 优化构建和启动性能

3. **工具链统一**
   - 评估 Bun 替代 ESLint/Prettier
   - 探索 Bun 测试框架
   - 简化开发工具链

---

## 附录

### A. 修改的文件清单

**配置文件**:
- `package.json` - 根工作区配置
- `apps/app/package.json` - 应用配置
- `vercel.json` - Vercel 部署配置（新增）
- `Dockerfile` - Docker 构建配置（简化）
- `.gitignore` - 添加 bun.lock
- `.dockerignore` - 更新忽略规则

**CI/CD**:
- `.github/workflows/ci-cd.yml` - 统一工作流

**OpenSpec**:
- `openspec/changes/migrate-to-bun/` - 变更文档（已归档）
- `openspec/specs/bun-package-manager/` - Bun 规范（新增）
- `openspec/specs/build-release-workflow/` - 构建规范（更新）
- `openspec/specs/dockerfile-multi-stage/` - Docker 规范（更新）
- `openspec/specs/github-actions-cicd/` - CI/CD 规范（更新）

---

### B. 关键命令参考

```bash
# 安装依赖
bun install

# 开发环境
bun run dev

# 生产构建
bun run build

# 启动生产服务器
bun run start

# TypeScript 脚本
bun run scripts/deploy-webhook.ts

# Docker 构建
podman build -t xingyed-site .

# Docker 运行
podman run -d --name app -p 3000:3000 xingyed-site
```

---

### C. 相关链接

- **Bun 官方文档**: https://bun.sh/docs
- **Bun GitHub**: https://github.com/oven-sh/bun
- **Next.js 部署文档**: https://nextjs.org/docs/app/building-your-application/deploying
- **OpenSpec 归档**: `openspec/changes/archive/2026-04-15-migrate-to-bun/`
- **Release v1.0.0**: https://github.com/qinshi0930/xingyed.site/releases/tag/v1.0.0

---

## 总结

本次 Bun 迁移是一次**成功的现代化升级**，通过 92 个任务的系统化执行，实现了：

✅ **技术收益**: 符号链接问题通过 tar.gz 打包解决（对 pnpm 和 Bun 都有效），Docker 构建简化 67%  
✅ **性能收益**: 镜像减少 36%，启动时间减少 91%  
✅ **体验收益**: 工具链统一，开发流程简化  
✅ **质量收益**: 完整的测试验证，生产环境稳定运行  

**关键成功因素**:
1. 充分的实验验证（4 个阶段）
2. 系统化的任务管理（OpenSpec）
3. 完整的 CI/CD 测试
4. 及时的问题发现和解决

**最重要的一点**: pnpm 和 Bun **都使用符号链接**，根本问题相同。Bun 的优势在于符号链接结构更简单（集中在 `.bun` 目录），通过 tar.gz 打包可以完整保留，无需额外的符号链接解析或重新安装依赖步骤。

---

**文档版本**: 1.0  
**最后更新**: 2026-04-15  
**维护者**: xingye  
**状态**: ✅ 已完成并归档
