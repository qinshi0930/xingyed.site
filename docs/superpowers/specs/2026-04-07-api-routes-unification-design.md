# API路由统一重构设计

## 概述

将分散在 `app/api/*/route.ts` 和 `modules/*/api.ts` 的API路由统一提取到 `src/api/` 目录，全部采用Hono框架实现，移除Next.js原生Route Handler的混用。

## 当前问题

### 1. API路由分散
- **位置1**: `apps/app/src/app/api/*/route.ts` - 11个Next.js Route Handler
- **位置2**: `apps/app/src/modules/*/api.ts` - 2个Hono路由（blog, contact）

### 2. 实现不一致
- **Blog API**: 两套实现（`app/api/blog/route.ts` + `modules/blog/api.ts`）
- **Contact API**: 两套实现（`app/api/contact/route.ts` + `modules/contact/api.ts`）
- Hono统一入口 `[[...route]]/route.ts` 已挂载blog和contact，但其他路由未迁移

### 3. 架构混乱
- 部分使用 `NextResponse`（Next.js原生）
- 部分使用 `Hono` 框架
- 职责不清：modules目录混合了UI组件、业务逻辑和API路由

## 目标架构

### 目录结构

```
apps/app/src/
├── api/                                    # ✨ 新增：所有API路由
│   ├── index.ts                            # Hono主应用实例
│   ├── blog.ts                             # Blog路由
│   ├── contact.ts                          # Contact路由
│   ├── github.ts                           # GitHub路由
│   ├── learn.ts                            # Learn路由
│   ├── projects.ts                         # Projects路由
│   ├── spotify.ts                          # Spotify路由（合并now-playing + available-devices）
│   ├── views.ts                            # Views路由（GET + POST）
│   ├── comments.ts                         # Comments路由
│   ├── content.ts                          # Content路由
│   └── read-stats.ts                       # Read Stats路由
│
├── app/api/[[...route]]/route.ts           # 简化：只导入 src/api/index
│
├── modules/                                # 清理：移除api.ts
│   ├── blog/
│   │   ├── components/
│   │   ├── service.ts                      # 保留：业务逻辑
│   │   └── index.ts
│   └── contact/
│       ├── components/
│       ├── service.ts                      # 保留：业务逻辑
│       └── index.ts
│
└── services/                               # 保留：第三方API客户端
    ├── github.ts
    ├── spotify.ts
    └── wakatime.ts
```

### 职责划分

| 目录 | 职责 | 示例 |
|------|------|------|
| `src/api/` | HTTP路由定义、请求处理、响应格式化 | Hono路由处理器 |
| `src/modules/` | UI组件、模块状态管理、模块导出 | React组件、模块服务 |
| `src/services/` | 第三方API客户端封装 | GitHub API、Spotify API |
| `src/common/libs/` | 通用工具库 | Redis、MDX处理 |

## 迁移清单

### API路由迁移（11个）

| 原路径 | 新路径 | 源文件 | 目标文件 | 变更类型 |
|--------|--------|--------|----------|----------|
| `/api/blog` | `/api/blog` | `app/api/blog/route.ts` + `modules/blog/api.ts` | `src/api/blog.ts` | 合并+重构 |
| `/api/contact` | `/api/contact` | `app/api/contact/route.ts` + `modules/contact/api.ts` | `src/api/contact.ts` | 合并+重构 |
| `/api/github` | `/api/github` | `app/api/github/route.ts` | `src/api/github.ts` | 迁移 |
| `/api/learn` | `/api/learn` | `app/api/learn/route.ts` | `src/api/learn.ts` | 迁移 |
| `/api/projects` | `/api/projects` | `app/api/projects/route.ts` | `src/api/projects.ts` | 迁移 |
| `/api/now-playing` | `/api/spotify/now-playing` | `app/api/now-playing/route.ts` | `src/api/spotify.ts` | 迁移+路径变更 |
| `/api/available-devices` | `/api/spotify/available-devices` | `app/api/available-devices/route.ts` | `src/api/spotify.ts` | 迁移+路径变更 |
| `/api/views` | `/api/views` | `app/api/views/route.ts` | `src/api/views.ts` | 迁移 |
| `/api/comments` | `/api/comments` | `app/api/comments/route.ts` | `src/api/comments.ts` | 迁移 |
| `/api/content` | `/api/content` | `app/api/content/route.ts` | `src/api/content.ts` | 迁移 |
| `/api/read-stats` | `/api/read-stats` | `app/api/read-stats/route.ts` | `src/api/read-stats.ts` | 迁移 |

