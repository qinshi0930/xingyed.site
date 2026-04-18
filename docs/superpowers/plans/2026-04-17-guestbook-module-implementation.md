# Guestbook 模块实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现基于 Supabase 的 Guestbook 留言板模块，支持实时留言、编辑、删除功能，使用 GitHub OAuth 认证

**Architecture:** 混合架构 - Supabase Client（前端实时读取）+ Hono API（服务端写入验证）+ better-auth（GitHub OAuth）

**Tech Stack:** Next.js 15, Supabase, better-auth, Hono, Drizzle ORM, Zustand, shadcn/ui

---

## 文件映射

### 新建文件

- `apps/app/src/common/libs/supabase-client.ts` - Supabase 前端客户端
- `apps/app/src/common/libs/supabase-server.ts` - Supabase 服务端客户端
- `apps/app/src/common/libs/supabase-drizzle.ts` - Drizzle ORM 配置
- `apps/app/src/common/types/guestbook.ts` - Guestbook 类型定义
- `apps/app/src/api/middleware/auth.ts` - 认证中间件
- `apps/app/src/api/routes/guestbook.ts` - Guestbook API 路由
- `apps/app/src/modules/guestbook/index.tsx` - Guestbook 模块入口
- `apps/app/src/modules/guestbook/api.ts` - API 路由注册
- `apps/app/src/modules/guestbook/components/MessageForm.tsx` - 留言表单
- `apps/app/src/modules/guestbook/components/MessageList.tsx` - 留言列表
- `apps/app/src/modules/guestbook/components/MessageItem.tsx` - 单条留言
- `apps/app/src/modules/guestbook/components/RealtimeListener.tsx` - Realtime 订阅
- `apps/app/src/app/(page)/guestbook/page.tsx` - Guestbook 页面

### 修改文件

- `apps/app/src/common/libs/auth.ts` - 添加 Drizzle 数据库适配器
- `apps/app/src/api/index.ts` - 注册 guestbook 路由
- `apps/app/src/common/constant/menu.tsx` - 添加 Guestbook 菜单项
- `apps/app/package.json` - 添加 Supabase 依赖
- `.env.example` - 添加 Supabase 环境变量
- `apps/app/.env.local` - 添加 Supabase 环境变量（实际值）

---

## Phase 1: 基础设施 - Supabase 集成

### Task 1: 安装 Supabase 依赖

**Files:**

- Modify: `apps/app/package.json`

- [ ] **Step 1: 安装 Supabase 相关依赖**

```bash
cd apps/app
bun add @supabase/supabase-js drizzle-orm postgres
bun add -d @types/pg
```

- [ ] **Step 2: 验证安装成功**

```bash
bun install
```

Expected: 无错误，依赖安装成功

- [ ] **Step 3: 提交**

```bash
git add package.json bun.lock
git commit -m "feat: 添加 Supabase 和 Drizzle ORM 依赖"
```

---

### Task 2: 创建 Supabase 客户端配置

**Files:**

- Create: `apps/app/src/common/libs/supabase-client.ts`
- Create: `apps/app/src/common/libs/supabase-server.ts`
- Create: `apps/app/src/common/libs/supabase-drizzle.ts`

- [ ] **Step 1: 创建 Supabase 前端客户端**

```typescript
// apps/app/src/common/libs/supabase-client.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 2: 创建 Supabase 服务端客户端**

```typescript
// apps/app/src/common/libs/supabase-server.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase service role key");
}

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

- [ ] **Step 3: 创建 Drizzle ORM 配置**

```typescript
// apps/app/src/common/libs/supabase-drizzle.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL environment variable");
}

const client = postgres(connectionString);

export const db = drizzle(client);
```

- [ ] **Step 4: 提交**

```bash
git add apps/app/src/common/libs/supabase-*.ts apps/app/src/common/libs/supabase-drizzle.ts
git commit -m "feat: 创建 Supabase 客户端和 Drizzle 配置"
```

---

### Task 3: 更新 better-auth 数据库配置

**Files:**

- Modify: `apps/app/src/common/libs/auth.ts`

- [ ] **Step 1: 更新 auth.ts 添加 Drizzle 适配器**

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

- [ ] **Step 2: 提交**

```bash
git add apps/app/src/common/libs/auth.ts
git commit -m "feat: 配置 better-auth 使用 Supabase PostgreSQL"
```

---

### Task 4: 添加环境变量配置

**Files:**

- Modify: `.env.example`
- Modify: `apps/app/.env.local` (仅本地，不提交)

- [ ] **Step 1: 更新 .env.example 添加 Supabase 配置**

