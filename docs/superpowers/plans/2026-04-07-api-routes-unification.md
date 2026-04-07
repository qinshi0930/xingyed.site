# API路由统一重构实施计划

> **状态**: ✅ **已完成** (2026-04-07)  
> **分支**: `feature/api-routes-unification`  
> **提交**: 6个commit  
> **验证**: TypeScript ✅ | ESLint ✅ | 构建 ✅

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将所有API路由统一到 `src/api/` 目录，采用Hono框架实现，移除Next.js原生Route Handler混用

**Architecture:** 分4批次渐进式迁移，创建统一的API目录结构、中间件系统，逐批迁移路由并验证

**Tech Stack:** Hono 4.10.4, Next.js 15, TypeScript, React 19

---

## 文件结构概览

### 新建文件
```
apps/app/src/
├── api/
│   ├── index.ts                    # Hono主应用
│   ├── middleware/
│   │   └── cache.ts                # 缓存中间件
│   ├── blog.ts                     # 第1批
│   ├── contact.ts                  # 第1批
│   ├── github.ts                   # 第2批
│   ├── projects.ts                 # 第2批
│   ├── read-stats.ts               # 第2批
│   ├── views.ts                    # 第3批
│   ├── learn.ts                    # 第3批
│   ├── content.ts                  # 第3批
│   ├── comments.ts                 # 第3批
│   └── spotify.ts                  # 第4批
```

### 修改文件
- `apps/app/src/app/api/[[...route]]/route.ts` - 简化为只导入 `@/api`
- `apps/app/src/common/components/elements/NowPlayingCard.tsx` - 更新API路径（第4批）
- `apps/app/src/common/components/elements/NowPlayingBar.tsx` - 更新API路径（第4批）

### 删除文件（每批迁移后清理）
- `apps/app/src/app/api/*/route.ts` - 11个旧路由文件
- `apps/app/src/modules/blog/api.ts` - 第1批后删除
- `apps/app/src/modules/contact/api.ts` - 第1批后删除

---

## 第1批：基础架构 + Blog/Contact迁移

### Task 1: 创建API目录结构和缓存中间件

**Files:**
- Create: `apps/app/src/api/middleware/cache.ts`

- [ ] **Step 1: 创建缓存中间件**

创建文件 `apps/app/src/api/middleware/cache.ts`:

```typescript
import type { Context, Next } from "hono";

/**
 * 缓存中间件
 * @param maxAge - s-maxage值（秒），默认60
 * @param staleWhileRevalidate - stale-while-revalidate值（秒），默认30
 */
export const cache = (maxAge = 60, staleWhileRevalidate = 30) => {
  return async (c: Context, next: Next) => {
    await next();
    c.header(
      "Cache-Control",
      `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
    );
  };
};
```

- [ ] **Step 2: 提交**

```bash
cd /home/xingye/workspace/xingyed.site
git add apps/app/src/api/middleware/cache.ts
git commit -m "feat(api): 创建缓存中间件

- 支持自定义maxAge和staleWhileRevalidate参数
- 默认策略：60秒s-maxage + 30秒stale-while-revalidate
- 用于GET请求的HTTP缓存控制"
```

---

### Task 2: 创建Hono主入口和应用适配器

**Files:**
- Create: `apps/app/src/api/index.ts`
- Modify: `apps/app/src/app/api/[[...route]]/route.ts`

- [ ] **Step 1: 创建Hono主应用入口**

创建文件 `apps/app/src/api/index.ts`:

```typescript
import { Hono } from "hono";

const app = new Hono().basePath("/api");

// 全局错误处理
app.onError((err, c) => {
  console.error("API Error:", err);
  return c.json(
    {
      status: false,
      error: err.message || "Internal Server Error",
    },
    500,
  );
});

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

- [ ] **Step 2: 更新Next.js适配器**

修改文件 `apps/app/src/app/api/[[...route]]/route.ts`，替换全部内容为：

```typescript
import { handle } from "hono/vercel";

import app from "@/api";

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
```

