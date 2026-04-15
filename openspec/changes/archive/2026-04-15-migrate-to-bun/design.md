## Context

项目当前使用 pnpm 作为包管理器，在 monorepo 架构下运行良好。但在 Docker 容器化部署场景中，pnpm 的符号链接依赖管理机制导致 standalone 产物在 CI/CD artifact 传递过程中依赖断裂，生产容器启动时出现 `MODULE_NOT_FOUND` 错误。

**当前状态：**
- 包管理器：pnpm 10.x
- Node.js 版本：22.x（生产运行时）
- Monorepo 结构：apps/app（Next.js）+ packages/*（共享包）
- Docker 构建：本地构建 standalone 产物 → artifact 上传 → Docker 打包
- 变通方案：Dockerfile 中添加 `pnpm install --prod` 重新安装依赖

**约束条件：**
- 必须保持 Node.js 22 作为生产运行时（兼容性考虑）
- 必须支持 monorepo workspace 依赖
- 必须兼容现有 CI/CD 流程（GitHub Actions）
- 必须保持 Docker 镜像体积优化（使用 standalone 模式）

## Goals / Non-Goals

**Goals:**
- 彻底解决 Docker 部署中的符号链接断裂问题
- 简化 Docker 构建流程（移除重新安装依赖步骤）
- 保持或提升依赖安装速度
- 保持 monorepo workspace 支持
- 所有关键依赖兼容（better-auth, Firebase, MDX, Redis）

**Non-Goals:**
- 不使用 Bun 作为生产运行时（仍使用 Node.js 22）
- 不迁移到 Bun 的运行时特性（bun.serve、Bun APIs）
- 不修改现有应用代码或业务逻辑
- 不改变 Docker 镜像的基本结构（standalone 模式）

## Decisions

### Decision 1: Bun 仅作为包管理器和 TS 执行工具

**决策：** 仅使用 Bun 的包管理和 TypeScript 执行能力，生产运行时仍使用 Node.js。

**理由：**
- Bun 的 `node_modules/.bun` 结构解决了符号链接问题
- Bun 原生支持 TypeScript，无需 tsx/ts-node
- Node.js 22 作为成熟运行时，稳定性更好
- 避免 Bun 运行时的潜在兼容性问题

**替代方案：**
- ❌ 完全迁移到 Bun 运行时：风险较高，生态兼容性未知
- ❌ 保持 pnpm + 多阶段构建：复杂度高，构建时间长

### Decision 2: 禁用 Turbopack（验证阶段）

**决策：** 在 Bun 迁移初期禁用 Next.js 的 Turbopack，使用传统构建方式。

**理由：**
- Bun 与 Turbopack 的兼容性存在已知问题（GitHub Issues 报告）
- 传统构建方式稳定可靠
- 可以后续单独验证和启用 Turbopack

**替代方案：**
- ⏸️ 使用 `bun --bun next dev --turbopack`：需要额外验证，推迟到后续阶段

### Decision 3: Workspace 配置迁移

**决策：** 从 `pnpm-workspace.yaml` 迁移到 `package.json` 的 `workspaces` 字段。

**理由：**
- Bun 原生支持 `package.json` 的 `workspaces` 字段
- 减少配置文件数量
- 与 npm/yarn 的 workspace 配置格式一致

**迁移方案：**
```json
// package.json
{
  "workspaces": ["apps/app", "packages/*"]
}
```

替代方案：
- ❌ 保持 `pnpm-workspace.yaml`：Bun 不完全兼容此格式

### Decision 4: 依赖覆盖配置迁移

**决策：** 从 `pnpm.overrides` 迁移到 Bun 的 `overrides` 字段。

**理由：**
- Bun 支持 `package.json` 的 `overrides` 字段
- 与 npm 的 overrides 格式一致

**迁移方案：**
```json
// package.json
{
  "overrides": {
    "package-name": "version"
  }
}
```

### Decision 5: Docker 构建简化

**决策：** Dockerfile 直接复制 standalone 产物，不再重新安装依赖。

**理由：**
- Bun 的 `node_modules/.bun` 是实际目录，不是符号链接
- Docker COPY 命令可以完整复制依赖
- 减少构建步骤，缩短构建时间

**新的 Dockerfile 结构：**
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY apps/app/.next/standalone/ ./
COPY apps/app/.next/static/ ./apps/app/.next/static/
COPY apps/app/public/ ./apps/app/public/
COPY apps/app/src/contents/ ./apps/app/src/contents/
CMD ["node", "apps/app/server.js"]
```

**注意**：standalone 已通过 `transpilePackages` 包含 @repo/types 和 @repo/utils，无需单独 COPY packages

**对比当前方案：**
- 移除：`COPY pnpm-lock.yaml ./`
- 移除：`RUN pnpm install --prod --frozen-lockfile`
- 移除：`COPY packages/ ./packages/`

### Decision 6: CI/CD 脚本更新

**决策：** GitHub Actions 中使用 `oven-sh/setup-bun` 官方 Action。

**理由：**
- 官方维护，稳定性有保障
- 支持版本锁定
- 自动缓存依赖

**迁移方案：**
```yaml
# Before
- uses: pnpm/action-setup@v4
  with:
    version: 10

# After
- uses: oven-sh/setup-bun@v2
  with:
    bun-version: "1.3.11"
```

## Risks / Trade-offs

### Risk 1: Bun 版本兼容性
**风险：** Bun 仍在快速迭代，可能存在 Breaking Changes。

**缓解措施：**
- 锁定 Bun 版本（1.3.11）
- 定期更新并测试
- 保留 pnpm-lock.yaml.bak 作为回滚依据

### Risk 2: Turbopack 性能损失
**风险：** 禁用 Turbopack 可能导致构建速度下降。

**缓解措施：**
- 后续单独验证 Bun + Turbopack 兼容性
- 传统构建速度仍在可接受范围
- 可以对比测试构建时间

### Risk 3: 开发者环境迁移
**风险：** 团队成员需要安装 Bun，学习成本。

**缓解措施：**
- 更新 README 和开发文档
- 提供一键安装脚本
- Bun 命令与 pnpm 基本一致（`bun install`、`bun run`）

### Risk 4: 原生模块兼容性
**风险：** 某些原生模块（如 sharp）可能在 Bun 下有问题。

**缓解措施：**
- ✅ 已验证 sharp 在 Bun 下正常工作
- ✅ 已验证所有关键依赖兼容
- 监控生产环境错误日志

## Migration Plan

### Phase 1: 实验验证（已完成）
1. ✅ 创建实验分支 `experiment/bun-verify`
2. ✅ 验证基础功能（安装、workspace、依赖解析）
3. ✅ 验证关键依赖兼容性
4. ✅ 验证构建和 Docker 部署
5. ✅ 生成验证报告

### Phase 2: 配置更新
1. 更新根 package.json（workspaces、scripts）
2. 更新 apps/app/package.json（scripts）
3. 移除 pnpm-workspace.yaml
4. 更新 .gitignore（移除 pnpm 相关）
5. 更新 Dockerfile

### Phase 3: CI/CD 更新
1. 更新 build-test.yml（setup-bun）
2. 更新 build-release.yml（setup-bun）
3. 更新 docker-publish.yml（如有需要）
4. 测试完整 CI/CD 流程

### Phase 4: 文档更新
1. 更新 README.md（安装 Bun）
2. 更新开发文档
3. 更新部署文档

### Phase 5: 部署与监控
1. 合并到 main 分支
2. 部署到生产环境
3. 监控错误日志
4. 性能对比（构建时间、镜像体积）

### Rollback Strategy
如果出现严重问题：
1. 恢复 pnpm-lock.yaml.bak 和 pnpm-workspace.yaml.bak
2. 恢复 package.json 的 pnpm 配置
3. 恢复 Dockerfile 的 pnpm install 步骤
4. 重新部署

## Open Questions

1. **Turbopack 兼容性验证计划**
   - 何时验证 Bun + Turbopack 组合？
   - 是否需要回退到传统构建？

2. **Bun 版本更新策略**
   - 更新频率？（每月/每季度）
   - 是否跟随最新稳定版？

3. **开发者迁移时间线**
   - 是否需要并行支持 pnpm 和 Bun 的过渡期？
   - 如何通知团队成员？