### 前端调用更新

| 文件 | 原路径 | 新路径 |
|------|--------|--------|
| `common/components/elements/NowPlayingCard.tsx` | `/api/now-playing` | `/api/spotify/now-playing` |
| `common/components/elements/NowPlayingBar.tsx` | `/api/now-playing` | `/api/spotify/now-playing` |
| `common/components/elements/NowPlayingBar.tsx` | `/api/available-devices` | `/api/spotify/available-devices` |

### 删除文件

- `app/api/blog/route.ts` - 重复实现
- `app/api/contact/route.ts` - 重复实现
- `app/api/github/route.ts` - 已迁移
- `app/api/learn/route.ts` - 已迁移
- `app/api/projects/route.ts` - 已迁移
- `app/api/now-playing/route.ts` - 已迁移
- `app/api/available-devices/route.ts` - 已迁移
- `app/api/views/route.ts` - 已迁移
- `app/api/comments/route.ts` - 已迁移
- `app/api/content/route.ts` - 已迁移
- `app/api/read-stats/route.ts` - 已迁移
- `modules/blog/api.ts` - 已迁移到 `src/api/blog.ts`
- `modules/contact/api.ts` - 已迁移到 `src/api/contact.ts`

## 技术实现

### 1. Hono主入口 (`src/api/index.ts`)

```typescript
import { Hono } from "hono";

import blogRoute from "./blog";
import contactRoute from "./contact";
import githubRoute from "./github";
import learnRoute from "./learn";
import projectsRoute from "./projects";
import spotifyRoute from "./spotify";
import viewsRoute from "./views";
import commentsRoute from "./comments";
import contentRoute from "./content";
import readStatsRoute from "./read-stats";

const app = new Hono().basePath("/api");

// 挂载所有子路由
app.route("/blog", blogRoute);
app.route("/contact", contactRoute);
app.route("/github", githubRoute);
app.route("/learn", learnRoute);
app.route("/projects", projectsRoute);
app.route("/spotify", spotifyRoute);
app.route("/views", viewsRoute);
app.route("/comments", commentsRoute);
app.route("/content", contentRoute);
app.route("/read-stats", readStatsRoute);

// 健康检查
app.get("/", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

export default app;
```

### 2. Next.js适配器 (`src/app/api/[[...route]]/route.ts`)

```typescript
import { handle } from "hono/vercel";

import app from "@/api";

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
```

### 3. 路由实现示例

#### 3.1 简单GET路由 (`src/api/github.ts`)

```typescript
import { Hono } from "hono";

import { getGithubUser } from "@/services/github";

const app = new Hono();

app.get("/", async (c) => {
  const type = c.req.query("type") || "";
  const response = await getGithubUser(type);

  c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
  return c.json(response.data);
});

export default app;
```

**关键变化**:
- 使用 `c.req.query("param")` 替代 `searchParams.get("param")`
- 使用 `c.json()` 替代 `NextResponse.json()`
- 使用 `c.header()` 替代 `response.headers.set()`

#### 3.2 多方法路由 (`src/api/views.ts`)

```typescript
import { Hono } from "hono";

import redis from "@/common/libs/redis";

const app = new Hono();

app.get("/", async (c) => {
  const slug = c.req.query("slug");

  if (!slug) {
    return c.json({ error: "slug parameter is required" }, 400);
  }

  try {
    const views = await redis.get(`views:${slug}`);
    const viewsCount = views ? parseInt(views, 10) : 0;
    return c.json({ views: viewsCount });
  } catch (error) {
    console.error("Failed to fetch views:", error);
    return c.json({ error: "Failed to fetch content meta" }, 500);
  }
});

app.post("/", async (c) => {
  const slug = c.req.query("slug");

  if (!slug) {
    return c.json({ error: "slug parameter is required" }, 400);
  }

  try {
    const views = await redis.incr(`views:${slug}`);
    return c.json({ views });
  } catch (error) {
    console.error("Failed to update views:", error);
    return c.json({ error: "Failed to update views count" }, 500);
  }
});

export default app;
```