- [ ] **Step 3: 验证基础架构**

```bash
cd /home/xingye/workspace/xingyed.site/apps/app
pnpm dev
```

访问 `http://localhost:3000/api/` 应该返回健康检查JSON。

- [ ] **Step 4: 提交**

```bash
cd /home/xingye/workspace/xingyed.site
git add apps/app/src/api/index.ts apps/app/src/app/api/[[...route]]/route.ts
git commit -m "feat(api): 创建Hono主入口和应用适配器

- 创建src/api/index.ts作为Hono主应用
- 配置全局错误处理中间件
- 添加健康检查端点 /api/
- 简化[[...route]]/route.ts为只导入@/api"
```

---

### Task 3: 迁移Blog API

**Files:**
- Create: `apps/app/src/api/blog.ts`

- [ ] **Step 1: 创建Blog路由**

创建文件 `apps/app/src/api/blog.ts`:

```typescript
import { Hono } from "hono";

import { getBlogs } from "@/common/libs/blog";

import { cache } from "./middleware/cache";

const app = new Hono();

app.get("/", cache(), async (c) => {
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

    return c.json({ status: true, data });
  } catch (error) {
    return c.json({ status: false, error }, 500);
  }
});

export default app;
```

- [ ] **Step 2: 挂载Blog路由到主应用**

修改文件 `apps/app/src/api/index.ts`，在健康检查之前添加：

```typescript
import blogRoute from "./blog";


// 挂载子路由
app.route("/blog", blogRoute);

// 健康检查
app.get("/", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});
```

完整文件应该是：

```typescript
import { Hono } from "hono";

import blogRoute from "./blog";

const app = new Hono().basePath("/api");

// 全局错误处理
app.onError((err, c) => {
  console.error("API Error:", err);
  return c.json(
    {
      status: false,
      error: err.message || "Internal Server Error",
    },
    500,
  );
});

// 挂载子路由
app.route("/blog", blogRoute);

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

- [ ] **Step 3: 验证Blog API**

```bash
cd /home/xingye/workspace/xingyed.site/apps/app
# 确保开发服务器正在运行
curl http://localhost:3000/api/blog?page=1&per_page=6
```

应该返回博客列表JSON数据。

- [ ] **Step 4: 提交**

```bash
cd /home/xingye/workspace/xingyed.site
git add apps/app/src/api/blog.ts apps/app/src/api/index.ts
git commit -m "feat(api): 迁移Blog API到Hono

- 创建src/api/blog.ts
- 使用@/common/libs/blog的getBlogs函数
- 应用缓存中间件
- 保持per_page默认值为9
- 保留categories=16到is_featured的映射逻辑"
```

---

### Task 4: 迁移Contact API

**Files:**
- Create: `apps/app/src/api/contact.ts`

- [ ] **Step 1: 创建Contact路由**

创建文件 `apps/app/src/api/contact.ts`:

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

- [ ] **Step 2: 挂载Contact路由**

修改 `apps/app/src/api/index.ts`，添加contact导入和路由：

```typescript
import blogRoute from "./blog";
import contactRoute from "./contact";


// 挂载子路由
app.route("/blog", blogRoute);
app.route("/contact", contactRoute);
```

- [ ] **Step 3: 验证Contact API**

```bash
cd /home/xingye/workspace/xingyed.site/apps/app
# 测试POST请求
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","message":"Test message"}'
```

应该返回成功响应。

- [ ] **Step 4: 删除旧的Contact API文件**

```bash
cd /home/xingye/workspace/xingyed.site
rm apps/app/src/app/api/contact/route.ts
rm apps/app/src/modules/contact/api.ts
```

- [ ] **Step 5: 验证并删除旧Blog API**

```bash
rm apps/app/src/app/api/blog/route.ts
rm apps/app/src/modules/blog/api.ts
```

- [ ] **Step 6: 提交第1批**

```bash
cd /home/xingye/workspace/xingyed.site
git add apps/app/src/api/contact.ts apps/app/src/api/index.ts
git add -u apps/app/src/app/api/contact/route.ts
git add -u apps/app/src/app/api/blog/route.ts
git add -u apps/app/src/modules/contact/api.ts
git add -u apps/app/src/modules/blog/api.ts
git commit -m "feat(api): 迁移Contact API并清理第1批旧文件

