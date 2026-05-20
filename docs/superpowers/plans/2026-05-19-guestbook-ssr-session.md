# Guestbook SSR 预取 session - 实施计划

- 日期：2026-05-19
- 关联 Spec：[2026-05-19-guestbook-ssr-session-design.md](../specs/2026-05-19-guestbook-ssr-session-design.md)
- 关联 Issue：closes #49
- 分支：`fix/guestbook-ssr-session`
- 基于：`main`（PR #48 + PR #54 已合并）

## 0. 总览

按"由外到内"的依赖顺序串行实施 4 个文件改动，分 3 个 commit（docs / 新增 Context / 主体改动）。

**完成判定**：

- 3 个 commit 入 PR
- pre-commit + pre-push 全绿
- tsc + lint + build 全绿
- PR 描述链接 closes #49 + spec/plan 文档
- 合并后验证

## 1. 任务序列（严格串行 - 后步依赖前步类型）

### Task 1：创建分支

```bash
git checkout main && git pull origin main
git checkout -b fix/guestbook-ssr-session
```

### Task 2：新增 Context 文件（依赖最少，先建）

**文件**：`apps/app/src/modules/guestbook/context/InitialSessionContext.tsx`（新建）

```tsx
"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { auth } from "@/api/auth";

export type InitialSession = Awaited<ReturnType<typeof auth.api.getSession>>;

const InitialSessionContext = createContext<InitialSession>(null);

interface ProviderProps {
  value: InitialSession;
  children: ReactNode;
}

export const InitialSessionProvider = ({ value, children }: ProviderProps) => (
  <InitialSessionContext.Provider value={value}>
    {children}
  </InitialSessionContext.Provider>
);

export const useInitialSession = () => useContext(InitialSessionContext);
```

**类型验证**：单独跑 `bun x tsc --noEmit`，确保 InitialSession 类型推断正确。

### Task 3：改 page.tsx 为 async Server Component 预取 session

**文件**：`apps/app/src/app/(page)/guestbook/page.tsx`

```tsx
import type { Metadata } from "next";
import { headers } from "next/headers";

import { auth } from "@/api/auth";
import Container from "@/common/components/elements/Container";
import Guestbook from "@/modules/guestbook";

const PAGE_TITLE = "Guestbook";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} - Adam`,
  description: "留下你的想法，与其他访客交流",
};

const GuestbookPage = async () => {
  // SSR 预取 session：失败兜底 null，降级为客户端拉取
  const initialSession = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);

  return (
    <Container data-aos="fade-up">
      <Guestbook initialSession={initialSession} />
    </Container>
  );
};

export default GuestbookPage;
```

### Task 4：改 Guestbook 组件接收 prop + Provider 包装

**文件**：`apps/app/src/modules/guestbook/index.tsx`

```tsx
"use client";

import { useCallback, useState } from "react";

import {
  InitialSessionProvider,
  type InitialSession,
} from "./context/InitialSessionContext";
import { MessageForm } from "./components/MessageForm";
import { MessageList } from "./components/MessageList";
import { RealtimeListener } from "./components/RealtimeListener";

interface GuestbookProps {
  initialSession: InitialSession;
}

const Guestbook = ({ initialSession }: GuestbookProps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleNewMessage = useCallback(() => setRefreshKey((p) => p + 1), []);

  return (
    <InitialSessionProvider value={initialSession}>
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
    </InitialSessionProvider>
  );
};

export default Guestbook;
```

### Task 5：改 MessageForm.tsx 消费 SSR session

**文件**：`apps/app/src/modules/guestbook/components/MessageForm.tsx`

**改动点**：

1. import `useInitialSession`
2. 在 `useSession` 之后追加 `const initialSession = useInitialSession()`
3. 新增 `displaySession` / `displayPending`：
   ```ts
   const displaySession = session ?? initialSession;
   const displayPending = isPending && !initialSession;
   ```
4. 替换原 JSX 中所有 `session` 渲染分支 → `displaySession`
5. 替换原 JSX 中所有 `isPending` → `displayPending`
6. 既有的 useEffect 副作用（依赖 `session`）保持不变，因为它们关心的是"客户端 useSession 是否更新"，不应被 SSR 数据影响

**精度**：useEffect 的依赖项保留 `session`（实时态），不切换到 displaySession，否则会破坏登录/登出检测。

### Task 6：验证（verification-before-completion）

按下列顺序，每一步通过才能进入下一步：

```bash
export PATH="$HOME/.bun/bin:/usr/local/bin:/usr/bin:$PATH"
cd apps/app

bun x tsc --noEmit          # 类型
bun run lint                 # ESLint 0 错 0 警
bun run build                # 生产构建
```

### Task 7：Commit + push + PR

**Commit 拆分**（3 个）：

1. `docs(plans): 添加 guestbook SSR 预取 session spec 与 plan`
2. `feat(guestbook): 新增 InitialSessionContext 用于注入 SSR 预取 session`
3. `feat(guestbook): page 改 async 预取 session 消除 hydration 闪烁 (closes #49)`

**为什么拆 3 个 commit**：

- docs 单独：不影响代码可独立 revert
- Context 单独：纯新增文件，被 Task 5 消费
- 主体改动放最后：体现"page + module + form"协同的核心改动

**PR 标题**：`feat(guestbook): SSR 预取 session 消除 hydration 闪烁 (closes #49)`

### Task 8：合并

PR CI 通过后立即 squash merge + delete branch（参照 PR #54 流程）。

## 2. 风险与缓解

| 风险                                         | 缓解                                                          |
| -------------------------------------------- | ------------------------------------------------------------- |
| `auth.api.getSession` 在 Edge runtime 不可用 | 项目 next.config 默认 Node runtime；Drizzle adapter 必须 Node |
| Next.js 15 `headers()` async 类型            | TS 编译会强制 await，错了 tsc 立报                            |
| Context 文件 .tsx 后缀（含 JSX）vs .ts       | 选 .tsx 以承载 Provider JSX                                   |
| MessageForm 中 useEffect 依赖切换错误        | 严格保留依赖 `session`（实时），渲染层才用 displaySession     |
| PR #54 isLoggingIn 兜底逻辑被破坏            | 不动 isLoggingIn 相关 useEffect                               |

## 3. 不做的事

- 不改 `MessageList.tsx`（不需要 session）
- 不改 `auth.ts` / `auth-client.ts`
- 不抽 apiFetch（属于 #50）
- 不动 Supabase 查询（属于 #51）
- 不引入测试框架
