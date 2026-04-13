## Context

当前项目有 4 个独立的 workflow 文件：
- `build-test.yml`: push/PR to main 时触发，负责代码质量检查和构建
- `build-release.yml`: push tag 时触发，负责创建 GitHub Release
- `docker-publish.yml`: push tag 时触发，负责构建和推送 Docker 镜像
- `manual-deploy.yml`: 手动触发，负责部署到生产环境

**核心问题**：`build-release.yml` 和 `docker-publish.yml` 需要从 `build-test.yml` 下载 artifact，但由于触发时机不同（push main vs push tag），导致 run_id 不同，artifact 无法跨 workflow run 访问。

**约束条件**：
- 必须解决 artifact 跨域问题
- push to main 时不触发 release/docker
- PR 时只进行代码质量检查，不触发 build
- manual-deploy.yml 本次不改造
- 允许适度拆分 yml，但优先保证 artifact 共享

## Goals / Non-Goals

**Goals:**
- 彻底解决 artifact 跨 workflow run 下载失败问题
- 统一触发逻辑，单一入口管理所有 CI/CD 流程
- 明确不同触发条件的执行范围（PR / push main / push tag）
- 保持 job 级别的职责分离，维持代码可读性
- 减少重复的环境配置代码

**Non-Goals:**
- 不改造 manual-deploy.yml（后续单独处理）
- 不使用 workflow_call（无法解决 artifact 跨域问题）
- 不复用 push main 的 build 结果（接受 tag 时重新 build）
- 不引入 Composite Action（增加复杂度，收益有限）

## Decisions

### Decision 1: 单 Workflow 文件 vs 多 Workflow 文件

**选择**: 单 `ci-cd.yml` 文件，包含所有 job

**理由**:
- 同一 workflow run 内 artifact 天然共享，彻底解决跨域问题
- 项目规模适中（4-5 个 job），单文件完全可维护
- 触发逻辑集中，易于理解和调试
- 避免 workflow_call 带来的新 run_id 问题

**替代方案**:
- ❌ workflow_call: 会创建新 run_id，artifact 依然跨域
- ❌ 多文件 + 显式依赖: 复杂度高，需要额外机制传递 artifact

### Decision 2: Job 拆分粒度

**选择**: 4 个独立 job（code-quality、build、release、docker-publish）

**理由**:
- 每个 job 职责清晰，易于理解和维护
- 可以并行执行独立的任务（如 release 和 docker-publish 可并行）
- 失败时精确定位问题所在
- 符合 GitHub Actions 最佳实践

**Job 职责**:
```
code-quality: lint + type check（所有触发条件都执行）
build: 编译应用 + 上传 artifact（push main + push tag）
release: 下载 artifact + 压缩 + 创建 Release（仅 push tag）
docker-publish: 下载 artifact + 构建 Docker 镜像 + 推送（仅 push tag）
```

### Decision 3: PR 时不执行 Build

**选择**: PR 仅执行 code-quality，跳过 build

**理由**:
- 加快 PR 反馈速度（build 通常 2-5 分钟）
- 减少 GitHub Actions 资源消耗
- PR 阶段只需验证代码质量，完整 build 在 merge 后进行
- 符合常规 CI 实践

**实现方式**:
```yaml
build:
  if: github.event_name != 'pull_request'
```

### Decision 4: Artifact Retention 调整

**选择**: 从 1 天调整为 7 天

**理由**:
- 应对延迟打 tag 场景（如周末 merge，周一打 tag）
- 7 天足够覆盖正常开发周期
- GitHub Actions artifact 存储成本可忽略

**实现方式**:
```yaml
- uses: actions/upload-artifact@v4
  with:
    retention-days: 7
```

### Decision 5: 接受 Setup 代码重复

**选择**: 在 code-quality 和 build job 中重复 setup 步骤

**理由**:
- 同一文件内重复 4-5 行代码，影响可控
- Job 独立运行，不相互依赖，调试简单
- 引入 Composite Action 或 reusable workflow 增加复杂度，收益有限
- GitHub Actions 官方推荐这种做法

**重复内容**:
```yaml
- uses: actions/checkout@v4
- uses: pnpm/action-setup@v2
- uses: actions/setup-node@v4
- uses: actions/cache@v4
- run: pnpm install --frozen-lockfile
```

### Decision 6: 触发矩阵设计

**选择**: 通过 `if` 条件控制 job 执行

```yaml
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
    tags: ['v*']
  # 注意：不使用 paths-ignore，确保 tag 推送 100% 触发
  # 注意：暂时移除 workflow_dispatch，后续改造 manual-deploy 时再加
```

**执行矩阵**:
| 触发条件 | code-quality | build | release | docker-publish |
|---------|--------------|-------|---------|----------------|
| PR to main | ✅ | ❌ | ❌ | ❌ |
| Push to main | ✅ | ✅ | ❌ | ❌ |
| Push tag v* | ✅ | ✅ | ✅ | ✅ |

### Decision 7: Workflow 级别权限配置

**选择**: 在 workflow 级别声明最大必要权限（方案 A）

```yaml
permissions:
  contents: write    # release job 创建 Release 需要
  packages: write    # docker-publish job 推送镜像需要
```