- 创建src/api/contact.ts
- 使用直接对象{name, email, message}作为请求体
- 删除旧的app/api/blog/route.ts和app/api/contact/route.ts
- 删除旧的modules/blog/api.ts和modules/contact/api.ts
- 更新主应用挂载contact路由"
```

---

### 第1批验证清单

- [ ] `pnpm dev` 成功启动
- [ ] 访问 `http://localhost:3000/api/` 返回健康检查
- [ ] 访问 `http://localhost:3000/api/blog?page=1` 返回博客列表
- [ ] POST `/api/contact` 能正常处理请求
- [ ] 前端博客页面正常渲染
- [ ] 前端联系表单正常工作
- [ ] 无TypeScript类型错误

---

## 第2批：简单GET路由迁移

### Task 5: 迁移GitHub API

**Files:**
- Create: `apps/app/src/api/github.ts`

- [ ] **Step 1: 创建GitHub路由**

创建文件 `apps/app/src/api/github.ts`:

```typescript
import { Hono } from "hono";

import { getGithubUser } from "@/services/github";

import { cache } from "./middleware/cache";

const app = new Hono();

app.get("/", cache(), async (c) => {
  const type = c.req.query("type") || "";
  const response = await getGithubUser(type);

  return c.json(response.data);
});

export default app;
```

- [ ] **Step 2: 挂载路由**

修改 `apps/app/src/api/index.ts`:

```typescript
import blogRoute from "./blog";
import contactRoute from "./contact";
import githubRoute from "./github";


app.route("/blog", blogRoute);
app.route("/contact", contactRoute);
app.route("/github", githubRoute);
```

- [ ] **Step 3: 提交**

```bash
cd /home/xingye/workspace/xingyed.site
git add apps/app/src/api/github.ts apps/app/src/api/index.ts
git commit -m "feat(api): 迁移GitHub API到Hono

- 创建src/api/github.ts
- 应用缓存中间件
- 挂载到/api/github路径"
```

---

### Task 6: 迁移Projects API

**Files:**
- Create: `apps/app/src/api/projects.ts`

- [ ] **Step 1: 创建Projects路由**

创建文件 `apps/app/src/api/projects.ts`:

```typescript
import { Hono } from "hono";

import { PROJECT_CONTENTS } from "@/common/constant/projects";

import { cache } from "./middleware/cache";

const app = new Hono();

app.get("/", cache(), (c) => {
  try {
    const response = PROJECT_CONTENTS.filter((p) => p.is_show);
    return c.json({ status: true, data: response });
  } catch (error) {
    return c.json({ status: false, error }, 500);
  }
});

export default app;
```

- [ ] **Step 2: 挂载路由并删除旧文件**

修改 `apps/app/src/api/index.ts` 添加projects路由，然后删除旧文件：

```bash
cd /home/xingye/workspace/xingyed.site
rm apps/app/src/app/api/projects/route.ts
```

- [ ] **Step 3: 提交**

```bash
cd /home/xingye/workspace/xingyed.site
git add apps/app/src/api/projects.ts apps/app/src/api/index.ts
git add -u apps/app/src/app/api/projects/route.ts
git commit -m "feat(api): 迁移Projects API到Hono

- 创建src/api/projects.ts
- 应用缓存中间件
- 删除旧的app/api/projects/route.ts"
```

---

### Task 7: 迁移Read Stats API

**Files:**
- Create: `apps/app/src/api/read-stats.ts`

- [ ] **Step 1: 创建Read Stats路由**

创建文件 `apps/app/src/api/read-stats.ts`:

