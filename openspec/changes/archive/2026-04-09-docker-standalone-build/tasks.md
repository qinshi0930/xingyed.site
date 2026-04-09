## 1. Dockerfile 重构

- [x] 1.1 将 Dockerfile 从多阶段构建简化为单阶段 runner
- [x] 1.2 配置非 root 用户（nextjs:nodejs）
- [x] 1.3 移除所有 pnpm 安装和依赖复制步骤
- [x] 1.4 添加 standalone 产物复制指令
- [x] 1.5 添加静态资源和内容目录复制指令
- [x] 1.6 验证 Dockerfile 语法和完整性

## 2. .dockerignore 调整

- [x] 2.1 在 `.next` 规则后添加 `!.next/standalone` 例外
- [x] 2.2 在 `.next` 规则后添加 `!.next/static` 例外
- [x] 2.3 验证例外规则语法正确性（目录例外带斜杠）

## 3. package.json 脚本增强

- [x] 3.1 添加 `docker:build` 脚本（构建 + 验证 + Docker 镜像构建）
- [x] 3.2 添加 `docker:up` 脚本（启动容器）
- [x] 3.3 添加 `docker:deploy` 脚本（完整部署流程）
- [x] 3.4 验证脚本命令语法和错误处理

## 4. 本地构建测试

- [x] 4.1 执行 `pnpm build` 验证 standalone 产物生成
- [x] 4.2 检查 `.next/standalone` 目录结构和内容
- [x] 4.3 执行 `pnpm docker:build` 验证 Docker 镜像构建
- [x] 4.4 执行 `pnpm docker:deploy` 验证完整部署流程
- [x] 4.5 验证容器启动后应用正常运行（访问 localhost:3000）

## 5. 验证和清理

- [x] 5.1 检查镜像体积（对比优化前）
- [x] 5.2 检查镜像中不包含 `.env.production`
- [x] 5.3 检查镜像中 standalone 包含完整的 node_modules
- [x] 5.4 验证环境变量从 podman-compose.yml 正确注入
- [x] 5.5 清理旧的构建产物和镜像
