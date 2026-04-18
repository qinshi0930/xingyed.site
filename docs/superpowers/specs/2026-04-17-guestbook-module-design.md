# Guestbook 模块设计文档

**创建日期**: 2026-04-17  
**状态**: 待审核  
**作者**: AI Assistant

---

## 概述

重新实现 Guestbook（留言板）模块，使用 Supabase 替代原有的 Firebase 方案，提供实时留言功能。用户需通过 GitHub OAuth 登录后方可留言，支持创建、编辑和删除自己的留言。

---

## 需求规格

### 功能需求

1. **留言功能**
   - 用户可以创建留言
   - 用户可以编辑自己的留言
   - 用户可以删除自己的留言
   - 留言实时显示（无需刷新页面）

2. **认证要求**
   - 使用现有的 better-auth GitHub OAuth
   - 未登录用户可以看到留言但无法操作
   - 无需审核，留言立即显示

3. **用户体验**
   - 独立页面 `/guestbook`
   - 表单始终显示，未登录时输入框禁用
   - 登录/提交按钮位置一致（右侧）
   - Toast 通知反馈操作结果

### 非功能需求

1. **性能**: 页面加载时间 < 2s
2. **实时性**: 新留言推送延迟 < 1s
3. **安全性**: RLS + API 层双重验证
4. **成本**: Supabase 免费额度内

---

## 架构设计

### 技术方案

**混合架构**: Supabase Client + Hono API

- **读取路径**: 前端直接使用 Supabase Client + Realtime 订阅
- **写入路径**: 通过 Hono API (`/api/guestbook`) → Supabase Server Client

### 架构图

```
┌─────────────────────────────────────────────────┐
│                  /guestbook 页面                  │
│  ┌──────────────────────────────────────────┐   │
│  │  GuestbookPage (客户端组件)                │   │
│  │  ├─ MessageForm (留言表单)                │   │
│  │  └─ MessageList (留言列表)                │   │
│  │     ├─ MessageItem (单条留言)             │   │
│  │     └─ RealtimeListener (实时订阅)        │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                    ↓                    ↑
        写入 (POST) |                    | 读取 (实时订阅)
                    |                    |
┌───────────────────┴─────────┐  ┌───────┴──────────────┐
│  Hono API                   │  │  Supabase Client      │
│  /api/guestbook             │  │  (前端，匿名 key)      │
│  ├─ POST: 创建留言           │  │  ├─ Realtime 订阅      │
│  ├─ PUT: 更新留言            │  │  └─ RLS 策略保护       │
│  └─ DELETE: 删除留言         │  │                       │
└───────────┬─────────────────┘  └───────┬──────────────┘
            ↓                            ↓
    ┌───────────────────────────────────────────┐
    │         Supabase Server Client             │
    │         (服务端，service_role key)          │
    └───────────┬───────────────────────────────┘
                ↓
    ┌───────────────────────────────────────────┐
    │         Supabase PostgreSQL                │
    │         ├─ user (better-auth)              │
    │         ├─ session (better-auth)           │
    │         ├─ account (better-auth)           │
    │         └─ guestbook_messages               │
    └───────────────────────────────────────────┘
```

### 技术选型理由

1. **Supabase PostgreSQL**: 统一数据库，同时服务 better-auth 和 Guestbook
2. **Supabase Realtime**: 原生实时订阅，无需自建 WebSocket
3. **Hono API**: 保持项目架构一致性，服务端验证保证安全
4. **Drizzle ORM**: better-auth 官方支持，与 PostgreSQL 完美集成

---

## 数据库设计

### better-auth 相关表

```sql
-- 用户表
CREATE TABLE "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  image TEXT,
  username TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 会话表
CREATE TABLE "session" (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES "user"(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- OAuth 账户表
CREATE TABLE "account" (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES "user"(id),
  provider_id TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Guestbook 表

```sql
-- 留言表
CREATE TABLE guestbook_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id),
  user_name TEXT NOT NULL,
  user_image TEXT,
  github_username TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_guestbook_created_at ON guestbook_messages(created_at DESC);
CREATE INDEX idx_guestbook_user_id ON guestbook_messages(user_id);
```

### Row Level Security (RLS) 策略

```sql
ALTER TABLE guestbook_messages ENABLE ROW LEVEL SECURITY;

-- 所有人可以读取留言
CREATE POLICY "任何人都可以查看留言"
ON guestbook_messages FOR SELECT
USING (true);

-- 认证用户可以创建留言
CREATE POLICY "认证用户可以创建留言"
ON guestbook_messages FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 用户只能更新自己的留言
CREATE POLICY "用户只能更新自己的留言"
ON guestbook_messages FOR UPDATE
USING (user_id = auth.uid());

