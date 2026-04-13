## 1. 修正 Dockerfile 路径

- [x] 1.1 修改 `COPY .next/standalone/` 为 `COPY apps/app/.next/standalone/`
- [x] 1.2 修改 `COPY .next/static` 为 `COPY apps/app/.next/static/`
- [x] 1.3 修改 `COPY public/` 为 `COPY apps/app/public/`
- [x] 1.4 修改 `COPY src/contents` 为 `COPY apps/app/src/contents/`
- [x] 1.5 验证 `COPY packages/` 路径正确（无需修改）
- [x] 1.6 更新 Dockerfile 注释说明目录结构
- [x] 1.7 本地验证 Dockerfile 路径正确性

## 2. 改造 build-test.yml 增加代码质量检查

- [x] 2.1 创建独立的 `code-quality` job
- [x] 2.2 添加 checkout 步骤
- [x] 2.3 添加 pnpm 和 Node.js  setup 步骤
- [x] 2.4 添加依赖安装步骤
- [x] 2.5 添加 Lint 步骤（`pnpm lint`）
- [x] 2.6 添加 Type Check 步骤（`tsc --noEmit`）
- [x] 2.7 配置必要的环境变量（GITHUB_APP_ID 等）
- [x] 2.8 验证 code-quality job 可以独立运行

## 3. 调整 build-test.yml 的 artifact 上传

- [x] 3.1 在 artifact path 中增加 `Dockerfile`
- [x] 3.2 在 artifact path 中增加 `podman-compose.yml`
- [x] 3.3 确认 artifact 路径保持 `apps/app/` 前缀
- [x] 3.4 确认 `retention-days: 1` 设置
- [x] 3.5 验证 artifact 包含所有必要文件

## 4. 修改 build-release.yml 移除 workflow_call

- [x] 4.1 移除 `build` job（不再调用 build-test.yml）
- [x] 4.2 移除 `needs: build` 依赖
- [x] 4.3 修改 `release` job 直接下载 artifact
- [x] 4.4 添加 artifact 下载步骤（continue-on-error: true）
- [x] 4.5 添加 artifact 可用性检查步骤
- [x] 4.6 添加 artifact 结构验证步骤
- [x] 4.7 保留压缩 artifact 逻辑（调整路径匹配新结构）
- [x] 4.8 保留创建 GitHub Release 步骤
- [x] 4.9 验证 YAML 语法正确

## 5. 修改 docker-publish.yml 移除 workflow_call 和 checkout

- [x] 5.1 移除 `build` job（不再调用 build-test.yml）
- [x] 5.2 移除 `needs: build` 依赖
- [x] 5.3 移除 checkout code 步骤
- [x] 5.4 修改 `docker-publish` job 直接下载 artifact
- [x] 5.5 添加 artifact 下载步骤（continue-on-error: true）
- [x] 5.6 添加 artifact 可用性检查步骤
- [x] 5.7 添加 artifact 结构验证步骤
- [x] 5.8 保留 Docker login 步骤
- [x] 5.9 保留 Docker buildx setup 步骤
- [x] 5.10 保留 Docker metadata 提取步骤
- [x] 5.11 保留 Docker build and push 步骤（context 改为 artifact root）
- [x] 5.12 验证 YAML 语法正确

## 6. 本地验证

- [x] 6.1 验证 Dockerfile 路径修正后可以在本地构建
- [x] 6.2 验证所有 workflow 文件 YAML 语法正确
- [x] 6.3 验证 artifact 路径结构符合预期

## 7. 端到端验证

- [ ] 7.1 提交所有更改到 git
- [ ] 7.2 推送到 main 分支
- [ ] 7.3 验证 build-test workflow 执行成功
  - [ ] 7.3.1 code-quality job 执行 lint 和 type check
  - [ ] 7.3.2 build job 执行构建并上传 artifact
  - [ ] 7.3.3 artifact 包含 Dockerfile 和 podman-compose.yml
- [ ] 7.4 创建测试 tag（如 `v0.0.4-test`）并推送
- [ ] 7.5 验证 build-release workflow 执行成功
  - [ ] 7.5.1 下载 artifact 成功（不再调用 build-test）
  - [ ] 7.5.2 artifact 结构验证通过
  - [ ] 7.5.3 压缩 artifact 成功
  - [ ] 7.5.4 GitHub Release 创建成功
- [ ] 7.6 验证 docker-publish workflow 执行成功
  - [ ] 7.6.1 下载 artifact 成功（不再调用 build-test）
  - [ ] 7.6.2 没有 checkout code 步骤
  - [ ] 7.6.3 Docker 镜像构建成功
  - [ ] 7.6.4 镜像推送到 GHCR（`v0.0.4-test` 和 `latest` 标签）
- [ ] 7.7 验证 build-release 和 docker-publish 并行执行

## 8. Artifact 可用性检查验证

- [ ] 8.1 创建测试场景：main 分支未构建直接打 tag
- [ ] 8.2 验证 build-release 失败并显示清晰错误提示
- [ ] 8.3 验证 docker-publish 失败并显示清晰错误提示
- [ ] 8.4 验证错误提示包含解决步骤

## 9. 清理和文档

- [ ] 9.1 删除测试 tag 和 Release
- [ ] 9.2 更新 openspec tasks.md 标记完成状态
- [ ] 9.3 记录新的发布流程说明
