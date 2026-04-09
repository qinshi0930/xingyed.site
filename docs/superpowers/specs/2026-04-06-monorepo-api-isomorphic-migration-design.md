# Monorepo 后端 API 同构迁移设计

**日期:** 2026-04-06  
**状态:** 设计中  
**作者:** AI Assistant  

---

## 概述

将当前的 Monorepo 分离架构（`apps/api` + `apps/web`）合并为单一的同构 Next.js 应用（`@repo/app`），使用 Hono 框架通过 `hono/vercel` 适配器嵌入 Next.js App Router，实现前后端统一的技术栈和部署流程。

---

## 背景与动机

### 当前架构问题

1. **双应用管理复杂**: 需要同时运行和维护两个独立的应用（端口 3000 和 3001）
2. **CORS 配置**: 开发环境需要处理跨域请求
3. **类型共享繁琐**: 需要通过 `@repo/types` 包进行跨应用类型共享
4. **部署复杂度**: 需要确保两个应用同时启动和运行
5. **代码重复**: `apps/web/src/app/api/blog/route.ts` 与 `apps/api/src/routes/blog.ts` 逻辑重复

### 目标架构优势

1. **单一应用**: 只需管理一个 Next.js 应用
2. **零 CORS**: 同域请求，无需配置跨域
3. **Hono 生态**: 保持使用 Hono 的优雅 API 定义方式
4. **简化部署**: 单一 Docker 镜像，单一进程
5. **类型安全**: 直接 import，无需跨包引用
6. **Next.js 工具链**: 完整的 Turbopack、ISR、SSR 支持

---

## 架构设计

### 目录结构

```
personalblog-monorepo/
├── apps/
│   └── app/                          # @repo/app (统一的 Next.js 应用)
│       ├── src/
│       │   ├── app/
│       │   │   ├── (page)/           # 前端页面路由
│       │   │   ├── api/              # API 路由 (Hono)
│       │   │   │   └── [[...route]]/
│       │   │   │       └── route.ts  # Hono 统一入口
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx
│       │   ├── modules/              # 业务模块
│       │   │   ├── blog/
│       │   │   │   ├── api.ts        # Hono 路由定义
│       │   │   │   ├── service.ts    # 业务逻辑
│       │   │   │   └── components/   # UI 组件
│       │   │   ├── contact/
│       │   │   │   ├── api.ts        # 联系表单 API
│       │   │   │   └── components/
│       │   │   └── chat/
│       │   │       ├── api.ts        # ChatGPT API
│       │   │       └── components/
│       │   ├── services/             # 前端服务层 (调用 /api/*)
│       │   │   ├── fetcher.ts        # 更新为相对路径
│       │   │   └── ...
│       │   └── common/               # 共享代码
│       └── package.json              # name: "@repo/app"
├── packages/
│   ├── types/                        # @repo/types
│   └── utils/                        # @repo/utils
└── package.json                      # 更新脚本
```

### 核心组件

#### 1. Hono API 统一入口

**文件:** `apps/app/src/app/api/[[...route]]/route.ts`

```typescript
import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import blogRoute from '@/modules/blog/api'
import contactRoute from '@/modules/contact/api'

const app = new Hono().basePath('/api')

// 挂载子路由
app.route('/blog', blogRoute)
app.route('/contact', contactRoute)

// 健康检查
app.get('/', (c) => {
  return c.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// 导出所有 HTTP 方法
export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
export const PATCH = handle(app)
```

**关键点:**
- 使用 `[[...route]]` 捕获所有 API 路由
- `.basePath('/api')` 确保所有路由以 `/api` 为前缀
- `hono/vercel` 适配器将 Hono 应用转换为 Next.js Route Handler
- 导出所有 HTTP 方法以支持完整的 RESTful API

#### 2. 模块 API 定义

每个业务模块包含独立的 Hono 路由定义：

**Blog API** (`apps/app/src/modules/blog/api.ts`)

