## 1. 创建目录结构

- [x] 1.1 创建 `apps/app/src/api/routes/` 目录

## 2. 移动路由文件

- [x] 2.1 移动 `blog.ts` 到 `routes/blog.ts`
- [x] 2.2 移动 `comments.ts` 到 `routes/comments.ts`
- [x] 2.3 移动 `contact.ts` 到 `routes/contact.ts`
- [x] 2.4 移动 `content.ts` 到 `routes/content.ts`
- [x] 2.5 移动 `github.ts` 到 `routes/github.ts`
- [x] 2.6 移动 `learn.ts` 到 `routes/learn.ts`
- [x] 2.7 移动 `projects.ts` 到 `routes/projects.ts`
- [x] 2.8 移动 `read-stats.ts` 到 `routes/read-stats.ts`
- [x] 2.9 移动 `spotify.ts` 到 `routes/spotify.ts`
- [x] 2.10 移动 `views.ts` 到 `routes/views.ts`

## 3. 更新路由文件中的 middleware 引用

- [x] 3.1 更新 `routes/blog.ts`: `./middleware/cache` → `../middleware/cache`
- [x] 3.2 更新 `routes/comments.ts`: `./middleware/cache` → `../middleware/cache`
- [x] 3.3 更新 `routes/content.ts`: `./middleware/cache` → `../middleware/cache`
- [x] 3.4 更新 `routes/github.ts`: `./middleware/cache` → `../middleware/cache`
- [x] 3.5 更新 `routes/learn.ts`: `./middleware/cache` → `../middleware/cache`
- [x] 3.6 更新 `routes/projects.ts`: `./middleware/cache` → `../middleware/cache`
- [x] 3.7 更新 `routes/read-stats.ts`: `./middleware/cache` → `../middleware/cache`
- [x] 3.8 更新 `routes/spotify.ts`: `./middleware/cache` → `../middleware/cache`

## 4. 更新主入口文件

- [x] 4.1 更新 `api/index.ts` 所有 import 路径: `./xxx` → `./routes/xxx`

## 5. 验证

- [x] 5.1 运行 TypeScript 编译检查 (`tsc --noEmit`)
- [x] 5.2 验证 API 路由正常工作（本地测试或 lint 检查）
- [x] 5.3 检查是否有遗漏的文件或引用
