## 1. 备份与准备

- [x] 1.1 备份 pnpm-lock.yaml 为 pnpm-lock.yaml.bak
- [x] 1.2 备份 pnpm-workspace.yaml 为 pnpm-workspace.yaml.bak
- [x] 1.3 确认实验分支 experiment/bun-verify 已提交验证结果

## 2. 根 package.json 更新

- [x] 2.1 添加 `"workspaces": ["apps/app", "packages/*"]` 字段
- [x] 2.2 更新 scripts 将所有 `pnpm` 替换为 `bun`
- [x] 2.3 更新 scripts 将 `pnpm dlx` 替换为 `bunx`
- [x] 2.4 更新 `"packageManager": "bun@1.3.11"`
- [x] 2.5 移除 devDependencies 中的 `tsx`（Bun 原生支持 TypeScript）
- [x] 2.6 迁移 `pnpm.overrides` 到 `"overrides"` 字段（如果有）

## 3. apps/app package.json 更新

- [x] 3.1 更新 scripts 将 `next dev --turbopack` 改为 `bun --bun next dev`
- [x] 3.2 更新 scripts 将 `next build --turbopack` 改为 `bun --bun next build`
- [x] 3.3 更新 scripts 将 `next start` 改为 `bun --bun next start`
- [x] 3.4 更新 scripts 将 `pnpm dlx` 替换为 `bunx`
- [x] 3.5 更新 scripts 将 `ts-node` 替换为 `bun run`
- [x] 3.6 更新 `"packageManager": "bun@1.3.11"`

## 4. 配置文件清理

- [x] 4.1 删除 pnpm-workspace.yaml 文件
- [x] 4.2 更新 .gitignore（移除 pnpm 相关规则，如果有的话）
- [x] 4.3 更新 .dockerignore（如需要）

## 5. 依赖安装验证

- [x] 5.1 执行 `bun install` 安装所有依赖
- [x] 5.2 验证 bun.lock 文件生成
- [x] 5.3 验证 workspace 依赖解析（@repo/types, @repo/utils）
- [x] 5.4 验证 node_modules/.bun 目录结构（实际目录，非符号链接）

## 6. 构建验证

- [x] 6.1 执行 `bun run build` 构建 Next.js 应用
- [x] 6.2 验证 .next/standalone 目录生成
- [x] 6.3 验证 .next/standalone/node_modules/.bun 存在
- [x] 6.4 检查 standalone 产物中无断裂的符号链接
- [ ] 6.5 执行 `bun run start` 验证生产服务器启动

## 7. Docker 配置更新

- [x] 7.1 更新 Dockerfile 移除 pnpm 相关步骤
- [x] 7.2 移除 `COPY pnpm-lock.yaml ./`
- [x] 7.3 移除 `RUN pnpm install --prod --frozen-lockfile`
- [x] 7.4 移除 `corepack enable` 和 pnpm 安装
- [x] 7.5 简化为单阶段构建（直接复制 standalone 产物）
- [x] 7.6 验证 Dockerfile 语法正确

## 8. Docker 构建验证

- [x] 8.1 执行 `podman build -t xingyed-site:bun .` 构建镜像
- [x] 8.2 运行容器 `podman run -d --name test -p 3001:3000 xingyed-site:bun`
- [x] 8.3 等待 5 秒，检查容器日志 `podman logs test`
- [x] 8.4 验证健康检查 `curl http://localhost:3001/api/health`
- [x] 8.5 验证主页渲染 `curl http://localhost:3001/`
- [x] 8.6 清理测试容器 `podman stop test && podman rm test`

## 9. CI/CD Workflow 更新 - ci-cd.yml

- [x] 9.1 替换 `pnpm/action-setup@v4` 为 `oven-sh/setup-bun@v2`
- [x] 9.2 更新 Bun 版本锁定为 `1.3.11`
- [x] 9.3 替换 `pnpm install` 为 `bun install --frozen-lockfile`
- [x] 9.4 替换 `pnpm run build` 为 `bun run build`
- [x] 9.5 更新依赖缓存配置（基于 bun.lock）
- [x] 9.6 移除符号链接解析步骤（Bun 不需要）

## 9.5. CI/CD 符号链接保留修复（紧急）

**问题**：Bun 构建产物使用符号链接（`standalone/.bun/` 存储实际文件），upload-artifact 的 zip 打包会导致符号链接丢失

**解决方案**：使用 tar.gz 替代 zip，保留符号链接

