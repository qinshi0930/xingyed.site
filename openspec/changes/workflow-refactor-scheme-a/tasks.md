## 1. 改造 build-test.yml 支持 workflow_call

- [ ] 1.1 在 `build-test.yml` 的 `on` 部分添加 `workflow_call` 触发器
- [ ] 1.2 验证 `build-test.yml` 仍支持 PR 和 push main 触发（行为不变）
- [ ] 1.3 添加 workflow outputs 定义（暴露构建状态）

## 2. 简化 build-release.yml 调用 build-test.yml

- [ ] 2.1 添加 `build` job 调用 `./.github/workflows/build-test.yml`
- [ ] 2.2 配置 `secrets: inherit` 传递所有 secrets
- [ ] 2.3 修改 `release` job 添加 `needs: build` 依赖
- [ ] 2.4 移除重复的构建步骤（type check, build, verify）
- [ ] 2.5 保留压缩 artifact 和创建 Release 步骤
- [ ] 2.6 验证 YAML 语法正确

## 3. 创建 docker-publish.yml

- [ ] 3.1 创建 `.github/workflows/docker-publish.yml` 文件
- [ ] 3.2 配置触发条件 `push tags: v*`
- [ ] 3.3 添加 `docker-publish` job：登录 GHCR
- [ ] 3.4 添加 Docker metadata 提取步骤
- [ ] 3.5 添加 Docker 构建和推送步骤（使用多阶段构建）
- [ ] 3.6 配置 GHA 缓存（`cache-from: type=gha`）
- [ ] 3.7 验证 YAML 语法正确

## 4. 创建 manual-deploy.yml

- [ ] 4.1 创建 `.github/workflows/manual-deploy.yml` 文件
- [ ] 4.2 配置触发条件 `workflow_dispatch` with `image_tag` input
- [ ] 4.3 添加 image_tag 格式验证步骤（正则 `^v[0-9]+\.[0-9]+\.[0-9]+`）
- [ ] 4.4 添加 checkout 步骤
- [ ] 4.5 添加 deploy job，执行 `npx tsx scripts/deploy-webhook.ts`
- [ ] 4.6 配置 Webhook 环境变量（WEBHOOK_URL, WEBHOOK_SECRET, WEBHOOK_TAG, WEBHOOK_IMAGE, WEBHOOK_REPOSITORY, WEBHOOK_TRIGGERED_BY）
- [ ] 4.7 验证 YAML 语法正确

## 5. 修改 webhook/hooks.json

- [ ] 5.1 修改 `webhook/hooks.json` 的 trigger-rule，移除 ref 验证
- [ ] 5.2 只保留 HMAC 签名验证（payload-hash-sha256）
- [ ] 5.3 验证 JSON 语法正确
- [ ] 5.4 将新配置复制到服务器（`scp webhook/hooks.json server:/opt/webhook/`）
- [ ] 5.5 在服务器上重载 webhook 服务（`systemctl reload webhook`）
- [ ] 5.6 验证配置生效（`curl -s http://localhost:9000/hooks/deploy-xingyed-site`）

## 6. 清理废弃文件

- [ ] 6.1 删除 `.github/workflows/ci-cd.yml`
- [ ] 6.2 删除 `.github/workflows/deploy-advanced.yml.disabled`
- [ ] 6.3 删除 `.github/workflows/deploy.yml.disabled`
- [ ] 6.4 提交删除操作

## 7. 端到端验证

- [ ] 7.1 提交所有更改到 git
- [ ] 7.2 创建测试 tag（如 `v0.0.1-test`）并推送
- [ ] 7.3 验证 `build-release.yml` 和 `docker-publish.yml` 并行执行
- [ ] 7.4 验证 `build-release.yml` 调用 `build-test.yml` 成功
- [ ] 7.5 验证 Docker 镜像推送至 GHCR（`v0.0.1-test` 和 `latest` 标签）
- [ ] 7.6 验证 GitHub Release 创建成功（包含 artifact）
- [ ] 7.7 手动触发 `manual-deploy.yml`，输入测试 tag
- [ ] 7.8 验证 Webhook 触发成功（检查服务器日志）
- [ ] 7.9 验证应用部署成功（访问网站）

## 8. 文档更新

- [ ] 8.1 更新 README.md 中的 CI/CD 说明（如存在）
- [ ] 8.2 更新 `.github/README.md` 中的 workflow 说明（如存在）
- [ ] 8.3 记录 workflow 架构图和职责说明