```bash
# .env.example

# ============================================
# Supabase 配置（Guestbook + Auth）
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres
```

- [ ] **Step 2: 更新 .env.local 添加实际的 Supabase 凭据**

（您需要手动在 Supabase Dashboard 获取这些值）

- [ ] **Step 3: 提交**

```bash
git add .env.example
git commit -m "docs: 添加 Supabase 环境变量模板"
```

---

## Phase 2: API 层 - Hono 路由和中间件

### Task 5: 创建认证中间件

**Files:**

- Create: `apps/app/src/api/middleware/auth.ts`

- [ ] **Step 1: 创建认证中间件**

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

- [ ] **Step 2: 提交**

```bash
git add apps/app/src/api/middleware/auth.ts
git commit -m "feat: 创建 Guestbook 认证中间件"
```

---

### Task 6: 创建 Guestbook API 路由

**Files:**

- Create: `apps/app/src/api/routes/guestbook.ts`

- [ ] **Step 1: 创建 Guestbook API 路由**

```typescript
// apps/app/src/api/routes/guestbook.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { supabaseServerClient } from "@/common/libs/supabase-server";
import { authMiddleware } from "@/api/middleware/auth";

const guestbookRoute = new Hono();

// 创建留言
const createMessageSchema = z.object({
  message: z.string().min(1, "Message is required").max(1000),
});

guestbookRoute.post(
  "/",
  authMiddleware,
  zValidator("json", createMessageSchema),
  async (c) => {
    const user = c.get("user");
    const { message } = c.req.valid("json");

    const { data, error } = await supabaseServerClient
      .from("guestbook_messages")
      .insert({
        user_id: user.id,
        user_name: user.name,
        user_image: user.image,
        github_username: user.githubUsername,
        content: message.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create message:", error);
      return c.json({ success: false, error: "Failed to create message" }, 500);
    }

    return c.json({ success: true, data }, 201);
  },
);

// 更新留言
const updateMessageSchema = z.object({
  message: z.string().min(1, "Message is required").max(1000),
});

guestbookRoute.put(
  "/:id",
  authMiddleware,
  zValidator("json", updateMessageSchema),
  async (c) => {
    const user = c.get("user");
    const messageId = c.req.param("id");
    const { message } = c.req.valid("json");

    // 验证作者身份
    const { data: existingMessage } = await supabaseServerClient
      .from("guestbook_messages")
      .select("user_id")
      .eq("id", messageId)
      .single();

    if (!existingMessage) {
      return c.json({ success: false, error: "Message not found" }, 404);
    }

    if (existingMessage.user_id !== user.id) {
      return c.json(
        {
          success: false,
          error: "Forbidden: You can only edit your own messages",
        },
        403,
      );
    }

    const { data, error } = await supabaseServerClient
      .from("guestbook_messages")
      .update({ content: message.trim(), updated_at: new Date().toISOString() })
      .eq("id", messageId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update message:", error);
      return c.json({ success: false, error: "Failed to update message" }, 500);
    }

    return c.json({ success: true, data });
  },
);

// 删除留言
guestbookRoute.delete("/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const messageId = c.req.param("id");

  // 验证作者身份
  const { data: existingMessage } = await supabaseServerClient
    .from("guestbook_messages")
    .select("user_id")
    .eq("id", messageId)
    .single();

  if (!existingMessage) {
    return c.json({ success: false, error: "Message not found" }, 404);
  }

  if (existingMessage.user_id !== user.id) {
    return c.json(
      {
        success: false,
        error: "Forbidden: You can only delete your own messages",
      },
      403,
    );
  }

  const { error } = await supabaseServerClient
    .from("guestbook_messages")
    .delete()
    .eq("id", messageId);

  if (error) {
    console.error("Failed to delete message:", error);
    return c.json({ success: false, error: "Failed to delete message" }, 500);
  }

  return c.json({ success: true, message: "Message deleted successfully" });
});

export default guestbookRoute;
```

- [ ] **Step 2: 提交**

```bash
git add apps/app/src/api/routes/guestbook.ts
git commit -m "feat: 创建 Guestbook API 路由（POST/PUT/DELETE）"
```

---

### Task 7: 注册 Guestbook API 路由

**Files:**

- Modify: `apps/app/src/api/index.ts`

- [ ] **Step 1: 在 api/index.ts 中导入并注册 guestbook 路由**

找到现有的路由注册位置，添加：

```typescript
import guestbookRoute from "./routes/guestbook";

// ... 现有路由注册 ...
app.route("/guestbook", guestbookRoute);
```

