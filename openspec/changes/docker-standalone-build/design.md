## Context

当前项目采用 Docker 多阶段构建模式：
- **Builder 阶段**：安装 pnpm → 安装依赖 → 复制源码 → 执行 `pnpm build`
- **Runner 阶段**：安装生产依赖 → 复制构建产物 → 运行应用

问题：
- Docker 构建耗时长（每次都需要安装依赖和构建）
- Dockerfile 复杂（68 行，两个阶段）
- 镜像体积较大（包含构建工具和 devDependencies）
- 本地开发调试不灵活

新的 Next.js standalone 模式特性：
- `output: "standalone"` 配置已启用
- `.next/standalone` 目录自包含所有生产依赖
- 可以直接通过 `node apps/app/server.js` 运行

## Goals / Non-Goals

**Goals:**
- 简化 Dockerfile 为单阶段构建（约 20 行）
- 缩短 Docker 构建时间（跳过依赖安装和构建步骤）
- 减小镜像体积（不包含构建工具）
- 提供便捷的 npm scripts 封装构建流程
- 添加构建产物验证，避免打包错误产物

**Non-Goals:**
- 不修改 Next.js 构建配置（`next.config.ts` 已正确配置）
- 不涉及 CI/CD 流程调整（webhook 已禁用）
- 不修改 `podman-compose.yml` 配置（环境变量注入保持不变）
- 不处理 `.next` 目录的 Git 跟踪（保持不提交）

## Decisions

### 决策 1：环境变量注入方式
**选择**：运行时注入（通过 `podman-compose.yml` 的 `env_file`）

**理由**：
- 符合 12-Factor App 原则
- 环境变量不进入镜像层（安全）
- 同一镜像可用于不同环境
- 保持现有配置不变

**替代方案**：
- ~~构建时注入（打包进镜像）~~：安全风险，每个环境需要不同镜像

### 决策 2：构建流程自动化策略
**选择**：npm scripts 封装

**理由**：
- 无需额外工具（Makefile、bash 脚本）
- 跨平台兼容
- 开发者熟悉 npm scripts
- 项目已有 npm scripts 传统

**替代方案**：
- ~~Makefile~~：Windows 兼容性差
- ~~独立 bash 脚本~~：需要额外维护文件

### 决策 3：构建产物验证
**选择**：检查 `.next/standalone` 目录存在性

**实现**：`test -d apps/app/.next/standalone || (echo 'Build failed' && exit 1)`

**理由**：
- 快速失败，避免浪费时间构建 Docker 镜像
- 简单可靠
- 命令行内联，无需额外脚本

### 决策 4：`.dockerignore` 例外规则
**选择**：保持忽略 `.next/`，添加例外 `!.next/standalone` 和 `!.next/static`

**理由**：
- 符合 `.dockerignore` 语法规范
- 最小化 Docker 上下文传输量
- 只允许必要的构建产物进入

### 决策 5：Standalone 产物依赖管理
**选择**：不复制任何 `node_modules`

**理由**：
- Next.js standalone 模式已将所有依赖打包到 `.next/standalone/node_modules`
- 避免重复复制和镜像膨胀
- 简化 Dockerfile

## Risks / Trade-offs

### Risk 1：本地构建环境污染
**风险**：本地 `node_modules` 可能包含开发依赖，影响生产环境

**缓解**：
- Standalone 模式只打包生产必需的依赖
- 不复制根目录的 `node_modules`
- Docker 镜像只包含 standalone 产物

### Risk 2：构建产物过期
**风险**：开发者可能忘记重新构建，使用旧的 standalone 产物

**缓解**：
- npm scripts 自动先执行 `pnpm build`
- 添加构建产物验证
- 文档说明正确流程

### Risk 3：调试困难
**风险**：如果构建产物有问题，难以排查

**缓解**：
- 保持 `.next` 目录在本地可访问
- 可以单独执行 `pnpm build` 验证构建
- 可以检查 standalone 产物结构

### Trade-off：灵活性 vs 简便性
- **牺牲**：无法在 Docker 内部独立构建（需要本地环境）
- **获得**：更快的构建速度、更简单的 Dockerfile、更小的镜像

## Migration Plan

### 部署步骤
1. 修改 `Dockerfile` 为单阶段构建
2. 修改 `.dockerignore` 添加例外规则
3. 修改 `package.json` 添加 Docker scripts
4. 本地测试构建流程：`pnpm docker:deploy`
5. 验证应用正常运行

### 回滚策略
- Git 回滚这三个文件的修改
- 恢复原来的多阶段 Dockerfile
- 重新构建镜像

## Open Questions

无 - 所有设计决策已确认。
