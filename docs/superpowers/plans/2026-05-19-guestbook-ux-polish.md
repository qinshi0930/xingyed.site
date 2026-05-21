# Guestbook 体验打磨实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 guestbook 模块增加无限滚动分页、Optimistic Update、骨架屏、相对时间四项体验增强。

**Architecture:** 将 messages 状态从 MessageList 提升到 Guestbook 容器，使 MessageList 成为纯展示组件。Guestbook 统一管理分页加载、Optimistic 流程和 Realtime 去重。

**Tech Stack:** React 19, usehooks-ts (useIntersectionObserver), dayjs (relativeTime plugin, already loaded), shadcn/ui Tooltip + Skeleton

---

## Task 1: 扩展类型定义

**Files:**

- Modify: `apps/app/src/common/types/guestbook.ts`

- [ ] **Step 1: 添加 OptimisticGuestbookMessage 类型**

```ts
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

/** 带乐观更新标记的留言类型 */
export interface OptimisticGuestbookMessage extends GuestbookMessage {
  _optimistic?: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

- [ ] **Step 2: 验证类型**

Run: `cd /home/xingye/workspace/xingyed.site/apps/app && bun x tsc --noEmit`
Expected: PASS

---

## Task 2: 创建 MessageItemSkeleton 组件

**Files:**

- Create: `apps/app/src/modules/guestbook/components/MessageItemSkeleton.tsx`

- [ ] **Step 1: 创建骨架屏组件**

```tsx
import { Skeleton } from "@/common/components/shadcn/ui/skeleton";

export const MessageItemSkeleton = () => (
  <div className="flex gap-3 p-4 border rounded-lg bg-card">
    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);
```

- [ ] **Step 2: 验证类型**

Run: `cd /home/xingye/workspace/xingyed.site/apps/app && bun x tsc --noEmit`
Expected: PASS

---

## Task 3: 重写 Guestbook 主容器（状态提升 + 分页 + Optimistic）

**Files:**

- Modify: `apps/app/src/modules/guestbook/index.tsx`

- [ ] **Step 1: 重写 index.tsx**

完整内容见实现阶段。核心要点：

- `messages` + `total` + `isLoadingInitial` + `isLoadingMore` 状态
- `PAGE_SIZE = 20`
- `loadMessages(offset)` 函数：调用 `apiFetch<ListResponse>("/api/guestbook?limit=20&offset=N")`
- `loadMore()`: offset = messages.length, append 结果
- `hasMore` = messages.length < total
- `handleOptimisticAdd(tempMsg)`: prepend 临时消息
- `handleOptimisticConfirm(tempId, realMsg)`: 替换临时消息
- `handleOptimisticRevert(tempId)`: 移除临时消息
- `handleRealtimeInsert(newMsg)`: 检查 id 是否已存在，不存在则 prepend + toast
- 传递 props 给子组件

- [ ] **Step 2: 验证类型**

Run: `cd /home/xingye/workspace/xingyed.site/apps/app && bun x tsc --noEmit`
Expected: PASS（可能有子组件 props 不匹配的错误，在后续 Task 中修复）

---

## Task 4: 重写 MessageList（纯展示 + sentinel + skeleton）

**Files:**

- Modify: `apps/app/src/modules/guestbook/components/MessageList.tsx`

- [ ] **Step 1: 重写为纯展示组件**

核心要点：

- Props: `messages`, `isLoadingInitial`, `isLoadingMore`, `hasMore`, `loadMore`, `onUpdate`, `onDelete`
- 初始加载时显示 5 个 `MessageItemSkeleton`
- 列表末尾放 sentinel div + `useIntersectionObserver`
- intersection entry `isIntersecting && hasMore && !isLoadingMore` 时触发 `loadMore()`
- 加载更多时底部显示 2 个 skeleton

- [ ] **Step 2: 验证类型**

Run: `cd /home/xingye/workspace/xingyed.site/apps/app && bun x tsc --noEmit`
Expected: PASS

---

## Task 5: 修改 MessageItem（相对时间 + Optimistic 样式）

**Files:**

- Modify: `apps/app/src/modules/guestbook/components/MessageItem.tsx`

- [ ] **Step 1: 替换时间格式化为相对时间 + Tooltip**

修改 import：

- 删除 `import dayjs from "dayjs"`
- 添加 `import { formatRelativeTime, formatDate } from "@/common/libs/utils/time"`
- 添加 shadcn Tooltip：`import { Tooltip, TooltipContent, TooltipTrigger } from "@/common/components/shadcn/ui/tooltip"`

修改 Props 类型：

- `message: GuestbookMessage` → `message: OptimisticGuestbookMessage`

修改时间渲染（L91-93）：

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <span className="text-xs text-muted-foreground cursor-default">
      {formatRelativeTime(message.created_at)}
    </span>
  </TooltipTrigger>
  <TooltipContent>
    {formatDate(message.created_at, "YYYY-MM-DD HH:mm:ss")}
  </TooltipContent>
</Tooltip>
```

