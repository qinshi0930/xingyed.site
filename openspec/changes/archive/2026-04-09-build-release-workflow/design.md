## Context

当前项目已有 `build-test.yml` workflow 用于 PR 和 push 到 main 分支时的构建验证。但缺少基于 Git Tag 的 Release 发布流程。需要创建独立的 `build-release.yml` workflow，实现从编译到 Release 创建的完整自动化。

项目采用 monorepo 架构，Next.js 应用位于 `apps/app/`，使用 standalone 输出模式构建。构建产物可直接通过 `node apps/app/server.js` 运行。

## Goals / Non-Goals

**Goals:**
- 实现基于 Git Tag 的自动化构建和 Release 发布
- 编译产物验证确保 Release 质量
- 压缩产物便于下载和分发
- 自动生成 Release Notes 减少手动操作
- 独立执行，不依赖其他 workflow

**Non-Goals:**
- Docker 镜像构建和推送（后续迭代）
- 自动版本号管理（后续迭代）
- 自动部署到服务器（后续迭代）
- 复用 build-test.yml 的编译逻辑（后续考虑改造为 workflow_call）

## Decisions

### 1. 触发方式：Git Tag 推送

**决策**: 使用 `push.tags: 'v*'` 触发 workflow

**理由**: 
- 标准实践，开发者对 Tag 发布流程熟悉
- 手动控制发布时机，避免意外发布
- 与语义化版本管理兼容

**备选方案**:
- `workflow_dispatch`: 过于手动，缺少版本标记
- 自动检测 commit: 不可控，容易误发布

### 2. 编译方式：独立执行

**决策**: workflow 独立执行完整的编译流程，不复用 build-test.yml

**理由**:
- 简单直接，无跨 workflow 依赖
- 避免修改现有 build-test.yml 的影响范围
- 简化版本优先，后续可优化为 workflow_call

**备选方案**:
- `workflow_call`: 需要改造 build-test.yml，影响现有流程
- 共享 Action: 过度工程化

### 3. 构建步骤：不使用 Secrets

**决策**: Type Check 和 Build 步骤不使用 GitHub API secrets

**理由**:
- 简化版本避免外部依赖
- 降低 secrets 管理复杂度
- 构建过程不依赖外部 API 数据

**影响**: 构建时无法获取 GitHub API 数据（如博客统计），但 standalone 产物已包含静态内容

### 4. Release Notes：GitHub 自动生成

**决策**: 使用 `softprops/action-gh-release` 的 `generate_release_notes: true`

**理由**:
- 零配置，最简单
- GitHub 自动基于 commits 和 PRs 生成
- 第一个 Tag 时显示所有历史 commits

**备选方案**:
- `release-drafter`: 需要额外配置，功能更强大但复杂度高
- 自定义脚本: 维护成本高

**后续升级路径**: 如需更详细分类可切换到 release-drafter

### 5. 产物压缩：zip 格式

**决策**: 压缩 standalone 目录为 `xingyed-site-{version}.zip`

**理由**:
- 单一文件易于下载和管理
- zip 格式跨平台兼容
- 减小 Release 附件体积

**压缩策略**: 在 standalone 目录内压缩，保持相对路径结构

### 6. 权限配置：最小权限原则

**决策**: 仅配置 `contents: write` 权限

**理由**:
- 创建 Release 和上传产物所需的最小权限
- 符合安全最佳实践

## Risks / Trade-offs

### [风险 1] 第一个 Tag 的 Release Notes 不够详细
**影响**: 用户体验稍差  
**缓解**: GitHub 会显示所有历史 commits，可接受。后续可切换到 release-drafter

### [风险 2] 构建产物体积较大
**影响**: 下载速度慢  
**缓解**: 仅包含 standalone 产物（已包含生产依赖），不包含源码和 devDependencies

### [风险 3] 并发推送多个 Tags
**影响**: 资源竞争  
**缓解**: 后续可添加 concurrency 控制，当前阶段可接受

### [风险 4] 编译失败但未被发现
**影响**: 发布无效版本  
**缓解**: 严格的产物验证步骤（检查 .next、BUILD_ID、standalone、server.js），失败则终止 workflow

### [权衡] 代码重复 vs 简单性
**现状**: build-release.yml 与 build-test.yml 有重复的编译逻辑  
**权衡**: 选择简单性，接受适度重复  
**后续**: 可改造 build-test.yml 支持 workflow_call 来消除重复
