## 1. Dockerfile 多阶段重构

- [x] 1.1 添加 builder 阶段（node:22-alpine、pnpm 安装、依赖复制、构建）
- [x] 1.2 修改 runner 阶段从 builder 复制产物（移除本地构建依赖）
- [x] 1.3 验证 Dockerfile 语法和阶段间依赖
- [x] 1.4 本地测试多阶段构建（`docker build -t test .`）

## 2. CI/CD Workflow 创建

- [x] 2.1 创建 `.github/workflows/ci-cd.yml` 文件
- [x] 2.2 配置触发条件（push tags: `v*`）
- [x] 2.3 添加权限配置（contents: write, packages: write）
- [x] 2.4 配置环境变量（PNPM_VERSION、NODE_VERSION、REGISTRY、IMAGE_NAME）

## 3. 构建和 Release 步骤

- [x] 3.1 添加 checkout、pnpm setup、Node.js setup 步骤
- [x] 3.2 添加 pnpm 缓存配置（复用 build-release.yml 配置）
- [x] 3.3 添加依赖安装和类型检查步骤
- [x] 3.4 添加构建和产物验证步骤
- [x] 3.5 添加 Release 发布步骤（softprops/action-gh-release@v2）

## 4. Docker 镜像构建和推送

- [x] 4.1 添加 GHCR 登录步骤（docker/login-action@v3）
- [x] 4.2 添加 Docker 元数据配置（tags: version + latest）
- [x] 4.3 添加构建和推送步骤（docker/build-push-action@v5）
- [x] 4.4 验证镜像构建成功和标签正确性

## 5. Webhook 触发部署

- [x] 5.1 添加 Webhook 触发步骤（curl POST 请求）
- [x] 5.2 配置 Webhook 载荷（tag、image 信息）
- [x] 5.3 添加错误处理（continue-on-error: true）
- [x] 5.4 验证 Webhook 请求格式正确

## 6. 测试和验证

- [x] 6.1 创建测试 tag（`v0.0.1-test`）
- [x] 6.2 观察 Workflow 执行和日志
- [x] 6.3 验证 Release 发布和产物上传
- [x] 6.4 验证 Docker 镜像推送至 GHCR
- [x] 6.5 验证 Webhook 触发和服务器响应
- [x] 6.6 清理测试 tag 和相关资源