- [ ] **Step 2: 提交**

```bash
git add apps/app/src/api/index.ts
git commit -m "feat: 注册 Guestbook API 路由"
```

---

## Phase 3: 前端组件 - Guestbook 模块

### Task 8: 创建类型定义

**Files:**

- Create: `apps/app/src/common/types/guestbook.ts`

- [ ] **Step 1: 创建 Guestbook 类型定义**

```typescript
// apps/app/src/common/types/guestbook.ts
export interface GuestbookMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_image?: string;
  github_username: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

- [ ] **Step 2: 提交**

```bash
git add apps/app/src/common/types/guestbook.ts
git commit -m "feat: 添加 Guestbook 类型定义"
```

---

### Task 9: 创建 MessageForm 组件

**Files:**

- Create: `apps/app/src/modules/guestbook/components/MessageForm.tsx`

- [ ] **Step 1: 创建 MessageForm 组件**

```typescript
// apps/app/src/modules/guestbook/components/MessageForm.tsx
"use client";

import { useState } from "react";
import { useSession, signIn } from "@/common/libs/auth-client";
import { Button } from "@/common/components/ui/button";
import { Textarea } from "@/common/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/common/components/ui/avatar";
import { GithubIcon } from "lucide-react";
import { toast } from "sonner";
import type { ApiResponse } from "@/common/types/guestbook";

