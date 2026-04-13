## 1. 创建新 Workflow 文件

- [ ] 1.1 创建 `.github/workflows/ci-cd.yml` 文件
- [ ] 1.2 配置触发条件（pull_request、push branches/tags、workflow_dispatch）
- [ ] 1.3 定义环境变量（PNPM_VERSION、NODE_VERSION）

## 2. 实现 Code-Quality Job

- [ ] 2.1 创建 code-quality job 基础结构
- [ ] 2.2 添加 checkout、setup pnpm/node、cache、install 步骤
- [ ] 2.3 添加 lint 检查步骤
- [ ] 2.4 添加 TypeScript 类型检查步骤（包含 GitHub API secrets）

## 3. 实现 Build Job

- [ ] 3.1 创建 build job 并设置依赖 code-quality
- [ ] 3.2 添加条件控制 `if: github.event_name != 'pull_request'`
- [ ] 3.3 添加 checkout、setup pnpm/node、cache、install 步骤
- [ ] 3.4 添加 Next.js 构建步骤（包含 GitHub API secrets）
- [ ] 3.5 添加构建产物验证步骤
- [ ] 3.6 添加 upload-artifact 步骤（retention-days: 7）

## 4. 实现 Release Job

- [ ] 4.1 创建 release job 并设置依赖 build
- [ ] 4.2 添加条件控制 `if: startsWith(github.ref, 'refs/tags/')`
- [ ] 4.3 添加 download-artifact 步骤
- [ ] 4.4 添加产物结构验证步骤
- [ ] 4.5 添加产物压缩步骤（zip 文件命名：xingyed-site-{version}.zip）
- [ ] 4.6 添加创建 GitHub Release 步骤（generate_release_notes: true）

## 5. 实现 Docker-Publish Job

- [ ] 5.1 创建 docker-publish job 并设置依赖 build
- [ ] 5.2 添加条件控制 `if: startsWith(github.ref, 'refs/tags/')`
- [ ] 5.3 添加 download-artifact 步骤
- [ ] 5.4 添加产物验证步骤（.next/standalone、Dockerfile）
- [ ] 5.5 添加 Docker 登录 GHCR 步骤
- [ ] 5.6 添加 Docker Buildx 设置步骤
- [ ] 5.7 添加 Docker 元数据提取步骤
- [ ] 5.8 添加构建并推送 Docker 镜像步骤（含 GHA 缓存）

## 6. 清理旧 Workflow 文件

- [ ] 6.1 删除 `.github/workflows/build-test.yml`
- [ ] 6.2 删除 `.github/workflows/build-release.yml`
- [ ] 6.3 删除 `.github/workflows/docker-publish.yml`
- [ ] 6.4 验证 `manual-deploy.yml` 未受影响

## 7. 验证与测试

- [ ] 7.1 创建 PR 验证仅触发 code-quality
- [ ] 7.2 推送到 main 验证触发 code-quality + build
- [ ] 7.3 打 test tag 验证完整流程（code-quality → build → release → docker-publish）
- [ ] 7.4 验证 artifact 在 job 间正确传递
- [ ] 7.5 验证 GitHub Release 创建成功
- [ ] 7.6 验证 Docker 镜像推送成功

## 8. 文档更新

- [ ] 8.1 更新 README.md 中的 CI/CD 说明（如有）
- [ ] 8.2 归档此 OpenSpec 变更