-- 用户只能删除自己的留言
CREATE POLICY "用户只能删除自己的留言"
ON guestbook_messages FOR DELETE
USING (user_id = auth.uid());
```

---

## API 设计

### 端点列表

| 方法   | 路径                 | 描述     | 认证        |
| ------ | -------------------- | -------- | ----------- |
| POST   | `/api/guestbook`     | 创建留言 | 需要        |
| PUT    | `/api/guestbook/:id` | 更新留言 | 需要 + 作者 |
| DELETE | `/api/guestbook/:id` | 删除留言 | 需要 + 作者 |

### POST /api/guestbook

**请求**:

```http
POST /api/guestbook
Content-Type: application/json
Cookie: better-auth.session_token=xxx

{
  "message": "这是一条留言"
}
```

**响应** (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "user_id",
    "user_name": "John Doe",
    "user_image": "https://avatars.githubusercontent.com/u/xxx",
    "github_username": "johndoe",
    "content": "这是一条留言",
    "created_at": "2026-04-17T10:30:00Z",
    "updated_at": "2026-04-17T10:30:00Z"
  }
}
```

**错误响应**:

- 401: `{ "success": false, "error": "Unauthorized: GitHub login required" }`
- 400: `{ "success": false, "error": "Message is required" }`

### PUT /api/guestbook/:id

**请求**:

```http
PUT /api/guestbook/:id
Content-Type: application/json
Cookie: better-auth.session_token=xxx

{
  "message": "更新后的留言"
}
```

**响应** (200):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "更新后的留言",
    "updated_at": "2026-04-17T11:00:00Z"
  }
}
```

**错误响应**:

- 403: `{ "success": false, "error": "Forbidden: You can only edit your own messages" }`
- 404: `{ "success": false, "error": "Message not found" }`

### DELETE /api/guestbook/:id

**请求**:

```http
DELETE /api/guestbook/:id
Cookie: better-auth.session_token=xxx
```

**响应** (200):

```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

### 权限验证逻辑

```typescript
// 更新/删除时验证作者身份
const { data: message } = await supabaseServerClient
  .from("guestbook_messages")
  .select("user_id")
  .eq("id", messageId)
  .single();

if (message.user_id !== user.id) {
  return c.json(
    {
      success: false,
      error: "Forbidden: You can only edit/delete your own messages",
    },
    403,
  );
}
```

---

## 组件设计

### 文件结构

```
apps/app/src/
├── modules/guestbook/
│   ├── index.tsx                    # Guestbook 模块入口
│   ├── api.ts                       # Hono API 路由
│   └── components/
│       ├── MessageForm.tsx          # 留言表单
│       ├── MessageList.tsx          # 留言列表
│       ├── MessageItem.tsx          # 单条留言
│       └── RealtimeListener.tsx     # Realtime 订阅
│
├── common/libs/
│   ├── supabase-client.ts           # Supabase 客户端（前端）
│   ├── supabase-server.ts           # Supabase 服务端客户端
│   └── supabase-drizzle.ts          # Drizzle ORM 配置
│
├── common/types/
│   └── guestbook.ts                 # 类型定义
│
└── app/(page)/guestbook/
    └── page.tsx                     # 路由页面
```

### MessageForm.tsx

**布局**: 垂直布局，文本框在上，控制区在下

**未登录状态**:

```
┌─────────────────────────────────────────┐
│ [文本框 - 禁用]                          │
│ placeholder: "登录后即可留言"             │
│                                         │
│                    [🔐 使用 GitHub 登录] │
└─────────────────────────────────────────┘
```

**已登录状态**:

```
┌─────────────────────────────────────────┐
│ [文本框 - 可输入]                        │
│ placeholder: "写下你的留言..."            │
│                                         │
│ [头像] @username    [提交留言]           │
└─────────────────────────────────────────┘
```

**关键实现**:

```typescript
const MessageForm = () => {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-4">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={session ? "写下你的留言..." : "登录后即可留言"}
        disabled={!session}
        rows={4}
      />

      <div className="flex items-center justify-between">
        {session && (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session.user.image || ""} />
              <AvatarFallback>{session.user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              @{session.user.username || session.user.name}
            </span>
          </div>
        )}

        {session ? (
          <Button onClick={handleSubmit} disabled={!message.trim()}>
            提交留言
          </Button>
        ) : (
          <Button onClick={handleLogin}>
            <GithubIcon className="mr-2 h-4 w-4" />
            使用 GitHub 登录
          </Button>
        )}
      </div>
    </div>
  );
};
```

### MessageItem.tsx

**功能**:

- 显示用户头像、用户名、留言内容、时间
- 作者显示编辑/删除按钮
- 支持内联编辑模式

### RealtimeListener.tsx

**功能**:

- 订阅 `guestbook_messages` 表的 INSERT 事件
- 新留言自动添加到列表顶部
- 显示 "新留言" 动画效果

---

## 认证集成

### better-auth 配置

