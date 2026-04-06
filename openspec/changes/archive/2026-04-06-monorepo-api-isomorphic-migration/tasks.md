## 1. 准备工作

- [x] 1.1 备份当前 `apps/web` 和 `apps/api` 目录
- [x] 1.2 安装 Sonner 依赖: `pnpm add sonner`
- [x] 1.3 重命名目录: `mv apps/web apps/app`

## 2. 应用配置更新

- [x] 2.1 更新 `apps/app/package.json`: name 改为 `@repo/app`,移除 Chat 相关依赖
- [x] 2.2 更新根目录 `package.json`: 脚本改为 `pnpm --filter @repo/app dev/build/start`
- [x] 2.3 更新 `pnpm-workspace.yaml`: 将 `apps/*` 改为 `apps/app`
- [x] 2.4 更新 `.gitignore`: 添加 `.env.production`

## 3. Hono API 统一入口创建

- [x] 3.1 创建目录: `mkdir -p apps/app/src/app/api/[[...route]]`
- [x] 3.2 创建 `apps/app/src/app/api/[[...route]]/route.ts`: 导入 Hono,配置 basePath,导出 HTTP 方法
- [x] 3.3 从 `apps/api/src/routes/blog.ts` 迁移代码到 `apps/app/src/modules/blog/api.ts`
- [x] 3.4 创建 `apps/app/src/modules/contact/api.ts`: 实现邮件发送 API
- [x] 3.5 在统一入口中挂载子路由: `app.route('/blog', blogRoute)`, `app.route('/contact', contactRoute)`

## 4. 前端服务层更新

- [x] 4.1 更新 `apps/app/src/services/fetcher.ts`: 移除 `API_URL`,使用相对路径
- [x] 4.2 更新 `apps/app/src/services/contact.ts`: 确保被 Hono API 调用而非前端直接调用
- [x] 4.3 更新 `apps/app/src/modules/contact/components/ContactForm.tsx`: 
  - 移除 `NEXT_PUBLIC_API_URL`
  - API 调用改为 `/api/contact`
  - 请求体改为直接发送 `formData`
  - 添加 Toast 通知 (success/error)
- [x] 4.4 全局搜索并替换所有 `http://localhost:3001` 为相对路径

## 5. Toast 通知系统集成

- [x] 5.1 在 `apps/app/src/app/layout.tsx` 中添加 `<Toaster position="bottom-right" richColors closeButton />`
- [x] 5.2 在 ContactForm 中导入 `toast` from 'sonner'
- [x] 5.3 测试 Toast 显示: 提交联系表单验证成功/失败消息

## 6. 环境变量配置

- [x] 6.1 创建 `.env.production.example` 模板文件,包含所有必需变量
- [x] 6.2 创建 `.env.production`(不提交),填入实际配置
- [x] 6.3 删除代码中的 `NEXT_PUBLIC_API_URL` 引用
- [x] 6.4 验证 SMTP、Redis 等配置正确

## 7. Docker 配置简化

- [x] 7.1 更新 `Dockerfile`: 
  - 移除 `apps/api` 相关 COPY 指令
  - 只复制 `apps/app` 的构建产物
  - 改为单端口 `EXPOSE 3000`
  - CMD 改为 `node apps/app/server.js`
- [x] 7.2 更新 `podman-compose.yml`:
  - 移除端口 3001 映射
  - 添加 `env_file: - .env.production`
  - 简化 environment 配置

## 8. 清理和删除

- [x] 8.1 删除 `apps/api` 目录
- [x] 8.2 删除 `apps/app/src/services/chatgpt.ts` (Chat 模块已移除)
- [x] 8.3 删除 `apps/app/src/modules/chat` 目录
- [x] 8.4 清理未使用的导入和依赖

## 9. 测试验证

- [x] 9.1 开发环境测试: `pnpm dev` 启动成功,无错误
- [x] 9.2 访问首页: 页面正常渲染
- [x] 9.3 测试 Blog API: 访问 `/api/blog` 返回正确的 JSON
- [x] 9.4 测试 Contact API: 提交联系表单,验证邮件发送和 Toast 通知
- [x] 9.5 构建测试: `pnpm build` 成功,无 TypeScript 错误
- [x] 9.6 生产环境测试: `pnpm start` 启动成功

## 10. Docker 构建和部署测试

- [x] 10.1 构建 Docker 镜像: `podman build -t xingyed-site .`
- [x] 10.2 运行容器: `podman-compose up -d`
- [x] 10.3 验证容器健康: 访问 http://localhost:3000
- [x] 10.4 检查日志: `podman logs` 无错误
- [x] 10.5 测试 API 端点在容器中正常工作

## 11. 文档更新

- [x] 11.1 更新 README.md: 说明新的架构和启动方式
- [x] 11.2 更新部署文档: 说明 `.env.production` 配置要求
- [x] 11.3 记录破坏性变更: API 端口变化、环境变量移除
