## ADDED Requirements

### Requirement: Dockerfile 多阶段构建
Dockerfile SHALL 包含两个阶段：builder（构建应用）和 runner（运行应用），使 CI/CD 可以独立构建无需本地产物。

#### Scenario: Builder 阶段构建应用
- **WHEN** Docker 构建执行
- **THEN** builder 阶段安装 pnpm、依赖并执行 `pnpm build`

#### Scenario: Runner 阶段复制产物
- **WHEN** builder 阶段完成
- **THEN** runner 阶段从 builder 复制 `.next/standalone`、`.next/static`、`public`、`contents`、`packages`

#### Scenario: 本地开发兼容性
- **WHEN** 本地执行 `pnpm docker:deploy`
- **THEN** Docker 使用 builder 阶段缓存加速构建

### Requirement: CI/CD Workflow 触发
Workflow SHALL 在推送 Git Tag（`v*`）时触发完整的 CI/CD 流水线。

#### Scenario: Tag 推送触发
- **WHEN** 推送 `v1.0.0` 等版本 tag
- **THEN** 触发 `ci-cd.yml` 工作流

#### Scenario: 非 Tag 推送不触发
- **WHEN** 推送到 main 分支或 PR
- **THEN** 不触发 `ci-cd.yml` 工作流

### Requirement: 构建和发布 Release
Workflow SHALL 构建 standalone 产物并发布为 GitHub Release。

#### Scenario: 构建产物验证
- **WHEN** `pnpm build` 完成
- **THEN** 验证 `.next/standalone`、`BUILD_ID`、`server.js` 存在

#### Scenario: 发布 Release
- **WHEN** 构建和验证通过
- **THEN** 使用 `softprops/action-gh-release@v2` 创建 Release 并上传 zip 包

### Requirement: Docker 镜像构建和推送
Workflow SHALL 构建 Docker 镜像并推送至 GitHub Container Registry (GHCR)。

#### Scenario: 登录 GHCR
- **WHEN** Workflow 执行 Docker 相关步骤
- **THEN** 使用 `docker/login-action@v3` 登录 `ghcr.io`

#### Scenario: 构建并推送镜像
- **WHEN** Release 发布成功
- **THEN** 构建镜像并推送：
  - `ghcr.io/qinshi0930/xingyed.site:v1.0.0`
  - `ghcr.io/qinshi0930/xingyed.site:latest`

#### Scenario: 镜像元数据
- **WHEN** 推送镜像
- **THEN** 添加 labels：`org.opencontainers.image.source`、`org.opencontainers.image.revision`

### Requirement: Webhook 触发部署
Workflow SHALL 在镜像推送成功后通过 HTTP POST 通知服务器部署。

#### Scenario: 触发 Webhook
- **WHEN** Docker 镜像推送成功
- **THEN** 发送 POST 请求至 `${{ secrets.DEPLOY_WEBHOOK_URL }}`

#### Scenario: Webhook 载荷
- **WHEN** 发送 Webhook 请求
- **THEN** 包含 JSON 数据：`{"tag": "v1.0.0", "image": "ghcr.io/..."}` 

#### Scenario: Webhook 失败处理
- **WHEN** Webhook 请求失败
- **THEN** 输出错误信息但不阻止 Workflow 完成（`continue-on-error: true`）

### Requirement: pnpm 依赖缓存
Workflow SHALL 缓存 pnpm 依赖以加速构建。

#### Scenario: 缓存命中
- **WHEN** `pnpm-lock.yaml` 未变更
- **THEN** 恢复缓存，跳过依赖下载

#### Scenario: 缓存未命中
- **WHEN** `pnpm-lock.yaml` 变更
- **THEN** 重新安装依赖并更新缓存
