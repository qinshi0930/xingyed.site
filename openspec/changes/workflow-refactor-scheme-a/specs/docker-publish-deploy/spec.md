## ADDED Requirements

### Requirement: docker-publish.yml SHALL build and push Docker image to GHCR

`docker-publish.yml` MUST 构建 Docker 镜像并推送至 GitHub Container Registry。

#### Scenario: Docker image built with multi-stage
- **WHEN** workflow 执行 Docker 构建
- **THEN** 使用多阶段 Dockerfile（builder + runner）

#### Scenario: Image pushed to GHCR
- **WHEN** 构建成功
- **THEN** 镜像推送至 `ghcr.io/qinshi0930/xingyed.site`

#### Scenario: Image tagged with version and latest
- **WHEN** 推送 tag `v1.0.0`
- **THEN** 镜像打标签 `v1.0.0` 和 `latest`

#### Scenario: Build cache utilized
- **WHEN** 执行 Docker 构建
- **THEN** 使用 GitHub Actions 缓存（`cache-from: type=gha`）