**理由**:
- 简化配置，不需要在每个 job 重复声明
- 这是个人仓库，不是开源项目，安全风险极低
- GitHub Actions 推荐在 workflow 级别声明最小必要权限
- code-quality 和 build job 虽然只用到 read，但给予 write 权限影响可接受

### Decision 8: Secrets 传递策略

**选择**: code-quality job 不传递 GitHub API secrets，build job 传递

```yaml
code-quality:
  steps:
    - name: Type check
      run: pnpm --filter @repo/app exec tsc --noEmit
      # 不传递 GITHUB_APP_* secrets
      # Type check 不需要实际调用 API
      # 且 Fork PR 无法访问 secrets

build:
  if: github.event_name != 'pull_request'
  steps:
    - name: Build
      run: pnpm build
      env:
        GITHUB_APP_ID: ${{ secrets.APP_ID }}
        GITHUB_PRIVATE_KEY_BASE64: ${{ secrets.PRIVATE_KEY_BASE64 }}
        GITHUB_INSTALLATION_ID: ${{ secrets.INSTALLATION_ID }}
```

**理由**:
- Type check 使用 `as string` 强制类型断言，即使环境变量为空也不会报错
- Fork PR 无法访问 secrets，code-quality 必须能在无 secrets 环境下运行
- build job 只在 push main/tag 时执行，这些场景都有 secrets 访问权限

## Risks / Trade-offs

### Risk 1: Tag 时重新 Build 增加等待时间
- **影响**: 打 tag 时需要重新执行 build（2-5 分钟），无法复用 push main 的结果
- **缓解**: 打 tag 频率低，影响可接受；pnpm 缓存加速依赖安装
- **权衡**: 换取 artifact 共享的可靠性

### Risk 2: 单文件长度增加
- **影响**: ci-cd.yml 预计 150-180 行，比当前单个文件长
- **缓解**: 通过清晰的分隔注释和 job 命名维持可读性
- **权衡**: 换取逻辑集中，避免跨文件调试

### Risk 3: Job 间依赖导致串行执行
- **影响**: release 和 docker-publish 都依赖 build，必须等待 build 完成
- **缓解**: release 和 docker-publish 之间无依赖，可并行执行
- **权衡**: 符合逻辑依赖关系，无法优化

### Risk 4: Artifact 下载后目录结构
- **影响**: download-artifact 的行为可能导致路径不匹配
- **缓解**: 
  - 当前 upload 路径前缀不一致（apps/app/*, packages, Dockerfile），会保留完整 monorepo 结构
  - 在 release 和 docker-publish job 中添加调试输出（`find . -maxdepth 4 -type d`）
  - 验证关键路径存在后再继续
- **权衡**: 增加少量调试步骤，提高问题排查效率

### Trade-off: 代码重复 vs 复杂度
- **选择**: 接受少量 setup 代码重复
- **理由**: 引入复用机制（Composite Action / reusable workflow）的复杂度 > 重复代码的维护成本
- **未来优化**: 如果 job 数量增加到 10+，再考虑提取公共步骤

### Trade-off: Release 和 Docker Publish 并行执行
- **选择**: 并行执行（而非串行）
- **理由**: 
  - 两者独立，没有依赖关系
  - 加快整体执行速度
  - 失败时可以单独重试某个 job（GitHub Actions 支持 job 级别重试）
- **失败处理**: 
  - release 或 docker-publish 任一失败，workflow 标记为失败
  - 可以单独重试失败的 job，不需要重新执行 build（artifact 已存在）
  - 不需要重新触发整个 workflow（如打新 tag）

## Migration Plan

### 部署步骤
1. 创建 `.github/workflows/ci-cd.yml`（新 workflow）
2. **在同一 commit 中删除旧 workflow 文件**：
   - `build-test.yml`
   - `build-release.yml`
   - `docker-publish.yml`
3. 推送到 main 分支，验证 PR 和 push 场景
4. 打 tag 验证完整流程（code-quality → build → release → docker-publish）
5. 保留 `manual-deploy.yml`（后续改造）

**注意**：删除旧文件和创建新文件必须在同一 commit，避免中间状态导致 workflow 不触发。

### 回滚策略
- 如果新 workflow 有问题，revert 该 commit 即可恢复旧文件
- 旧文件内容已从 Git 历史可追溯
- 不影响已有的 GitHub Releases 和 Docker 镜像

### 验证清单
- [ ] PR to main 仅触发 code-quality
- [ ] Push to main 触发 code-quality + build
- [ ] Push tag v* 触发完整流程
- [ ] Artifact 在 job 间正确传递
- [ ] GitHub Release 创建成功
- [ ] Docker 镜像推送成功
- [ ] 手动部署不受影响

## Open Questions

无（所有设计决策已明确）

## 审查决策记录

本次设计经过严格审查，确认以下决策：

1. **Migration Plan**: 直接删除旧文件，准备回滚（同一 commit 完成）
2. **Job 依赖**: build 串行依赖 code-quality
3. **Secrets**: code-quality 不传，build 传递
4. **Artifact 路径**: 保持完整 monorepo 结构，添加调试输出
5. **Permissions**: Workflow 级别声明（方案 A）
6. **workflow_dispatch**: 暂时移除
7. **并行执行**: release 和 docker-publish 并行
8. **paths-ignore**: 移除，确保 tag 100% 触发