添加 Optimistic 样式：

- 在外层 div 添加条件类名：`message._optimistic ? "opacity-60" : ""`

- [ ] **Step 2: 验证类型**

Run: `cd /home/xingye/workspace/xingyed.site/apps/app && bun x tsc --noEmit`
Expected: PASS

---

## Task 6: 修改 MessageForm（接入 Optimistic 回调）

**Files:**

- Modify: `apps/app/src/modules/guestbook/components/MessageForm.tsx`

- [ ] **Step 1: 修改 handleSubmit 为 Optimistic 流程**

新增 Props：

```ts
interface MessageFormProps {
  onOptimisticAdd: (msg: OptimisticGuestbookMessage) => void;
  onOptimisticConfirm: (tempId: string, realMsg: GuestbookMessage) => void;
  onOptimisticRevert: (tempId: string) => void;
}
```

修改 `handleSubmit`：

1. 构造临时消息（使用 session 中的用户信息 + `crypto.randomUUID()` 作为 id）
2. 调用 `onOptimisticAdd(tempMsg)`
3. 清空输入框
4. apiFetch POST 成功 → `onOptimisticConfirm(tempId, realData)`
5. apiFetch POST 失败 → `onOptimisticRevert(tempId)`

- [ ] **Step 2: 验证类型**

Run: `cd /home/xingye/workspace/xingyed.site/apps/app && bun x tsc --noEmit`
Expected: PASS

---

## Task 7: 修改 RealtimeListener（去重逻辑）

**Files:**

- Modify: `apps/app/src/modules/guestbook/components/RealtimeListener.tsx`

- [ ] **Step 1: 接入 onRealtimeInsert 回调**

Props 变更：

```ts
interface RealtimeListenerProps {
  onRealtimeInsert: (message: GuestbookMessage) => void;
}
```

在 `postgres_changes` 回调中：

- 直接调用 `onRealtimeInsert(payload.new as GuestbookMessage)`
- 去重逻辑和 toast 由 Guestbook 父组件处理

- [ ] **Step 2: 验证类型**

Run: `cd /home/xingye/workspace/xingyed.site/apps/app && bun x tsc --noEmit`
Expected: PASS

---

## Task 8: 全量验证

- [ ] **Step 1: TypeScript 类型检查**

Run: `cd /home/xingye/workspace/xingyed.site/apps/app && bun x tsc --noEmit`
Expected: 零错误

- [ ] **Step 2: ESLint**

Run: `cd /home/xingye/workspace/xingyed.site/apps/app && bun run lint`
Expected: 零错误

- [ ] **Step 3: 构建**

Run: `cd /home/xingye/workspace/xingyed.site/apps/app && bun run build`
Expected: 成功

- [ ] **Step 4: grep 验证无遗留**

```bash
# 确认 MessageList 不再自持 messages fetch
grep -n "useState.*GuestbookMessage" apps/app/src/modules/guestbook/components/MessageList.tsx
# 期望：无输出

# 确认 MessageItem 使用 formatRelativeTime
grep -n "formatRelativeTime" apps/app/src/modules/guestbook/components/MessageItem.tsx
# 期望：有输出

# 确认 Optimistic 类型被使用
grep -rn "OptimisticGuestbookMessage" apps/app/src/modules/guestbook/
# 期望：多处引用
```

---

## Task 9: 提交 + PR

- [ ] **Step 1: 建分支**

```bash
git switch -c feature/guestbook-ux-polish
```

- [ ] **Step 2: 提交**

```bash
git add .
git commit -m "feat(guestbook): 体验打磨增强（无限滚动/乐观更新/骨架屏/相对时间）"
```

- [ ] **Step 3: 推送 + 创建 PR**

```bash
git push -u origin feature/guestbook-ux-polish
gh pr create --title "feat(guestbook): 体验打磨增强" --body "..." --base main
```

- [ ] **Step 4: CI 通过后合并**

```bash
gh pr merge --squash --delete-branch
git switch main && git pull
```
