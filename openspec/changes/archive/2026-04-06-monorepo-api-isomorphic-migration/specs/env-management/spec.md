## ADDED Requirements

### Requirement: .env.production 配置文件
生产环境 SHALL 使用外部的 `.env.production` 文件管理环境变量,该文件不被提交到 Git。

#### Scenario: 文件创建
- **WHEN** 部署到生产环境
- **THEN** `.env.production` 文件包含所有必需的环境变量

#### Scenario: Git 忽略
- **WHEN** 检查 `.gitignore`
- **THEN** `.env.production` 在忽略列表中

### Requirement: Docker Compose 环境变量加载
Podman Compose SHALL 通过 `env_file` 指令加载 `.env.production` 文件。

#### Scenario: Compose 配置
- **WHEN** 启动 Docker 容器
- **THEN** `podman-compose.yml` 中的 `app` 服务引用 `env_file: - .env.production`

### Requirement: 必需环境变量清单
系统 SHALL 定义并文档化所有必需的环境变量。

#### Scenario: SMTP 配置
- **WHEN** Contact API 发送邮件
- **THEN** 使用 `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_TO`

#### Scenario: Redis 配置
- **WHEN** 应用连接 Redis
- **THEN** 使用 `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`(可选), `REDIS_DB`

#### Scenario: 第三方 API Keys
- **WHEN** 调用外部服务
- **THEN** 使用 `GITHUB_APP_*`, `SPOTIFY_*`, `WAKATIME_API_KEY`, `DEVTO_KEY`