```typescript
import { Hono } from 'hono'
import { getBlogs } from './service'

const app = new Hono()

app.get('/', async (c) => {
  try {
    const url = new URL(c.req.url)
    const page = Number(url.searchParams.get("page")) || 1;
    const per_page = Number(url.searchParams.get("per_page")) || 9;
    const search = url.searchParams.get("search") || "";
    const category = url.searchParams.get("category") || "";
    const categories = url.searchParams.get("categories");
    const is_featured = categories === "16" ? true : undefined;

    const data = getBlogs({
      page,
      per_page,
      search,
      category,
      is_featured,
    });

    c.header('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
    return c.json({ status: true, data });
  } catch (error) {
    return c.json({ status: false, error }, 500);
  }
})

export default app
```

**Contact API** (`apps/app/src/modules/contact/api.ts`)

```typescript
import { Hono } from 'hono'
import { sendContactEmail } from './service'

const app = new Hono()

app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { name, email, message } = body

    // 验证
    if (!name || !email || !message) {
      return c.json({ 
        status: false, 
        error: 'Missing required fields' 
      }, 400)
    }

    await sendContactEmail({ name, email, message })
    
    return c.json({ 
      status: true, 
      message: 'Message sent successfully' 
    })
  } catch (error) {
    return c.json({ 
      status: false, 
      error: 'Failed to send message' 
    }, 500)
  }
})

export default app
```



#### 3. 前端服务层更新

**Fetcher 更新** (`apps/app/src/services/fetcher.ts`)

```typescript
import axios from "axios";

// 移除 API_URL，使用相对路径
export const fetcher = (url: string) => {
  // url 已经是相对路径，如 '/api/blog'
  return axios.get(url).then((response) => response.data);
};
```

**关键变更:**
- 移除 `NEXT_PUBLIC_API_URL` 环境变量依赖
- 所有 API 调用使用相对路径（`/api/*`）
- 自动同域请求，无需 CORS 配置

---

## 前端用户体验改进

### Toast 通知系统

**安装 Sonner:**
```bash
pnpm add sonner
```

**在根布局中添加 Toaster:**
```typescript
// apps/app/src/app/layout.tsx
import { Toaster } from 'sonner'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster 
          position="bottom-right" 
          richColors 
          closeButton 
        />
      </body>
    </html>
  )
}
```

**在 ContactForm 中使用:**
```typescript
import { toast } from 'sonner'

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  setIsLoading(true);
  
  try {
    // 直接发送 formData，不嵌套
    const response = await axios.post('/api/contact', formData);
    
    if (response.data.status) {
      toast.success('消息发送成功!');
      setFormData(formInitialState);
    } else {
      toast.error(response.data.error || '发送失败');
    }
  } catch (error) {
    toast.error('网络错误，请稍后重试');
  } finally {
    setIsLoading(false);
  }
};
```

**全局统一使用:** 所有模块（Blog、Contact 等）的 API 错误和成功消息都使用统一的 Toast 通知系统。

---

## 迁移范围

### 需要迁移的模块

1. **Blog API** (从 `apps/api/src/routes/blog.ts`)
   - 路由: `/api/blog`
   - 功能: 获取博客列表（分页、搜索、分类）
   - 数据源: 本地 MDX 文件
   - **保留原因**: 为未来数据库扩展预留架构空间

2. **Contact API** (从 `apps/web/src/services/contact.ts`)
   - 路由: `/api/contact`
   - 功能: 发送联系表单邮件
   - 依赖: Nodemailer, SMTP 配置

### 已移除的模块

**Chat API** - 已从项目中移除,不纳入本次迁移范围

### 不需要迁移的服务

以下服务保持在前端直接调用第三方 API：
- `devto.ts` - Dev.to 文章同步
- `github.ts` - GitHub 数据获取
- `spotify.ts` - Spotify 播放状态
- `wakatime.ts` - Wakatime 统计