```typescript
// apps/app/src/common/libs/auth.ts
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/common/libs/supabase-drizzle";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  plugins: [
    nextCookies(),
    username({ minUsernameLength: 8, maxUsernameLength: 32 }),
  ],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
});
```

### Session 验证中间件

```typescript
// apps/app/src/api/middleware/auth.ts
import { auth } from "@/common/libs/auth";
import { createMiddleware } from "hono/factory";

export const authMiddleware = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session || !session.user) {
    return c.json(
      { success: false, error: "Unauthorized: GitHub login required" },
      401,
    );
  }

  c.set("user", {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    githubUsername: session.user.username,
  });

  await next();
});
```

---

## Supabase 集成

### 客户端配置

```typescript
// apps/app/src/common/libs/supabase-client.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
```

### 服务端客户端

```typescript
// apps/app/src/common/libs/supabase-server.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseServerClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
```

### Drizzle 配置

```typescript
// apps/app/src/common/libs/supabase-drizzle.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

export const db = drizzle(client);
```

---

## 环境变量

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
DATABASE_URL=postgresql://xxx:xxx@xxx.supabase.co:5432/postgres

# Better Auth GitHub OAuth
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
BETTER_AUTH_URL=http://localhost:3000
```

---

## 错误处理

### 前端错误处理

```typescript
const handleSubmit = async () => {
  try {
    const response = await fetch("/api/guestbook", {
      method: "POST",
      body: JSON.stringify({ message }),
    });

    const result = await response.json();

    if (!result.success) {
      toast.error(result.error || "提交失败");
      return;
    }

    toast.success("留言成功！");
    setMessage("");
  } catch (error) {
    toast.error("网络错误，请稍后重试");
  }
};
```

### 后端错误处理

```typescript
guestbookRoute.onError((err, c) => {
  console.error("Guestbook API Error:", err);

  if (err instanceof ZodError) {
    return c.json({ success: false, error: "Validation failed" }, 400);
  }

  return c.json({ success: false, error: "Internal server error" }, 500);
});
```

---

## 数据流

1. 用户访问 `/guestbook`
2. 检查 better-auth session
3. Supabase Client 订阅 `guestbook_messages` 表（Realtime）
4. 初始加载：从 Supabase 获取现有留言列表
5. 用户操作：
   - **未登录** → 点击 "使用 GitHub 登录" → better-auth OAuth 流程
   - **已登录** → 输入留言 → 点击 "提交留言"
     - POST `/api/guestbook` → 验证 session → Supabase Server Client 插入
     - Realtime 推送 → 所有在线用户自动看到新留言
   - **编辑留言** → PUT `/api/guestbook/:id` → 验证作者 → 更新
   - **删除留言** → DELETE `/api/guestbook/:id` → 验证作者 → 删除

---

## 测试策略

### 手动测试清单

- [ ] 未登录用户无法留言
- [ ] GitHub 登录后可以留言
- [ ] 留言实时显示（Realtime）
- [ ] 用户可以编辑自己的留言
- [ ] 用户无法编辑他人的留言
- [ ] 用户可以删除自己的留言
- [ ] 删除操作有确认提示
- [ ] 错误情况显示 Toast 提示
- [ ] 响应式设计在移动端正常显示

---

## 部署考虑

### Supabase 设置

1. 创建 Supabase 项目
2. 运行数据库迁移（创建表）
3. 配置 RLS 策略
4. 启用 Realtime（`guestbook_messages` 表）
5. 获取 API Keys

### 环境变量配置

在生产环境（Vercel/Docker）中配置所有必需的环境变量。

### 性能优化

- 使用 Supabase 连接池
- 留言列表分页加载（如需要）
- 图片使用 Next.js Image 组件优化

---

## 未来扩展

1. **留言分页**: 当留言数量增多时添加分页或无限滚动
2. **点赞功能**: 用户可以为留言点赞
3. **回复功能**: 支持对留言的回复（嵌套评论）
4. **管理员功能**: 管理员可以删除任何留言
5. **邮件通知**: 收到新留言时邮件通知管理员
6. **表情支持**: 留言支持 emoji 表情

---

## 风险评估

| 风险                          | 影响 | 概率 | 缓解措施                             |
| ----------------------------- | ---- | ---- | ------------------------------------ |
| Supabase 服务中断             | 高   | 低   | Supabase 有 SLA 保障，降级为只读模式 |
| Realtime 连接失败             | 中   | 低   | 降级为手动刷新                       |
| RLS 配置错误                  | 高   | 中   | 仔细测试 RLS 策略                    |
| better-auth 与 Drizzle 兼容性 | 中   | 低   | 使用官方支持的版本                   |

---

## 总结

Guestbook 模块采用 Supabase + Hono 混合架构，利用 Supabase Realtime 实现实时留言功能，通过 better-auth GitHub OAuth 保证用户可信度。设计简洁、安全、可扩展，符合个人博客的需求定位。
