## Why

当前项目使用 Bun 运行时 + Webpack 构建工具，生产构建耗时约 96.4 秒，开发体验较差。Next.js 15 已稳定支持 Turbopack 构建工具，据官方基准测试可提升构建速度 50-70%。同时，项目实际部署使用 Node.js 运行时，开发时使用 Bun 运行时可能导致环境不一致问题。本次优化旨在统一运行时环境并采用更快的构建工具，提升开发效率和 CI/CD 流水线速度。

## What Changes

- 将所有 npm scripts 的运行时从 Bun (`bun --bun`) 切换为 Node.js（默认）
- 构建工具从 Webpack 切换为 Turbopack（`--turbopack` 标志）
- 根目录脚本命名规范化：`dev/build/start/lint` → `app:dev/app:build/app:start/app:lint`，明确标识针对 `@repo/app` 应用
- 同步更新 CI/CD 工作流配置使用新脚本名称
- 同步更新 Vercel 配置使用新脚本名称

## Capabilities

### New Capabilities
- `turbopack-build`: 使用 Turbopack 进行生产构建，替代 Webpack，显著提升构建速度
- `script-naming-convention`: 采用 `app:*` 前缀命名规范，明确标识应用级脚本，为未来多应用 monorepo 扩展做准备

### Modified Capabilities
- `ci-cd-pipeline`: CI/CD 流水线中的构建和 lint 命令需要更新为新的脚本名称
- `vercel-deployment`: Vercel 部署配置需要更新 buildCommand 使用新脚本名称

## Impact

- **构建性能**: 预期构建时间从 ~96s 降低到 ~41s（提升约 57%）
- **构建产物**: Turbopack 产物可能比 Webpack 大约 132%（237kB vs 102kB），需要监控生产环境加载性能
- **CI/CD**: `.github/workflows/ci-cd.yml` 需要更新
- **Vercel**: `vercel.json` 需要更新
- **开发环境**: `dev` 命令也将使用 Turbopack，提升本地开发热更新速度
- **Docker 构建**: 不受影响，使用预构建产物
- **生产部署**: 不受影响，使用 Node.js 运行时运行 standalone 产物
