## Context

当前项目采用 Bun 运行时 (`bun --bun`) 配合 Webpack 构建工具。生产构建耗时约 96.4 秒，其中编译阶段占用 20.4 秒。项目实际生产部署使用 Node.js 运行时（Docker 容器中使用 `node:22-alpine`），开发环境与生产环境的运行时差异可能导致潜在的不一致问题。

Next.js 15 已稳定支持 Turbopack 构建工具，官方基准测试显示可提升 50-70% 构建速度。初步测试表明，本项目使用 Turbopack 可将构建时间降至 41.4 秒（提升 57%），编译时间降至 10.2 秒（提升 50%）。

## Goals / Non-Goals

**Goals:**
- 统一开发和生产运行时环境（Node.js）
- 采用 Turbopack 提升构建和开发服务器性能
- 建立清晰的 monorepo 脚本命名规范
- 同步更新所有相关配置文件（CI/CD、Vercel）

**Non-Goals:**
- 不改变 Docker 构建流程（仍使用预构建 standalone 产物）
- 不改变生产部署方式（仍使用 Node.js 运行 server.js）
- 不修改 `@repo/types` 和 `@repo/utils` 包
- 不优化 Turbopack 产物大小（后续单独优化）

## Decisions

### Decision 1: 切换为 Node.js 运行时

**选择**: 移除 `bun --bun` 标志，使用 Node.js 作为默认运行时

**理由**:
- 生产环境已使用 Node.js，统一环境减少不一致风险
- Bun 作为包管理器仍保留（`bun install`），仅运行时切换
- Node.js 22 LTS 稳定可靠，与 Next.js 15 完全兼容
- 简化团队开发环境配置

**替代方案**:
- 继续使用 Bun 运行时：❌ 生产/开发环境不一致
- 同时维护两套配置：❌ 增加维护复杂度

### Decision 2: 采用 Turbopack 构建工具

**选择**: 在 dev 和 build 命令中添加 `--turbopack` 标志

**理由**:
- 构建速度提升 57%（96.4s → 41.4s）
- 开发服务器启动和 HMR 更快
- Next.js 15 官方支持，生产可用
- 与现有构建流程完全兼容

**替代方案**:
- 保持 Webpack：❌ 构建速度慢
- 仅在 dev 使用 Turbopack：❌ 无法保证构建一致性

**已知问题**:
- 产物大小增加 132%（102kB → 237kB）
- 需要监控生产环境加载性能
- 后续可能需要优化 chunk splitting 策略

### Decision 3: 脚本命名采用 `app:*` 前缀

**选择**: 根目录脚本命名为 `app:dev`、`app:build`、`app:start`、`app:lint`

**理由**:
- 明确标识命令针对 `@repo/app` 应用
- 为未来多应用扩展预留空间（如 `admin:dev`、`api:build`）
- 符合 monorepo 最佳实践
- 提高配置可读性和可维护性

**替代方案**:
- 保持简短命名（`dev`、`build`）：❌ 不够明确，扩展性差
- 使用完整名称（`app-dev`、`app-build`）：❌ 不符合 npm 脚本惯例

### Decision 4: Bun 仅作为包管理器

**选择**: 保留 `bun install` 但运行时使用 Node.js

**理由**:
- Bun 包管理器速度远超 pnpm/npm
- `bun.lock` 文件已建立，迁移成本高
- 运行时使用 Node.js 保证生产环境一致性
- 最佳组合：Bun 的安装速度 + Node.js 的稳定性

## Risks / Trade-offs

### [风险 1] Turbopack 产物大小增加 132%
**影响**: 首屏加载时间可能增加
**缓解措施**:
- 监控生产环境 Core Web Vitals 指标
- 评估启用代码分割优化
- 如果性能下降明显，考虑回退到 Webpack

### [风险 2] Turbopack 兼容性问题
**影响**: 某些 Webpack 插件或配置可能不兼容
**缓解措施**:
- 已在测试中验证构建成功
- 保持 `next.config.ts` 配置简单
- 如遇到问题，可临时切换回 Webpack

### [风险 3] 团队成员需要更新本地环境
**影响**: 习惯使用 Bun 运行时的开发者需要适应
**缓解措施**:
- 更新 README 文档
- 提供迁移指南
- Bun 仍可用于安装依赖

### [权衡] 构建速度 vs 产物大小
**选择**: 优先构建速度，接受产物大小增加
**理由**:
- 构建速度直接影响开发体验（每天多次）
- 产物大小影响用户加载（可通过 CDN 缓存缓解）
- 57% 的构建速度提升显著提升开发效率
- 产物大小后续可优化

## Migration Plan

### 部署步骤
1. ✅ 修改 `apps/app/package.json` 脚本（添加 `--turbopack`）
2. ✅ 修改根目录 `package.json` 脚本（`app:*` 命名）
3. ✅ 更新 `.github/workflows/ci-cd.yml` 使用新脚本
4. ✅ 更新 `vercel.json` 使用新脚本
5. ⏳ 运行基准测试验证性能提升
6. ⏳ 监控生产环境性能指标

### 回滚策略
如果发现问题，可快速回滚：
1. 移除 `--turbopack` 标志
2. 恢复 `bun --bun` 运行时
3. 恢复原始脚本命名
4. 重新部署

回滚时间预计 < 5 分钟。

## Open Questions

1. **产物大小优化**: 是否需要立即优化 Turbopack 产物大小，还是观察一段时间？
2. **CI/CD 缓存**: 是否需要调整 CI/CD 缓存策略以适应 Turbopack？
3. **开发环境文档**: 是否需要更新开发环境配置文档？
