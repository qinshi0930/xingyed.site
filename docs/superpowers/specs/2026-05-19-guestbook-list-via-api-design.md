# Spec: guestbook 列表查询改走 Hono API 统一信任源

- **issue**: closes [#51](https://github.com/qinshi0930/site/issues/51)
- **波次**: P1 第三波 · 子波次 3b
- **依赖**: ✅ #50 apiFetch 已合并（PR #56）
- **风险**: 中（涉及 Realtime 链路边界、RLS 与 anon key 用途变化）

## 1. 背景

guestbook 模块当前是**双信任源**架构：

| 操作     | 数据通道                                                       | 鉴权                 |
| -------- | -------------------------------------------------------------- | -------------------- |
| 列表查询 | `supabaseClient.from("guestbook_messages").select()`           | RLS anon SELECT 允许 |
| 写/改/删 | `/api/guestbook` Hono + `supabaseServerClient`（service_role） | Better Auth session  |
| Realtime | `supabaseClient.channel().on("postgres_changes")`              | RLS anon SELECT 允许 |

**问题**：

1. 列表与写删改分别走 anon key 和 service_role key，权限模型割裂
2. anon key 暴露在前端 bundle 中
3. 未来加分页 / 过滤 / 缓存只能在 Hono 层做，列表却走 Supabase，体验割裂

## 2. 关键约束（调研发现）

**Supabase Realtime（postgres_changes）受 RLS 控制**：anon 必须有 SELECT 权限才能收到事件。

→ 若按 issue 原描述「anon role 全拒」，**Realtime 同时失效**（[RealtimeListener.tsx](file:///home/xingye/workspace/xingyed.site/apps/app/src/modules/guestbook/components/RealtimeListener.tsx) 收不到 INSERT 通知 → 新留言需手动刷新）。

→ **取舍**：保留 RLS SELECT 允许 anon（仅作为 Realtime 心跳通道），但前端 `MessageList` 不再依赖该路径取数据 → 数据信任源统一到 Hono API。

## 3. 设计方案

### 3.1 后端：新增 `GET /api/guestbook`

```ts
const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

guestbookRoute.get("/", zValidator("query", listQuerySchema), async (c) => {
  const { limit, offset } = c.req.valid("query");

  const { data, error, count } = await supabaseServerClient
    .from("guestbook_messages")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Failed to list messages:", error);
    return c.json({ success: false, error: "Failed to list messages" }, 500);
  }

  return c.json({ success: true, data: { items: data, total: count ?? 0 } });
});
```

**取舍**：

- 继续用 `supabaseServerClient`（service_role）而非 Drizzle ORM：保持 snake_case 列名与 `GuestbookMessage` 类型一致，避免类型重写
- 不加 `authMiddleware`：列表本就是公开内容；与现状（anon SELECT）行为一致
- `count: "exact"` 为前端将来分页准备；当前 PR 不引入分页 UI

### 3.2 前端：`MessageList` 改 `apiFetch`

```ts
interface ListResponse {
  items: GuestbookMessage[];
  total: number;
}

const loadMessages = async () => {
  try {
    const result = await apiFetch<ListResponse>("/api/guestbook?limit=100");
    setMessages(result.items);
  } catch {
    // apiFetch 已弹 toast
  } finally {
    setLoading(false);
  }
};
```

- 删除 `import { supabaseClient } from "@/common/libs/supabase-client"`
- `limit=100` 覆盖现有需求（项目活跃留言量 < 50）；分页 UI 留作未来增强

### 3.3 Realtime：保留，仅作通知

[RealtimeListener.tsx](file:///home/xingye/workspace/xingyed.site/apps/app/src/modules/guestbook/components/RealtimeListener.tsx) **无需修改**——它本就只 toast + `onNewMessage()` 触发父组件 `loadMessages()`，不直接消费 payload。改造后 `loadMessages` 走 API 即可。

### 3.4 RLS 现状（不改）

[setup_RLS_guestbook_messages.sql](file:///home/xingye/workspace/xingyed.site/apps/app/src/api/db/sql/supabase/setup_RLS_guestbook_messages.sql) 已经：

- SELECT 允许所有人（保留，为 Realtime）
- INSERT/UPDATE/DELETE 对 anon + authenticated 全拒（已收紧）

→ 本 PR **不新增 RLS 迁移**。

## 4. 选型对比

| 方案                         | RLS 处理             | Realtime             | 前端 anon key       |
| ---------------------------- | -------------------- | -------------------- | ------------------- |
| A. 现状                      | 已 SELECT 允许       | ✅                   | 仍需                |
| **B. 推荐**                  | 现状不动；列表改 API | ✅ 保留              | 仍需（仅 Realtime） |
| C. anon 全拒 + 移除 Realtime | SELECT 全拒          | ❌ 需轮询或 SSE 重写 | 可移除              |

**选 B**：

- 满足 issue 核心诉求「列表走 Hono API 统一信任源」
- Realtime 体验不退化
- anon key 仍需保留（仅用于 Realtime channel），但不再用于业务数据查询
- 改动面最小，可独立合并

C 方案的 SSE 重写超出本 issue 范围，可作为后续技术债项。

## 5. 验收标准（对齐 issue #51）

| 标准                                                                 | 验证方式                  |
| -------------------------------------------------------------------- | ------------------------- |
| ① 直接用 anon key 调 `from("guestbook_messages").insert()` 被 RLS 拒 | 已是现状（验证通过即 OK） |
| ② 列表行为与现状一致（排序、Realtime 推送）                          | 浏览器烟雾测试            |
| ③ `MessageList` 不再 import `supabaseClient`                         | `grep` 验证               |
| ④ TypeScript 类型检查通过                                            | `bun x tsc --noEmit`      |
| ⑤ pre-commit / pre-push 全绿                                         | 钩子自动                  |

## 6. 不在范围

- 分页 UI（仅实现接口）
- 完全移除前端 `supabaseClient`（Realtime 仍需要）
- 移除 `NEXT_PUBLIC_SUPABASE_ANON_KEY`（同上）
- SSE / WebSocket 自建 Realtime 替代方案

## 7. 影响文件

- 修改：[apps/app/src/api/routes/guestbook.ts](file:///home/xingye/workspace/xingyed.site/apps/app/src/api/routes/guestbook.ts) 新增 GET `/`
- 修改：[apps/app/src/modules/guestbook/components/MessageList.tsx](file:///home/xingye/workspace/xingyed.site/apps/app/src/modules/guestbook/components/MessageList.tsx) 改 apiFetch
- 修改：[apps/app/src/common/types/guestbook.ts](file:///home/xingye/workspace/xingyed.site/apps/app/src/common/types/guestbook.ts) 新增 `ListResponse` 类型（可选，也可就地定义）
- 不改：[RealtimeListener.tsx](file:///home/xingye/workspace/xingyed.site/apps/app/src/modules/guestbook/components/RealtimeListener.tsx) / RLS SQL