```typescript
import { Hono } from "hono";

import { getALLTimeSinceToday, getReadStats } from "@/services/wakatime";

import { cache } from "./middleware/cache";

const app = new Hono();

app.get("/", cache(), async (c) => {
  try {
    const readStatsResponse = await getReadStats();
    const allTimeSinceTodayResponse = await getALLTimeSinceToday();

    const data = {
      ...readStatsResponse.data,
      all_time_since_today: allTimeSinceTodayResponse.data,
    };

    return c.json(data);
  } catch {
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

export default app;
```

- [ ] **Step 2: 挂载路由并删除旧文件**

修改 `apps/app/src/api/index.ts` 添加read-stats路由，然后删除旧文件：

```bash
rm apps/app/src/app/api/read-stats/route.ts
```

- [ ] **Step 3: 提交第2批**

```bash
cd /home/xingye/workspace/xingyed.site
git add apps/app/src/api/read-stats.ts apps/app/src/api/index.ts
git add -u apps/app/src/app/api/read-stats/route.ts
git commit -m "feat(api): 迁移Read Stats API并完成第2批

- 创建src/api/read-stats.ts
- 应用缓存中间件
- 删除旧的app/api/read-stats/route.ts
- 第2批完成：GitHub, Projects, Read Stats全部迁移"
```

---

### 第2批验证清单

- [ ] `pnpm dev` 成功启动
- [ ] `/api/github?type=` 返回GitHub用户信息
- [ ] `/api/projects` 返回项目列表
- [ ] `/api/read-stats` 返回WakaTime统计数据
- [ ] 所有响应包含正确的Cache-Control头
- [ ] 前端相关组件正常渲染

---

## 第3批：复杂路由迁移

### Task 8: 迁移Views API（多方法）

**Files:**
- Create: `apps/app/src/api/views.ts`

- [ ] **Step 1: 创建Views路由**

创建文件 `apps/app/src/api/views.ts`:

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

- [ ] **Step 2: 挂载路由并删除旧文件**

修改 `apps/app/src/api/index.ts` 添加views路由，然后：

```bash
rm apps/app/src/app/api/views/route.ts
```

- [ ] **Step 3: 提交**

```bash
cd /home/xingye/workspace/xingyed.site
git add apps/app/src/api/views.ts apps/app/src/api/index.ts
git add -u apps/app/src/app/api/views/route.ts
git commit -m "feat(api): 迁移Views API到Hono

- 创建src/api/views.ts
- 支持GET和POST方法
- GET: 获取页面浏览量
- POST: 增加页面浏览量
- 不使用缓存中间件（动态数据）"
```

---

### Task 9: 迁移Learn API

**Files:**
- Create: `apps/app/src/api/learn.ts`

- [ ] **Step 1: 创建Learn路由**

创建文件 `apps/app/src/api/learn.ts`:

```typescript
import { Hono } from "hono";

import { getMdxFileCount } from "@/common/libs/mdx";

import { cache } from "./middleware/cache";

const app = new Hono();

app.get("/", cache(), async (c) => {
  const slug = c.req.query("slug") as string;
  const count = await getMdxFileCount(`learn/${slug}`);

  return c.json({ count });
});

export default app;
```

- [ ] **Step 2: 挂载路由并删除旧文件**

```bash
rm apps/app/src/app/api/learn/route.ts
```

- [ ] **Step 3: 提交**

```bash
cd /home/xingye/workspace/xingyed.site
git add apps/app/src/api/learn.ts apps/app/src/api/index.ts
git add -u apps/app/src/app/api/learn/route.ts
git commit -m "feat(api): 迁移Learn API到Hono

- 创建src/api/learn.ts
- 应用缓存中间件
- 删除旧的app/api/learn/route.ts"
```

---

### Task 10: 迁移Content API

**Files:**
- Create: `apps/app/src/api/content.ts`

- [ ] **Step 1: 创建Content路由**

创建文件 `apps/app/src/api/content.ts`:

