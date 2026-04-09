# build-release-workflow Specification

## Purpose
TBD - created by archiving change build-release-workflow. Update Purpose after archive.
## Requirements
### Requirement: Workflow 触发条件

Workflow MUST 仅在推送 Git Tag 时触发，Tag 名称格式必须为 `v*`（如 `v0.1.0`, `v1.0.0`）。

#### Scenario: 推送有效 Tag
- **WHEN** 用户推送格式为 `v*` 的 Git Tag（如 `git push origin v0.1.0`）
- **THEN** GitHub Actions 自动触发 `build-release.yml` workflow

#### Scenario: 推送普通 commit
- **WHEN** 用户推送普通 commit 到 main 分支
- **THEN** workflow 不被触发

#### Scenario: 创建 Pull Request
- **WHEN** 用户创建或更新 Pull Request
- **THEN** workflow 不被触发

### Requirement: 构建环境配置

Workflow MUST 使用指定的工具链版本进行构建：Node.js 22 和 pnpm 10。

#### Scenario: 环境初始化
- **WHEN** workflow 启动
- **THEN** 设置 `PNPM_VERSION='10'` 和 `NODE_VERSION='22'` 环境变量
- **THEN** 使用 `actions/setup-node@v4` 安装 Node.js 22
- **THEN** 使用 `pnpm/action-setup@v2` 安装 pnpm 10

#### Scenario: 依赖缓存
- **WHEN** 安装依赖前
- **THEN** 使用 `actions/cache@v4` 恢复 pnpm 依赖缓存
- **THEN** 缓存 key 基于 `pnpm-lock.yaml` 的 hash

### Requirement: 依赖安装

Workflow MUST 使用 `pnpm install --frozen-lockfile` 安装所有依赖，确保构建一致性。

#### Scenario: 成功安装依赖
- **WHEN** 执行 `pnpm install --frozen-lockfile`
- **THEN** 所有 workspace 包依赖被安装
- **THEN** `node_modules` 目录被创建

#### Scenario: lockfile 不一致
- **WHEN** `pnpm-lock.yaml` 与 `package.json` 不一致
- **THEN** 命令失败并终止 workflow

### Requirement: 类型检查

Workflow MUST 执行 TypeScript 类型检查，确保代码无类型错误。此步骤不使用 GitHub API secrets。

#### Scenario: 类型检查通过
- **WHEN** 执行 `pnpm --filter @repo/app exec tsc --noEmit`
- **THEN** 无类型错误
- **THEN** workflow 继续执行下一步

#### Scenario: 类型检查失败
- **WHEN** 存在 TypeScript 类型错误
- **THEN** 命令返回非零退出码
- **THEN** workflow 终止，不创建 Release

### Requirement: Next.js 构建

Workflow MUST 执行 Next.js 构建，生成 standalone 产物。此步骤不使用 GitHub API secrets。

#### Scenario: 构建成功
- **WHEN** 执行 `pnpm build`
- **THEN** 生成 `.next` 目录
- **THEN** 生成 `.next/standalone` 目录
- **THEN** 生成 `.next/BUILD_ID` 文件
- **THEN** 生成 `.next/standalone/apps/app/server.js` 文件

#### Scenario: 构建失败
- **WHEN** 构建过程出错
- **THEN** 命令返回非零退出码
- **THEN** workflow 终止，不创建 Release

### Requirement: 构建产物验证

Workflow MUST 验证构建产物的完整性，确保所有必需文件存在。

#### Scenario: 所有产物存在
- **WHEN** 执行产物验证脚本
- **THEN** 检查 `.next` 目录存在
- **THEN** 检查 `.next/BUILD_ID` 文件存在
- **THEN** 检查 `.next/standalone` 目录存在
- **THEN** 检查 `.next/standalone/apps/app/server.js` 文件存在
- **THEN** 验证通过，继续下一步

#### Scenario: 产物缺失
- **WHEN** 任一必需文件或目录缺失
- **THEN** 验证脚本输出错误信息
- **THEN** 脚本以非零退出码退出
- **THEN** workflow 终止，不创建 Release

### Requirement: 产物压缩

Workflow MUST 将 standalone 产物压缩为 zip 文件，文件命名格式为 `xingyed-site-{version}.zip`。

#### Scenario: 成功压缩产物
- **WHEN** 构建产物验证通过
- **THEN** 进入 `apps/app/.next/standalone` 目录
- **THEN** 执行 `zip -r` 压缩当前目录所有内容为 `xingyed-site-{version}.zip`
- **THEN** zip 文件位于项目根目录

#### Scenario: 产物命名
- **WHEN** Tag 为 `v0.1.0`
- **THEN** 压缩文件名为 `xingyed-site-v0.1.0.zip`

### Requirement: GitHub Release 创建

Workflow MUST 创建 GitHub Release，标题为 Tag 名称，包含自动生成的 Release Notes 和上传的构建产物。

#### Scenario: 成功创建 Release
- **WHEN** 所有构建步骤成功完成
- **THEN** 使用 `softprops/action-gh-release@v2` 创建 Release
- **THEN** Release 标题为 Tag 名称（如 `v0.1.0`）
- **THEN** `generate_release_notes` 设置为 `true`
- **THEN** 上传 `xingyed-site-{version}.zip` 文件
- **THEN** Release 发布到 GitHub

#### Scenario: Release 已存在
- **WHEN** 相同 Tag 的 Release 已存在
- **THEN** Action 更新现有 Release
- **THEN** 上传新的构建产物

### Requirement: 权限配置

Workflow MUST 仅请求最小必要权限：`contents: write`。

#### Scenario: 权限声明
- **WHEN** workflow 启动
- **THEN** 设置 `permissions.contents: write`
- **THEN** 不使用其他权限

### Requirement: 失败处理策略

任何构建步骤失败时，Workflow MUST 终止执行且不创建 Release。

#### Scenario: 类型检查失败
- **WHEN** Type Check 步骤失败
- **THEN** workflow 立即终止
- **THEN** 不执行后续构建和 Release 步骤

#### Scenario: 构建失败
- **WHEN** Build 步骤失败
- **THEN** workflow 立即终止
- **THEN** 不执行产物压缩和 Release 创建

#### Scenario: 产物验证失败
- **WHEN** Verify build output 步骤失败
- **THEN** workflow 立即终止
- **THEN** 不创建 Release