- [x] 9.5.1 Build Job：使用 `tar -czf` 打包产物（默认保留符号链接）
- [x] 9.5.2 Build Job：上传 tar.gz 到 artifact（compression-level: 0）
- [x] 9.5.3 Release Job：下载并解压 tar.gz，重新打包发布
- [x] 9.5.4 Docker Job：下载并解压 tar.gz，构建 Docker 镜像
- [x] 9.5.5 移除 zip 压缩逻辑，改用 tar.gz
- [x] 9.5.6 更新 Release 文件名为 `xingyed-site-{version}.tar.gz`

## 9.6. CI/CD tar 打包目录结构优化

**问题**：tar 打包时将所有文件放在临时目录根级别，丢失 monorepo 路径结构

**解决方案**：复制文件时保持完整的 monorepo 目录结构

- [x] 9.6.1 Build Job：复制文件时保持 `apps/app/.next/standalone` 等完整路径
- [x] 9.6.2 Release Job：验证路径更新为 `apps/app/.next/standalone`
- [x] 9.6.3 Docker Job：验证路径更新为 `apps/app/.next/standalone`
- [x] 9.6.4 增加目录结构输出，便于调试

## 9.7. Release 包验证与 Docker 缓存优化

**验证结果**：
- ✅ Release 包下载成功（56 MB tar.gz）
- ✅ 解压后目录结构完整（保持 monorepo 路径）
- ✅ 符号链接保留成功（`.bun` 目录完整）
- ✅ Docker 镜像构建成功（283 MB）
- ✅ 容器启动正常，无 MODULE_NOT_FOUND 错误
- ✅ 健康检查通过（`/api/health` 返回 ok）
- ✅ 主页、博客、关于页面均正常访问（HTTP 200）

**Docker 缓存优化**：
- [x] 9.7.1 Dockerfile：创建 `.next/cache` 目录并设置权限
- [x] 9.7.2 避免运行时 EACCES 错误（非 root 用户写入缓存）
- [x] 9.7.3 更新 Dockerfile 注释说明缓存优化

## 9.8. 构建产物优化 - 移除冗余 packages 复制

**发现**：standalone 目录已包含必要的 packages（通过 Next.js `transpilePackages` 配置）

**优化**：
- [x] 9.8.1 ci-cd.yml Build Job：移除 `cp -a packages` 步骤
- [x] 9.8.2 ci-cd.yml Release Job：移除 packages 目录验证
- [x] 9.8.3 Dockerfile：移除 `COPY packages/ ./packages/` 指令
- [x] 9.8.4 更新文档说明 standalone 已包含 packages
- [x] 9.8.5 验证 standalone/packages 存在但非必需

## 10. CI/CD Workflow 更新 - build-release.yml

- [x] 10.1 已在 ci-cd.yml 中统一更新
- [x] 10.2 已在 ci-cd.yml 中统一更新
- [x] 10.3 已在 ci-cd.yml 中统一更新
- [x] 10.4 Release 产物打包已更新（移除符号链接解析）
- [x] 10.5 验证 Release 产物完整性（待 GitHub Actions 验证）

## 11. CI/CD Workflow 更新 - docker-publish.yml

- [x] 11.1 已在 ci-cd.yml 中统一更新
- [x] 11.2 Docker 构建流程已验证（使用新的 Dockerfile）
- [ ] 11.3 测试完整 CI/CD 流程（推送测试 tag）

## 12. 文档更新

- [x] 12.1 更新 README.md 添加 Bun 安装说明
- [x] 12.2 更新开发文档（README.md 已包含）
- [x] 12.3 更新部署文档（Dockerfile 注释已更新）
- [ ] 12.4 更新 CONTRIBUTING.md（如果有的话）

## 13. 本地开发测试

- [ ] 13.1 执行 `bun run dev` 启动开发服务器
- [ ] 13.2 访问 http://localhost:3000 验证页面渲染
- [ ] 13.3 测试热更新（修改文件保存）
- [ ] 13.4 执行 `bun run lint` 验证代码检查
- [ ] 13.5 执行 TypeScript 脚本验证（如 deploy-webhook.ts）

## 14. 提交与合并

- [ ] 14.1 提交所有更改到 experiment/bun-verify 分支
- [ ] 14.2 推送分支到远程仓库
- [ ] 14.3 创建 Pull Request
- [ ] 14.4 等待 CI/CD 验证通过
- [ ] 14.5 代码审查通过后合并到 main

## 15. 生产部署与监控

- [ ] 15.1 创建新版本 tag（如 v2.0.0-bun）
- [ ] 15.2 推送 tag 触发 CI/CD
- [ ] 15.3 监控 Docker 镜像构建日志
- [ ] 15.4 监控 Webhook 部署日志
- [ ] 15.5 验证生产环境运行正常
- [ ] 15.6 监控错误日志（至少 24 小时）
- [ ] 15.7 性能对比（构建时间、镜像体积、启动时间）