```typescript
import { Hono } from "hono";

import { loadMdxFiles } from "@/common/libs/mdx";

import { cache } from "./middleware/cache";

const app = new Hono();

app.get("/", cache(), async (c) => {
  const category = c.req.query("category");
  const contentList = await loadMdxFiles(`learn/${category}`);

  const data = contentList.map((item) => ({
    id: item?.frontMatter?.id,
    parent_slug: category || "",
    slug: item.slug || "",
    title: item.frontMatter.title || "",
  }));

  return c.json({ data });
});

export default app;
```

- [ ] **Step 2: 挂载路由并删除旧文件**

```bash
rm apps/app/src/app/api/content/route.ts
```

- [ ] **Step 3: 提交**

```bash
cd /home/xingye/workspace/xingyed.site
git add apps/app/src/api/content.ts apps/app/src/api/index.ts
git add -u apps/app/src/app/api/content/route.ts
git commit -m "feat(api): 迁移Content API到Hono

- 创建src/api/content.ts
- 应用缓存中间件
- 删除旧的app/api/content/route.ts"
```

---

### Task 11: 迁移Comments API

**Files:**
- Create: `apps/app/src/api/comments.ts`

- [ ] **Step 1: 创建Comments路由**

创建文件 `apps/app/src/api/comments.ts`:

```typescript
import { Hono } from "hono";

import { getBlogComment } from "@/services/devto";

import { cache } from "./middleware/cache";

const app = new Hono();

app.get("/", cache(), async (c) => {
  try {
    const post_id = c.req.query("post_id");

    const response = await getBlogComment({
      post_id: post_id as string,
    });

    return c.json({
      status: true,
      data: response.data,
    });
  } catch (error) {
    return c.json({ status: false, error }, 500);
  }
});

export default app;
```

- [ ] **Step 2: 挂载路由、删除旧文件并提交第3批**

```bash
cd /home/xingye/workspace/xingyed.site
rm apps/app/src/app/api/comments/route.ts

git add apps/app/src/api/comments.ts apps/app/src/api/index.ts
git add -u apps/app/src/app/api/comments/route.ts
git commit -m "feat(api): 迁移Comments API并完成第3批

- 创建src/api/comments.ts
- 应用缓存中间件
- 删除旧的app/api/comments/route.ts
- 第3批完成：Views, Learn, Content, Comments全部迁移"
```

---

### 第3批验证清单

- [ ] GET/POST `/api/views?slug=xxx` 正常工作
- [ ] `/api/learn?slug=xxx` 返回MDX文件数量
- [ ] `/api/content?category=xxx` 返回内容列表
- [ ] `/api/comments?post_id=xxx` 返回评论列表
- [ ] 前端相关页面正常渲染

---

## 第4批：Spotify路由 + 前端路径更新

### Task 12: 创建Spotify路由（合并）

**Files:**
- Create: `apps/app/src/api/spotify.ts`

- [ ] **Step 1: 创建Spotify路由**

创建文件 `apps/app/src/api/spotify.ts`:

```typescript
import { Hono } from "hono";

import { getNowPlaying, getAvailableDevices } from "@/services/spotify";

import { cache } from "./middleware/cache";

const app = new Hono();

app.get("/now-playing", cache(), async (c) => {
  const response = await getNowPlaying();
  return c.json(response?.data);
});

app.get("/available-devices", cache(), async (c) => {
  const response = await getAvailableDevices();
  return c.json(response?.data);
});

export default app;
```

- [ ] **Step 2: 挂载路由**

修改 `apps/app/src/api/index.ts`:

```typescript
import spotifyRoute from "./spotify";


app.route("/spotify", spotifyRoute);
```

- [ ] **Step 3: 提交**

```bash
cd /home/xingye/workspace/xingyed.site
git add apps/app/src/api/spotify.ts apps/app/src/api/index.ts
git commit -m "feat(api): 创建Spotify路由（合并now-playing和available-devices）

- 创建src/api/spotify.ts
- 路径: /api/spotify/now-playing 和 /api/spotify/available-devices
- 应用缓存中间件
- 注意：需要后续更新前端调用路径"
```