export const MessageForm = () => {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        toast.error(result.error || "提交失败");
        return;
      }

      toast.success("留言成功！");
      setMessage("");
    } catch (error) {
      toast.error("网络错误，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = () => {
    signIn.github({
      callbackURL: "/guestbook",
    });
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={session ? "写下你的留言..." : "登录后即可留言"}
        disabled={!session}
        className={!session ? "bg-muted cursor-not-allowed" : ""}
        rows={4}
      />

      <div className="flex items-center justify-between">
        {session && (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
              <AvatarFallback>{session.user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              @{session.user.username || session.user.name}
            </span>
          </div>
        )}

        {session ? (
          <Button onClick={handleSubmit} disabled={!message.trim() || isSubmitting}>
            {isSubmitting ? "提交中..." : "提交留言"}
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

- [ ] **Step 2: 提交**

```bash
git add apps/app/src/modules/guestbook/components/MessageForm.tsx
git commit -m "feat: 创建 MessageForm 组件（支持登录/未登录状态）"
```

---

### Task 10: 创建 MessageItem 组件

**Files:**

- Create: `apps/app/src/modules/guestbook/components/MessageItem.tsx`

- [ ] **Step 1: 创建 MessageItem 组件**

```typescript
// apps/app/src/modules/guestbook/components/MessageItem.tsx
"use client";

import { useState } from "react";
import { useSession } from "@/common/libs/auth-client";
import { Button } from "@/common/components/ui/button";
import { Textarea } from "@/common/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/common/components/ui/avatar";
import { EditIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import type { GuestbookMessage, ApiResponse } from "@/common/types/guestbook";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

interface MessageItemProps {
  message: GuestbookMessage;
  onUpdate: () => void;
  onDelete: () => void;
}

export const MessageItem = ({ message, onUpdate, onDelete }: MessageItemProps) => {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isOwner = session?.user?.id === message.user_id;

  const handleUpdate = async () => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`/api/guestbook/${message.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: editContent.trim() }),
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        toast.error(result.error || "更新失败");
        return;
      }

      toast.success("更新成功！");
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast.error("网络错误，请稍后重试");
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这条留言吗？")) return;

    try {
      const response = await fetch(`/api/guestbook/${message.id}`, {
        method: "DELETE",
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        toast.error(result.error || "删除失败");
        return;
      }

      toast.success("删除成功！");
      onDelete();
    } catch (error) {
      toast.error("网络错误，请稍后重试");
    }
  };

  return (
    <div className="flex gap-3 p-4 border rounded-lg bg-card">
      <Avatar className="h-10 w-10">
        <AvatarImage src={message.user_image || ""} alt={message.user_name} />
        <AvatarFallback>{message.user_name.charAt(0)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">@{message.github_username}</span>
            <span className="text-xs text-muted-foreground">
              {dayjs(message.created_at).fromNow()}
            </span>
          </div>

          {isOwner && !isEditing && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <EditIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleUpdate}>
                保存
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(message.content);
                }}
              >
                取消
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm">{message.content}</p>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: 提交**

```bash
git add apps/app/src/modules/guestbook/components/MessageItem.tsx
git commit -m "feat: 创建 MessageItem 组件（支持编辑/删除）"
```

---

### Task 11: 创建 MessageList 组件

**Files:**

- Create: `apps/app/src/modules/guestbook/components/MessageList.tsx`

- [ ] **Step 1: 创建 MessageList 组件**

```typescript
// apps/app/src/modules/guestbook/components/MessageList.tsx
"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/common/libs/supabase-client";
import { MessageItem } from "./MessageItem";
import type { GuestbookMessage } from "@/common/types/guestbook";

interface MessageListProps {
  onNewMessage: () => void;
}

export const MessageList = ({ onNewMessage }: MessageListProps) => {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabaseClient
        .from("guestbook_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageUpdate = () => {
    loadMessages();
    onNewMessage();
  };

  const handleMessageDelete = () => {
    loadMessages();
    onNewMessage();
  };

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        暂无留言，成为第一个留言的人吧！
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onUpdate={handleMessageUpdate}
          onDelete={handleMessageDelete}
        />
      ))}
    </div>
  );
};
```

- [ ] **Step 2: 提交**

```bash
git add apps/app/src/modules/guestbook/components/MessageList.tsx
git commit -m "feat: 创建 MessageList 组件"
```

---

### Task 12: 创建 RealtimeListener 组件

**Files:**

- Create: `apps/app/src/modules/guestbook/components/RealtimeListener.tsx`

- [ ] **Step 1: 创建 RealtimeListener 组件**

```typescript
// apps/app/src/modules/guestbook/components/RealtimeListener.tsx
"use client";

import { useEffect } from "react";
import { supabaseClient } from "@/common/libs/supabase-client";
import { toast } from "sonner";

interface RealtimeListenerProps {
  onNewMessage: () => void;
}

export const RealtimeListener = ({ onNewMessage }: RealtimeListenerProps) => {
  useEffect(() => {
    const channel = supabaseClient
      .channel("guestbook-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "guestbook_messages",
        },
        (payload) => {
          console.log("New message received:", payload);
          toast.info("收到新留言！");
          onNewMessage();
        },
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [onNewMessage]);

  return null;
};
```

- [ ] **Step 2: 提交**

```bash
git add apps/app/src/modules/guestbook/components/RealtimeListener.tsx
git commit -m "feat: 创建 RealtimeListener 组件（Supabase Realtime 订阅）"
```

---

### Task 13: 创建 Guestbook 模块入口

**Files:**

- Create: `apps/app/src/modules/guestbook/index.tsx`

- [ ] **Step 1: 创建 Guestbook 模块入口**

```typescript
// apps/app/src/modules/guestbook/index.tsx
"use client";

import { useCallback, useState } from "react";
import { MessageForm } from "./components/MessageForm";
import { MessageList } from "./components/MessageList";
import { RealtimeListener } from "./components/RealtimeListener";

const Guestbook = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNewMessage = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">留言板</h1>
        <p className="text-muted-foreground">
          登录后即可留言，与其他访客交流
        </p>
      </div>

      <MessageForm />

      <RealtimeListener onNewMessage={handleNewMessage} />

      <MessageList key={refreshKey} onNewMessage={handleNewMessage} />
    </div>
  );
};

export default Guestbook;
```

- [ ] **Step 2: 提交**

```bash
git add apps/app/src/modules/guestbook/index.tsx
git commit -m "feat: 创建 Guestbook 模块入口"
```

---

### Task 14: 创建 Guestbook 页面

**Files:**

- Create: `apps/app/src/app/(page)/guestbook/page.tsx`

- [ ] **Step 1: 创建页面目录**

```bash
mkdir -p apps/app/src/app/\(page\)/guestbook
```

- [ ] **Step 2: 创建 Guestbook 页面**

```typescript
// apps/app/src/app/(page)/guestbook/page.tsx
import Container from "@/common/components/elements/Container";
import Guestbook from "@/modules/guestbook";

export const metadata = {
  title: "留言板 | 星夜",
  description: "留下你的想法，与其他访客交流",
};

const GuestbookPage = () => {
  return (
    <Container data-aos="fade-up">
      <Guestbook />
    </Container>
  );
};

export default GuestbookPage;
```

- [ ] **Step 3: 提交**

```bash
git add apps/app/src/app/\(page\)/guestbook/page.tsx
git commit -m "feat: 创建 Guestbook 页面路由"
```

---

## Phase 4: 集成和配置

### Task 15: 添加 Guestbook 菜单项

**Files:**

- Modify: `apps/app/src/common/constant/menu.tsx`

- [ ] **Step 1: 在菜单配置中添加 Guestbook**

找到合适的位置（建议在 Blog 之后），添加：

```typescript
{
  title: "Guestbook",
  href: "/guestbook",
  icon: <MessageSquareIcon size={iconSize} />,
  isShow: true,
  isExternal: false,
  eventName: "Pages: Guestbook",
  type: "Pages",
}
```

确保导入了 `MessageSquareIcon`（从 lucide-react 或 react-icons）

- [ ] **Step 2: 提交**

```bash
git add apps/app/src/common/constant/menu.tsx
git commit -m "feat: 添加 Guestbook 菜单项"
```

---

### Task 16: 创建数据库迁移脚本

**Files:**

- Create: `scripts/migrate-guestbook-db.sql`

- [ ] **Step 1: 创建 SQL 迁移脚本**

```sql
-- scripts/migrate-guestbook-db.sql

-- 创建 better-auth 相关表
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  image TEXT,
  username TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES "user"(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "account" (
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

-- 创建 Guestbook 表
CREATE TABLE IF NOT EXISTS guestbook_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id),
  user_name TEXT NOT NULL,
  user_image TEXT,
  github_username TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_guestbook_created_at ON guestbook_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guestbook_user_id ON guestbook_messages(user_id);

-- 启用 RLS
ALTER TABLE guestbook_messages ENABLE ROW LEVEL SECURITY;

-- RLS 策略
DROP POLICY IF EXISTS "任何人都可以查看留言" ON guestbook_messages;
CREATE POLICY "任何人都可以查看留言"
ON guestbook_messages FOR SELECT
USING (true);

DROP POLICY IF EXISTS "认证用户可以创建留言" ON guestbook_messages;
CREATE POLICY "认证用户可以创建留言"
ON guestbook_messages FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "用户只能更新自己的留言" ON guestbook_messages;
CREATE POLICY "用户只能更新自己的留言"
ON guestbook_messages FOR UPDATE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "用户只能删除自己的留言" ON guestbook_messages;
CREATE POLICY "用户只能删除自己的留言"
ON guestbook_messages FOR DELETE
USING (user_id = auth.uid());

-- 启用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE guestbook_messages;
```

- [ ] **Step 2: 提交**

```bash
git add scripts/migrate-guestbook-db.sql
git commit -m "feat: 添加 Guestbook 数据库迁移脚本"
```

---

## Phase 5: 测试和部署

### Task 17: 本地测试

- [ ] **Step 1: 在 Supabase Dashboard 运行迁移脚本**

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 运行 `scripts/migrate-guestbook-db.sql` 的内容
4. 验证表创建成功
5. 在 Settings → Database → Replication 中启用 `guestbook_messages` 表的 Realtime

- [ ] **Step 2: 配置环境变量**

在 `.env.local` 中配置：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres
```

- [ ] **Step 3: 启动开发服务器测试**

```bash
cd apps/app
bun run dev
```

访问 `http://localhost:3000/guestbook`

- [ ] **Step 4: 手动测试清单**

- [ ] 未登录用户可以看到留言但无法操作
- [ ] 点击 "使用 GitHub 登录" 可以成功登录
- [ ] 登录后可以提交留言
- [ ] 新留言实时显示（打开两个浏览器窗口测试）
- [ ] 可以编辑自己的留言
- [ ] 无法编辑他人的留言
- [ ] 可以删除自己的留言
- [ ] Toast 通知正常显示
- [ ] 响应式设计在移动端正常显示

- [ ] **Step 5: 提交**

```bash
git add .
git commit -m "test: Guestbook 模块本地测试通过"
```

---

### Task 18: 部署配置

- [ ] **Step 1: 在生产环境配置环境变量**

在 Vercel/Docker 环境中添加 Supabase 相关环境变量

- [ ] **Step 2: 构建测试**

```bash
bun run build
```

确保构建成功

- [ ] **Step 3: 提交最终代码**

```bash
git add .
git commit -m "feat: Guestbook 模块完成，准备部署"
```

---

## 执行检查清单

完成所有任务后，确认：

- [ ] 所有代码已提交
- [ ] 本地测试通过
- [ ] 环境变量已配置
- [ ] 数据库迁移已执行
- [ ] Realtime 已启用
- [ ] 菜单项已添加
- [ ] 响应式设计正常
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 错误

---

## 后续优化（可选）

这些功能不在当前范围内，可以在未来添加：

1. 留言分页/无限滚动
2. 点赞功能
3. 回复功能（嵌套评论）
4. 管理员删除任何留言
5. 邮件通知
6. 表情支持
