## Why

当前 `apps/app/src/api/` 目录混合了路由定义文件、中间件和主入口文件，职责不够清晰。将所有路由文件平铺在 `api/` 根目录下，随着路由数量增长会导致目录结构混乱，难以区分"路由定义"和"其他 API 相关代码"。

## What Changes

- 创建 `apps/app/src/api/routes/` 子目录
- 将所有路由模块文件移动到 `routes/` 目录：
  - `blog.ts` → `routes/blog.ts`
  - `comments.ts` → `routes/comments.ts`
  - `contact.ts` → `routes/contact.ts`
  - `content.ts` → `routes/content.ts`
  - `github.ts` → `routes/github.ts`
  - `learn.ts` → `routes/learn.ts`
  - `projects.ts` → `routes/projects.ts`
  - `read-stats.ts` → `routes/read-stats.ts`
  - `spotify.ts` → `routes/spotify.ts`
  - `views.ts` → `routes/views.ts`
- 更新 `api/index.ts` 中的 import 路径，从 `./blog` 改为 `./routes/blog`
- 更新每个路由文件对 middleware 的引用，从 `./middleware/cache` 改为 `../middleware/cache`
- `api/middleware/` 目录保持原位不变
- **不涉及任何功能变更或 API 行为修改**

## Capabilities

### New Capabilities
<!-- 无新功能，纯重构 -->

### Modified Capabilities
<!-- 无需求变更，仅目录结构调整 -->

## Impact

- **受影响文件**: `apps/app/src/api/` 目录下所有路由文件和 index.ts
- **API 行为**: 无变化（外部 API 路径保持不变）
- **依赖**: 无新增或删除依赖
- **风险**: 极低（仅 import 路径变更，TypeScript 编译器可验证）