---

### Task 13: 更新前端调用路径

**Files:**
- Modify: `apps/app/src/common/components/elements/NowPlayingCard.tsx`
- Modify: `apps/app/src/common/components/elements/NowPlayingBar.tsx`

- [ ] **Step 1: 更新NowPlayingCard.tsx**

修改文件 `apps/app/src/common/components/elements/NowPlayingCard.tsx`，找到第16行：

```typescript
// 修改前
const { data } = useSWR<NowPlayingProps>("/api/now-playing", fetcher);

// 修改后
const { data } = useSWR<NowPlayingProps>("/api/spotify/now-playing", fetcher);
```

- [ ] **Step 2: 更新NowPlayingBar.tsx**

修改文件 `apps/app/src/common/components/elements/NowPlayingBar.tsx`，找到第20和22行：

```typescript
// 修改前
const { data: playingData } = useSWR<NowPlayingProps>("/api/now-playing", fetcher);
const { data: devicesData = [] } = useSWR<DeviceProps[]>("/api/available-devices", fetcher);

// 修改后
const { data: playingData } = useSWR<NowPlayingProps>("/api/spotify/now-playing", fetcher);
const { data: devicesData = [] } = useSWR<DeviceProps[]>("/api/spotify/available-devices", fetcher);
```

- [ ] **Step 3: 删除旧API文件**

```bash
cd /home/xingye/workspace/xingyed.site
rm apps/app/src/app/api/now-playing/route.ts
rm apps/app/src/app/api/available-devices/route.ts
```

- [ ] **Step 4: 验证Spotify功能**

确保开发服务器运行，检查：
- Now Playing卡片显示当前播放歌曲
- Now Playing栏正常工作
- 设备列表能正常加载

- [ ] **Step 5: 提交第4批并完成**

```bash
cd /home/xingye/workspace/xingyed.site
git add apps/app/src/common/components/elements/NowPlayingCard.tsx
git add apps/app/src/common/components/elements/NowPlayingBar.tsx
git add -u apps/app/src/app/api/now-playing/route.ts
git add -u apps/app/src/app/api/available-devices/route.ts
git commit -m "feat(api): 更新前端Spotify路径并完成第4批迁移

- 更新NowPlayingCard.tsx: /api/now-playing → /api/spotify/now-playing
- 更新NowPlayingBar.tsx: 两处路径更新
- 删除旧的app/api/now-playing/route.ts
- 删除旧的app/api/available-devices/route.ts
- 第4批完成，全部API迁移完成"
```

---

### 第4批验证清单

- [ ] `/api/spotify/now-playing` 返回当前播放状态
- [ ] `/api/spotify/available-devices` 返回可用设备列表
- [ ] Now Playing组件正常显示
- [ ] 旧路径 `/api/now-playing` 返回404（预期行为）

---

## 最终验证

### Task 14: 端到端验证

- [ ] **Step 1: 启动开发服务器并测试所有API**

```bash
cd /home/xingye/workspace/xingyed.site/apps/app
pnpm dev
```

访问以下端点验证：
- `http://localhost:3000/api/` - 健康检查
- `http://localhost:3000/api/blog?page=1` - 博客列表
- `http://localhost:3000/api/github?type=` - GitHub信息
- `http://localhost:3000/api/projects` - 项目列表
- `http://localhost:3000/api/read-stats` - 阅读统计
- `http://localhost:3000/api/spotify/now-playing` - 当前播放

- [ ] **Step 2: 验证前端页面**

- 首页正常渲染
- 博客列表页面正常
- 联系表单能正常提交
- Now Playing组件正常工作

- [ ] **Step 3: TypeScript类型检查**

```bash
cd /home/xingye/workspace/xingyed.site/apps/app
pnpm tsc --noEmit
```

应该无错误。

- [ ] **Step 4: 构建验证**

```bash
cd /home/xingye/workspace/xingyed.site/apps/app
pnpm build
```

应该成功构建。