**原因:** 这些服务主要是读取第三方 API，不涉及敏感密钥或复杂的后端逻辑。

---

## 配置变更

### Package.json 更新

#### apps/app/package.json

```json
{
  "name": "@repo/app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "rimraf -rf .next && next dev --turbopack",
    "build": "rimraf -rf .next && next build --turbopack",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    // ... 保持现有依赖
    "hono": "^4.10.4"  // 已存在
  }
}
```

#### 根目录 package.json

```json
{
  "name": "personalblog-monorepo",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter @repo/app dev",
    "build": "pnpm --filter @repo/app build",
    "start": "pnpm --filter @repo/app start",
    "lint": "pnpm --filter @repo/app lint"
  },
  "devDependencies": {}
}
```

### pnpm-workspace.yaml

```yaml
packages:
  - "apps/app"
  - "packages/*"

onlyBuiltDependencies:
  - '@firebase/util'
  - '@tailwindcss/oxide'
  - protobufjs
  - sharp
  - unrs-resolver
```

### 环境变量管理

**必需的环境变量:**

```bash
# SMTP Configuration (Contact API)
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=your_email@163.com
SMTP_PASS=your_password
SMTP_FROM=your_email@163.com
SMTP_TO=recipient@example.com

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # 可选
REDIS_DB=0

# GitHub App
APP_ID=xxx
APP_PEM_KEY_BASE64=xxx
APP_INSTALLATION_ID=xxx

# Spotify
SPOTIFY_CLIENT_ID=xxx
SPOTIFY_CLIENT_SECRET=xxx
SPOTIFY_REFRESH_TOKEN=xxx

# Wakatime
WAKATIME_API_KEY=xxx

# Dev.to
DEVTO_KEY=xxx

# Node Environment
NODE_ENV=production
```

**生产环境配置:**

使用外部 `.env.production` 文件管理生产环境变量：

1. **创建 `.env.production` (不提交到 Git)**
2. **更新 `.gitignore`:**
   ```bash
   .env
   .env.local
   .env.production
   .env.*.local
   ```
3. **在 `podman-compose.yml` 中引用:**
   ```yaml
   services:
     app:
       env_file:
         - .env.production
   ```

**注意:** 迁移后不再需要 `NEXT_PUBLIC_API_URL` 环境变量。

---

## Docker 部署配置简化

### 新的 Dockerfile

```dockerfile
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.21.0 --activate

WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/app/package.json ./apps/app/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app
# 只需要复制 app 的构建产物
COPY --from=base --chown=nextjs:nodejs /app/apps/app/.next/standalone ./
COPY --from=base --chown=nextjs:nodejs /app/apps/app/.next/static ./apps/app/.next/static
COPY --from=base --chown=nextjs:nodejs /app/apps/app/public ./apps/app/public
COPY --from=base --chown=nextjs:nodejs /app/apps/app/src/contents ./apps/app/src/contents
COPY --from=base --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=nextjs:nodejs /app/packages ./packages

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "apps/app/server.js"]
```

**关键变化:**
- ❌ 移除 `apps/api` 相关配置
- ✅ 只暴露一个端口 `3000`
- ✅ 直接使用 `node server.js` 而不是 `pnpm start`
- ✅ 更简单的目录结构

### Podman Compose 简化

```yaml
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    networks:
      - app-network

  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "3000:3000"  # 只有一个端口
    env_file:
      - .env.production
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - redis
    networks:
      - app-network

volumes:
  redis-data:

networks:
  app-network:
    driver: bridge
```

---

## 技术细节

### Hono 适配器工作原理

`hono/vercel` 适配器将 Hono 应用转换为 Next.js Route Handler：

1. **请求流程:**
   ```
   Client Request → Next.js Router → [[...route]]/route.ts 
   → Hono App → Route Handler → Response
   ```

2. **运行时:**
   - 默认使用 Node.js Runtime
   - 不支持 Edge Runtime（因为使用了 Node.js 特定的 API）