#### 3.3 合并路由 (`src/api/spotify.ts`)

```typescript
import { Hono } from "hono";

import { getNowPlaying, getAvailableDevices } from "@/services/spotify";

const app = new Hono();

app.get("/now-playing", async (c) => {
  const response = await getNowPlaying();
  c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
  return c.json(response?.data);
});

app.get("/available-devices", async (c) => {
  const response = await getAvailableDevices();
  c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
  return c.json(response?.data);
});

export default app;
```

**路径变化**:
- `/api/now-playing` → `/api/spotify/now-playing`
- `/api/available-devices` → `/api/spotify/available-devices`

#### 3.4 POST路由 (`src/api/contact.ts`)

```typescript
import { Hono } from "hono";

import { sendMessage } from "@/services/contact";

const app = new Hono();

app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, message } = body;

    // 验证
    if (!name || !email || !message) {
      return c.json(
        {
          status: false,
          error: "Missing required fields",
        },
        400,
      );
    }

    await sendMessage({ name, email, message });

    return c.json({
      status: true,
      message: "Message sent successfully",
    });
  } catch {
    return c.json(
      {
        status: false,
        error: "Failed to send message",
      },
      500,
    );
  }
});

export default app;
```

**注意**: 前端发送的请求体结构是直接的对象 `{ name, email, message }`，而不是嵌套的 `{ formData: {...} }`。需要以 `modules/contact/api.ts` 的实现为准，移除 `app/api/contact/route.ts` 中的 `{ formData }` 解构。

#### 3.5 Blog路由 (`src/api/blog.ts`)

```typescript
import { Hono } from "hono";

import { getBlogs } from "@/common/libs/blog";

const app = new Hono();

app.get("/", async (c) => {
  try {
    const page = Number(c.req.query("page")) || 1;
    const per_page = Number(c.req.query("per_page")) || 9;
    const search = c.req.query("search") || "";
    const category = c.req.query("category") || "";
    const categories = c.req.query("categories");
    const is_featured = categories === "16" ? true : undefined;

    const data = getBlogs({
      page,
      per_page,
      search,
      category,
      is_featured,
    });

    c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
    return c.json({ status: true, data });
  } catch (error) {
    return c.json({ status: false, error }, 500);
  }
});

export default app;
```

**注意**: 
- 使用 `@/common/libs/blog` 中的 `getBlogs` 函数（`modules/blog/service.ts` 是其副本）
- 保持 `per_page` 默认值为 9（来自原 `app/api/blog/route.ts`）
- 保留 `categories=16` 到 `is_featured` 的特殊映射逻辑

## 风险与缓解

### 风险1: 路径变更导致前端调用失败

**影响**: `/api/now-playing` 和 `/api/available-devices` 路径变更

**缓解**:
- 在迁移前搜索所有引用这些路径的地方
- 同步更新前端调用代码
- 迁移后进行端到端测试

### 风险2: Contact API请求体结构不一致

**影响**: 两套Contact实现使用了不同的请求体结构

**缓解**:
- 已确认前端发送的是 `{ name, email, message }` 直接对象
- 统一使用此结构，移除 `{ formData }` 解构
- 添加类型定义确保一致性

### 风险3: Blog API逻辑差异

**影响**: 两套Blog实现可能逻辑不完全一致

**缓解**:
- 已确认两套实现完全相同
- 使用 `@/common/libs/blog` 中的 `getBlogs` 函数
- 保持 `per_page` 默认值为 9（API层）

## 架构决策

### 1. 错误处理策略

采用**混合方案**：
- **全局错误中间件**: 在 `src/api/index.ts` 中配置 `app.onError()`，捕获未处理的异常
- **路由级错误处理**: 允许特殊路由保留 try-catch 进行额外的错误处理逻辑
- **默认行为**: 路由处理器可以不写 try-catch，由全局中间件兜底处理

```typescript
// src/api/index.ts
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({
    status: false,
    error: err.message || 'Internal Server Error'
  }, 500);
});
```

### 2. 缓存策略

