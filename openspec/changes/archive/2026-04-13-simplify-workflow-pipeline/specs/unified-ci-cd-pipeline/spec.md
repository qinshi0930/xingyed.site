## ADDED Requirements

### Requirement: 统一 Workflow 触发条件
统一 CI/CD workflow SHALL 支持多种触发条件，并通过条件控制实现不同场景的执行策略。

#### Scenario: PR to main 触发
- **WHEN** 创建或更新指向 main 分支的 Pull Request
- **THEN** 触发 workflow 执行
- **THEN** 仅执行 code-quality job，跳过 build、release、docker-publish

#### Scenario: Push to main 触发
- **WHEN** 推送 commit 到 main 分支（非 tag）
- **THEN** 触发 workflow 执行
- **THEN** 执行 code-quality 和 build job
- **THEN** 跳过 release 和 docker-publish job

#### Scenario: Push tag 触发
- **WHEN** 推送格式为 `v*` 的 Git tag（如 `v1.0.0`）
- **THEN** 触发 workflow 执行
- **THEN** 执行 code-quality、build、release、docker-publish 全部 job

#### Scenario: 手动触发
- **WHEN** 通过 GitHub Actions UI 手动触发 workflow
- **THEN** 暂时保留 workflow_dispatch 触发器
- **THEN** deploy job 暂时不实现，留待后续改造

### Requirement: 代码质量检查 Job
code-quality job SHALL 在所有触发场景下执行，负责代码风格检查和类型检查。

#### Scenario: Lint 检查
- **WHEN** code-quality job 执行
- **THEN** 运行 `pnpm lint` 检查代码风格
- **THEN** 如果 lint 失败，job 终止并报告错误

#### Scenario: TypeScript 类型检查
- **WHEN** lint 检查通过
- **THEN** 运行 `pnpm --filter @repo/app exec tsc --noEmit`
- **THEN** 如果类型检查失败，job 终止并报告错误

#### Scenario: 依赖安装
- **WHEN** code-quality job 启动
- **THEN** 安装 pnpm、Node.js 22
- **THEN** 使用缓存加速依赖安装
- **THEN** 执行 `pnpm install --frozen-lockfile`

### Requirement: 构建 Job
build job SHALL 在 push to main 和 push tag 场景下执行，负责编译应用并上传 artifact。

#### Scenario: Next.js 构建
- **WHEN** build job 执行
- **THEN** 安装 pnpm、Node.js 22 和依赖
- **THEN** 运行 `pnpm build`
- **THEN** 生成 `.next/standalone` 产物

#### Scenario: 构建产物验证
- **WHEN** build 完成
- **THEN** 验证 `.next` 目录存在
- **THEN** 验证 `.next/BUILD_ID` 存在
- **THEN** 验证 `.next/standalone` 存在
- **THEN** 如果任一验证失败，job 终止

#### Scenario: 上传 Artifact
- **WHEN** 构建产物验证通过
- **THEN** 使用 `actions/upload-artifact@v4` 上传产物
- **THEN** artifact 名称为 `build-output`
- **THEN** 包含路径：`.next/standalone`、`.next/static`、`public`、`src/contents`、`packages`、`Dockerfile`、`podman-compose.yml`
- **THEN** retention-days 设置为 7

#### Scenario: PR 时跳过 Build
- **WHEN** 触发条件为 `pull_request`
- **THEN** build job 不执行（通过 `if` 条件跳过）

### Requirement: Release Job
release job SHALL 仅在 push tag 场景下执行，负责创建 GitHub Release。

#### Scenario: 下载 Artifact
- **WHEN** release job 执行
- **THEN** 使用 `actions/download-artifact@v4` 下载 `build-output`
- **THEN** 如果下载失败，job 终止并报告错误

#### Scenario: 产物压缩
- **WHEN** artifact 下载成功
- **THEN** 使用 tag 名称（如 `v1.0.0`）命名压缩文件
- **THEN** 执行 `zip -r xingyed-site-{version}.zip .`
- **THEN** 压缩文件位于项目根目录

#### Scenario: 创建 GitHub Release
- **WHEN** 产物压缩成功
- **THEN** 使用 `softprops/action-gh-release@v2` 创建 Release
- **THEN** Release 名称为 tag 名称
- **THEN** `generate_release_notes` 设置为 `true`
- **THEN** 上传压缩文件作为 Release 附件

#### Scenario: 非 Tag 时跳过
- **WHEN** `github.ref` 不以 `refs/tags/` 开头
- **THEN** release job 不执行（通过 `if` 条件跳过）

### Requirement: Docker Publish Job
docker-publish job SHALL 仅在 push tag 场景下执行，负责构建和推送 Docker 镜像。

#### Scenario: 下载 Artifact
- **WHEN** docker-publish job 执行
- **THEN** 使用 `actions/download-artifact@v4` 下载 `build-output`
- **THEN** 验证 `.next/standalone` 和 `Dockerfile` 存在

#### Scenario: 登录 GHCR
- **WHEN** artifact 验证通过
- **THEN** 使用 `docker/login-action@v3` 登录 `ghcr.io`
- **THEN** 使用 `GITHUB_TOKEN` 作为密码

#### Scenario: 设置 Docker Buildx
- **WHEN** 登录成功
- **THEN** 使用 `docker/setup-buildx-action@v3` 设置 Buildx
- **THEN** 支持 GHA 缓存后端

#### Scenario: 构建并推送镜像
- **WHEN** Buildx 设置完成
- **THEN** 使用 `docker/build-push-action@v5` 构建镜像
- **THEN** 推送 tag：`ghcr.io/{owner}/{repo}:{tag}` 和 `latest`
- **THEN** 使用 GHA 缓存加速构建

#### Scenario: 非 Tag 时跳过
- **WHEN** `github.ref` 不以 `refs/tags/` 开头
- **THEN** docker-publish job 不执行（通过 `if` 条件跳过）

### Requirement: Job 依赖关系
Workflow 中的 job SHALL 遵循明确的依赖关系，确保执行顺序正确。

#### Scenario: Build 依赖 Code-Quality
- **WHEN** build job 启动
- **THEN** 等待 code-quality job 完成
- **THEN** 如果 code-quality 失败，build 不执行

#### Scenario: Release 依赖 Build
- **WHEN** release job 启动
- **THEN** 等待 build job 完成
- **THEN** 如果 build 失败，release 不执行

#### Scenario: Docker-Publish 依赖 Build
- **WHEN** docker-publish job 启动
- **THEN** 等待 build job 完成
- **THEN** 如果 build 失败，docker-publish 不执行

#### Scenario: Release 和 Docker-Publish 并行
- **WHEN** build job 完成
- **THEN** release 和 docker-publish job 并行执行
- **THEN** 两者之间无依赖关系
