# Plan: 抽 `apiFetch` 统一处理 401 / 403 / 网络错误

- **spec**: [2026-05-19-api-fetch-unify-design.md](./../specs/2026-05-19-api-fetch-unify-design.md)
- **issue**: closes #50
- **分支**: `refactor/api-fetch-unify`
- **PR 标题**: `refactor(libs): 抽 apiFetch 统一处理 401 与错误响应 (closes #50)`

## Task 序列

### Task 1：建分支

```bash
git switch -c refactor/api-fetch-unify
```

### Task 2：新增 `apiFetch` 工具

**文件**：[apps/app/src/common/libs/api-fetch.ts](file:///home/xingye/workspace/xingyed.site/apps/app/src/common/libs/api-fetch.ts)

骨架：

```ts
import { toast } from "sonner";

import { signOut } from "@/common/libs/auth-client";

interface ApiErrorBody {
  success?: boolean;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorBody | null,
  ) {
    super(body?.error ?? `API error ${status}`);
    this.name = "ApiError";
  }
}

interface ApiFetchOptions extends RequestInit {
  defaultErrorMessage?: string;
  silent?: boolean;
}

export async function apiFetch<T = unknown>(
  input: RequestInfo | URL,
  options: ApiFetchOptions = {},
): Promise<T> {
  const {
    defaultErrorMessage = "请求失败",
    silent,
    headers,
    ...init
  } = options;
  // ...实现见 spec §3.3
}
```

要点：

- `init.body` 存在时自动注入 `Content-Type: application/json`，调用点显式 headers 优先
- `response.json()` 用 try/catch 包裹（兼容 204/HTML 错误页）
- 401 分支：`if (!silent) toast.warning(...)` + `void signOut().catch(() => undefined)`
- 优先返回 `body.data ?? body`（兼容 DELETE 仅返 message 的场景）

### Task 3：改造 `MessageForm.handleSubmit`

**文件**：[apps/app/src/modules/guestbook/components/MessageForm.tsx](file:///home/xingye/workspace/xingyed.site/apps/app/src/modules/guestbook/components/MessageForm.tsx)

- 删除 `import type { ApiResponse }`（不再需要）
- 新增 `import { apiFetch } from "@/common/libs/api-fetch"`
- `handleSubmit` 内 fetch + json + result.success 判断 → 单行 `await apiFetch(...)`
- catch 块清空（不再 toast，apiFetch 已处理）
- `setIsSubmitting(false)` 仍走 `finally`

**保留**：`handleLogin` 内 `/api/auth/github/status` 不动（不在范围）。

### Task 4：改造 `MessageItem.handleUpdate` / `handleConfirmDelete`

**文件**：[apps/app/src/modules/guestbook/components/MessageItem.tsx](file:///home/xingye/workspace/xingyed.site/apps/app/src/modules/guestbook/components/MessageItem.tsx)

- 删除 `import type { ApiResponse }`
- 新增 `import { apiFetch } from "@/common/libs/api-fetch"`
- handleUpdate / handleConfirmDelete 同 Task 3 模板改造
- 注意：DELETE 无 body，调用 `apiFetch("/api/guestbook/" + id, { method: "DELETE", defaultErrorMessage: "删除失败" })` 即可

### Task 5：验证

```bash
cd apps/app && bun x tsc --noEmit
cd /home/xingye/workspace/xingyed.site && bun run lint
bun run build
```

预期：tsc 0 错误；lint 0 错 0 警；build 通过。

### Task 6：Commit 拆分（3 个）

1. `docs(plans): 添加 apiFetch 抽离 spec 与 plan`
   - `docs/superpowers/specs/2026-05-19-api-fetch-unify-design.md`
   - `docs/superpowers/plans/2026-05-19-api-fetch-unify.md`

2. `refactor(libs): 新增 apiFetch 统一 401/403/网络错误处理`
   - `apps/app/src/common/libs/api-fetch.ts`

3. `refactor(guestbook): 三处 fetch 调用迁移到 apiFetch (closes #50)`
   - `apps/app/src/modules/guestbook/components/MessageForm.tsx`
   - `apps/app/src/modules/guestbook/components/MessageItem.tsx`

### Task 7：Push + PR + Merge

```bash
git push -u origin refactor/api-fetch-unify
gh pr create --title "..." --body-file <body> --base main
# 等 CI 全绿
gh pr merge <num> --squash --delete-branch
```

## 烟雾测试场景（手动）

| 场景          | 操作                                 | 预期                                      |
| ------------- | ------------------------------------ | ----------------------------------------- |
| 网络错误      | DevTools 切 Offline → 提交           | toast.error 网络错误                      |
| 鉴权过期      | 删 cookie → 提交                     | toast.warning 登录已过期 + 表单切未登录态 |
| 权限不足      | DevTools 改 PUT URL 的 id 为他人留言 | toast.error 权限不足                      |
| 正常提交      | 登录后写一条新留言                   | toast.success + 列表刷新                  |
| 正常更新/删除 | 操作自己的留言                       | toast.success                             |

## 风险与回滚

- **风险**：apiFetch 自动 `Content-Type` 与某些场景冲突
  - **缓解**：仅在 `init.body` 存在时注入，且调用点 headers 优先级更高
- **回滚**：单 PR 单功能，`gh pr revert` 即可