采用**通用缓存中间件**：
- 创建 `src/api/middleware/cache.ts`
- 默认缓存策略：60秒 s-maxage + 30秒 stale-while-revalidate
- 按需使用：`app.get("/", cache(), async (c) => {...})`
- POST路由（views, contact）不使用缓存

```typescript
// src/api/middleware/cache.ts
export const cache = (maxAge = 60, staleWhileRevalidate = 30) => {
  return async (c: Context, next: Next) => {
    await next();
    c.header("Cache-Control", 
      `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
    );
  };
};
```

### 3. API响应格式

统一使用**布尔值 status 字段**：
- **成功响应**: `{ status: true, data?: any, message?: string }`
- **错误响应**: `{ status: false, error: string }`
- HTTP状态码通过 `c.json(data, statusCode)` 的第二个参数设置
- 不使用 `{ status: 200 }` 这样的HTTP状态码作为status值

### 4. 中间件目录结构

采用 `src/api/middleware/` 目录：
```
src/api/
├── index.ts
├── middleware/
│   ├── error.ts      # 全局错误处理（可选，也可以在index.ts中直接配置）
│   └── cache.ts      # 缓存中间件
├── blog.ts
├── contact.ts
└── ...
```

### 5. Blog分页默认值

保持现状：
- **API层**: `per_page = 9`
- **业务逻辑层**: `per_page = 6`
- 前端所有调用都明确指定 `per_page` 参数，不会使用默认值

### 6. Spotify路由路径变更

采用**直接变更 + 前端同步更新**：
- `/api/now-playing` → `/api/spotify/now-playing`
- `/api/available-devices` → `/api/spotify/available-devices`
- 需要同步更新3处前端调用
- 在同一个commit中同时完成API迁移和前端更新

### 7. 模块API文件清理

**直接删除** `modules/blog/api.ts` 和 `modules/contact/api.ts`：
- 这两个文件只在 `app/api/[[...route]]/route.ts` 中被引用
- `modules/*/index.ts` 只导出UI组件，不导出api.ts
- 删除后不会影响模块的正常导出和使用

### 8. 迁移策略

采用**分批次渐进式迁移**：

**第1批**: Blog + Contact（已有Hono实现，风险最低）
- 创建基础架构（src/api/目录、中间件）
- 迁移Blog和Contact路由
- 验证功能正常

**第2批**: 简单GET路由（GitHub, Projects, Read Stats）
- 迁移无复杂逻辑的GET路由
- 验证缓存中间件工作正常

**第3批**: 复杂路由（Views, Learn, Content, Comments）
- 迁移支持多HTTP方法的路由
- 迁移有业务逻辑的路由

**第4批**: Spotify路由（涉及路径变更）
- 合并now-playing和available-devices
- 更新前端调用路径
- 端到端验证

每批迁移后验证：
- `pnpm dev` 成功启动
- 对应API端点可访问
- 前端页面正常渲染
- 无TypeScript类型错误

## 验证清单

迁移完成后需要验证：

- [ ] `pnpm dev` 成功启动
- [ ] 所有API端点可访问（共11个）
- [ ] Blog API返回正确的分页数据
- [ ] Contact API成功发送邮件
- [ ] GitHub API返回用户信息
- [ ] Spotify API返回当前播放状态
- [ ] Views API正确读写Redis
- [ ] 前端页面正常渲染
- [ ] Now Playing组件正常工作
- [ ] `pnpm build` 构建成功
- [ ] 无TypeScript类型错误

## 优势

1. **统一架构**: 全部使用Hono，移除Next.js原生Route Handler混用
2. **清晰职责**: API路由、UI组件、业务逻辑分离
3. **易于维护**: 所有API在一个目录，查找和修改更方便
4. **更好的扩展性**: 新增API时知道去哪里添加
5. **代码复用**: 移除重复的blog和contact实现
6. **类型安全**: 可以在 `src/api/` 中定义统一的API类型

## 后续优化建议

1. **统一错误处理**: 创建Hono中间件统一处理错误响应格式
2. **统一缓存策略**: 创建缓存中间件自动添加Cache-Control头
3. **API类型定义**: 为所有API请求和响应创建TypeScript类型
4. **API文档**: 使用Hono的OpenAPI中间件自动生成API文档
5. **测试**: 为所有API路由添加单元测试
