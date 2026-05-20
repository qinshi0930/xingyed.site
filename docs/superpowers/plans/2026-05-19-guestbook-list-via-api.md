# Plan: guestbook 列表查询改走 Hono API

- **spec**: [2026-05-19-guestbook-list-via-api-design.md](./../specs/2026-05-19-guestbook-list-via-api-design.md)
- **issue**: closes #51
- **分支**: `refactor/guestbook-list-via-api`
- **PR 标题**: `refactor(guestbook): 列表查询改走 Hono API 统一信任源 (closes #51)`

## Task 序列

### Task 1：建分支

```bash
git switch -c refactor/guestbook-list-via-api
```

### Task 2：后端新增 `GET /api/guestbook`

**文件**：[apps/app/src/api/routes/guestbook.ts](file:///home/xingye/workspace/xingyed.site/apps/app/src/api/routes/guestbook.ts)

- 在 `guestbookRoute.post(...)` 之前插入 `guestbookRoute.get("/", zValidator("query", ...), ...)`
- 用 `supabaseServerClient` + `.range(offset, offset+limit-1)` + `count: "exact"`
- 返回 `{ success: true, data: { items, total } }`
- **不加 authMiddleware**（列表公开）

### Task 3：前端 `MessageList` 改 `apiFetch`

**文件**：[apps/app/src/modules/guestbook/components/MessageList.tsx](file:///home/xingye/workspace/xingyed.site/apps/app/src/modules/guestbook/components/MessageList.tsx)

- 删除 `import { supabaseClient } from "@/common/libs/supabase-client"`
- 新增 `import { apiFetch } from "@/common/libs/api-fetch"`
- 就地定义 `interface ListResponse { items: GuestbookMessage[]; total: number }`（小范围，不污染 common/types）
- `loadMessages` 改为 `apiFetch<ListResponse>("/api/guestbook?limit=100")`
- catch 块清空（apiFetch 已 toast）

### Task 4：验证

```bash
cd /home/xingye/workspace/xingyed.site/apps/app && bun x tsc --noEmit && bun run lint && bun run build
```

**额外 grep 检查**：

```bash
grep -n "supabaseClient" apps/app/src/modules/guestbook/components/MessageList.tsx
# 期望：无输出
```

### Task 5：Commit 拆分（3 个）

1. `docs(plans): 添加 guestbook 列表查询走 API spec 与 plan`
2. `feat(api): 新增 GET /api/guestbook 列表接口支持分页`
3. `refactor(guestbook): MessageList 改走 Hono API 统一信任源 (closes #51)`

### Task 6：Push + PR + Merge

```bash
git push -u origin refactor/guestbook-list-via-api
gh pr create --title "..." --body-file <body> --base main
# 等 CI 全绿
gh pr merge <num> --squash --delete-branch
```

## 烟雾测试场景（手动）

| 场景         | 操作                                | 预期                                               |
| ------------ | ----------------------------------- | -------------------------------------------------- |
| 列表加载     | 打开 /guestbook                     | 正常加载，按 created_at desc 排序                  |
| Realtime     | 浏览器 A 提交留言 → 浏览器 B 观察   | B 弹"收到新留言"toast + 列表自动更新               |
| API 失败     | 后端停服后刷新页面                  | toast.error 提示                                   |
| Network 验证 | DevTools Network 看 /guestbook 请求 | 看到 GET /api/guestbook，无 supabase REST 列表请求 |

## 风险与回滚

- **风险**：Realtime 在 RLS 边界变化下行为意外
  - **缓解**：本 PR 不动 RLS，Realtime 链路完全不变
- **回滚**：单 PR `gh pr revert`