3. **中间件支持:**
   - 可以使用 Hono 的所有中间件（cors、logger、jwt 等）
   - 可以自定义中间件

### 缓存策略

**Blog API 缓存头:**
```typescript
c.header('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
```

- `s-maxage=60`: CDN 缓存 60 秒
- `stale-while-revalidate=30`: 过期后 30 秒内仍可提供旧数据，同时后台刷新

### 错误处理

所有 API 路由遵循统一的错误响应格式：

```typescript
// 成功响应
{ status: true, data: {...} }

// 错误响应
{ status: false, error: "Error message" }
```

HTTP 状态码：
- `200`: 成功
- `400`: 请求参数错误
- `500`: 服务器内部错误

---

## 迁移步骤

1. **重命名目录**: `apps/web` → `apps/app`
2. **更新 package.json**: name 改为 `@repo/app`
3. **创建 Hono 入口**: `src/app/api/[[...route]]/route.ts`
4. **迁移 API 路由**:
   - `apps/api/src/routes/blog.ts` → `apps/app/src/modules/blog/api.ts`
   - 创建 `apps/app/src/modules/contact/api.ts`
   - ~~Chat: 已移除,不需要迁移~~
5. **更新前端调用**: 所有 API 调用改为相对路径 `/api/*`
6. **删除旧应用**: 移除 `apps/api` 目录
7. **更新配置**: 根目录 package.json、pnpm-workspace.yaml
8. **测试验证**: 确保所有功能正常

---

## 风险与缓解

### 风险 1: Hono 与 Next.js 兼容性问题

**风险描述:** Hono 在 Next.js App Router 中可能存在边缘情况的兼容性问题。

**缓解措施:**
- 使用官方推荐的 `hono/vercel` 适配器
- 保持 Node.js Runtime（不使用 Edge）
- 充分测试所有 API 端点

### 风险 2: 环境变量配置错误

**风险描述:** 忘记移除 `NEXT_PUBLIC_API_URL` 导致仍然尝试访问旧端口。

**缓解措施:**
- 在迁移完成后立即删除该环境变量
- 在代码中添加注释说明
- 测试时监控网络请求

### 风险 3: 路径别名冲突

**风险描述:** `@/modules/*/api.ts` 可能与现有导入冲突。

**缓解措施:**
- 检查所有现有导入
- 使用唯一的文件名
- TypeScript 编译时会捕获冲突

### 风险 4: 性能回归

**风险描述:** 同构架构可能导致启动时间变慢。

**缓解措施:**
- 使用 Turbopack 加速开发
- 监控生产环境性能指标
- 必要时进行代码分割优化

---

## 成功标准

1. ✅ 单一应用启动: `pnpm dev` 只启动一个进程
2. ✅ 所有 API 端点正常工作: `/api/blog`, `/api/contact`
3. ✅ 前端页面正常渲染且能调用 API
4. ✅ 无 CORS 错误
5. ✅ 构建成功: `pnpm build` 无错误
6. ✅ 生产环境正常运行: `pnpm start` 启动成功

---

## 后续优化方向

1. **添加 Hono 中间件:**
   - 日志记录
   - 请求验证（Zod）
   - 速率限制

2. **API 文档:**
   - 使用 Hono 的 OpenAPI 集成
   - 自动生成 API 文档

3. **测试覆盖:**
   - 单元测试: Vitest + Hono 测试工具
   - 集成测试: 端到端 API 测试

4. **性能监控:**
   - 添加 API 响应时间监控
   - 错误追踪集成

---

## 参考资料

- [Hono Next.js 集成文档](https://hono.dev/docs/getting-started/nextjs)
- [Hono Examples - nextjs-stack](https://github.com/honojs/examples/tree/main/nextjs-stack)
- [Next.js App Router API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [hono/vercel Adapter](https://hono.dev/docs/helpers/adapter#vercel-adapter)