- [ ] **Step 5: 最终提交（如果需要）**

```bash
cd /home/xingye/workspace/xingyed.site
git add -A
git commit -m "chore(api): 完成API路由统一重构

- 所有11个API路由已迁移到src/api/目录
- 统一使用Hono框架
- 创建缓存中间件和全局错误处理
- 清理所有旧的Route Handler文件
- 前端所有功能正常"
```

---

## 迁移完成检查清单

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
- [ ] 所有旧API文件已删除
- [ ] Git提交历史清晰

---

## 风险缓解

### 如果某批迁移出现问题

1. **停止迁移**，不要继续下一批
2. **回滚当前批次**的git commit
3. **调试问题**，修复后重新提交
4. **验证通过后**再继续下一批

### 如果前端路径更新导致问题

1. 检查是否有遗漏的调用点：`grep -r "now-playing\|available-devices" src/`
2. 临时回滚路径变更，保持API向后兼容
3. 逐一更新前端调用，测试后再删除旧API

---

## 执行总结

### 完成情况

**执行日期**: 2026-04-07  
**执行方式**: Subagent-Driven Development  
**工作分支**: `feature/api-routes-unification`  
**总提交数**: 7个commit（含1个文档更新）

### 提交历史

1. `f0c606c` - feat(api): 创建API基础架构（中间件、Hono主入口、适配器）
2. `3393def` - feat(api): 迁移Blog和Contact路由到Hono（第1批）
3. `62796ce` - feat(api): 迁移简单GET路由到Hono（第2批）
4. `2ffa68b` - feat(api): 迁移复杂路由到Hono（第3批）
5. `4440d52` - feat(api): 合并Spotify路由并更新前端（第4批）
6. `b01e4d0` - style(api): 修复ESLint格式问题和构建验证
7. `99a38b9` - docs: 更新OpenSpec任务状态为全部完成

### 验证结果

| 检查项 | 状态 | 详情 |
|--------|------|------|
| TypeScript编译 | ✅ 通过 | `pnpm tsc --noEmit` 无错误 |
| ESLint检查 | ✅ 通过 | `pnpm lint --fix` 修复所有问题 |
| 生产构建 | ✅ 通过 | `pnpm build` 成功，9.2秒编译 |
| 旧文件清理 | ✅ 完成 | 13个旧文件已删除 |
| 新文件创建 | ✅ 完成 | 12个新文件已创建 |
| 前端更新 | ✅ 完成 | 3处API路径已更新 |

### 架构变更

**新增文件** (12个):
- `src/api/index.ts` - Hono主应用
- `src/api/middleware/cache.ts` - 缓存中间件
- 11个API路由文件（blog, contact, github, projects, read-stats, views, learn, content, comments, spotify）

**删除文件** (13个):
- 11个旧 `app/api/*/route.ts` 文件
- 2个 `modules/*/api.ts` 死代码文件

**修改文件** (4个):
- `app/api/[[...route]]/route.ts` - 简化适配器
- `src/api/index.ts` - 4次迭代挂载路由
- `NowPlayingCard.tsx` - API路径更新
- `NowPlayingBar.tsx` - API路径更新（2处）

### 关键决策记录

1. **统一目录结构**: 所有API路由集中在 `src/api/` 目录
2. **Hono框架**: 全部采用Hono，移除Next.js Route Handler混用
3. **中间件系统**: 全局错误处理 + 可配置缓存中间件
4. **分批次迁移**: 4批次渐进式，每批独立验证
5. **Breaking Change**: Spotify路径变更，前端同步更新
6. **Bug修复**: Contact API请求体解构错误已修复

### 后续优化建议

1. 为关键API添加单元测试
2. 考虑添加API版本控制（/api/v1/*）
3. 添加API速率限制中间件
4. 监控API性能和错误率

---

## 后续优化（不在本次范围）

1. 统一API类型定义
2. 添加API单元测试
3. 生成OpenAPI文档
4. 添加请求日志中间件
5. 添加速率限制中间件
