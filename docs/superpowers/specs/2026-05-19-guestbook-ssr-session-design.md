# Guestbook SSR 预取 session 消除 hydration 闪烁 - 设计文档

- 日期：2026-05-19
- 关联 Issue：[#49](https://github.com/qinshi0930/site/issues/49)
- 上游：PR #48 + PR #54（P1 第一波） → 本次为 P1 第二波

## 1. 背景

[`/guestbook` page](<file:///home/xingye/workspace/xingyed.site/apps/app/src/app/(page)/guestbook/page.tsx>) 当前是同步 Server Component，不预取 session。客户端 mount 后 `useSession` 才发起 `/api/auth/get-session` 请求，导致：

- 首屏 `isPending=true` → 渲染 Skeleton 占位
- 拿到 session 后切换为登录态 UI
- 视觉上能看见明显的"未登录 → 已登录"闪烁，特别在网络慢 / Supabase pooler 抖动时更明显
- 命中 Better Auth `cookieCache` 时延迟很短，但仍有 hydration cycle 开销

## 2. 调研结论

Better Auth 1.6.3 React client（[`session-atom.mjs`](file:///home/xingye/workspace/xingyed.site/node_modules/.bun/better-auth@1.6.3+c253229715cf09e0/node_modules/better-auth/dist/client/session-atom.mjs)、[`query.mjs`](file:///home/xingye/workspace/xingyed.site/node_modules/.bun/better-auth@1.6.3+c253229715cf09e0/node_modules/better-auth/dist/client/query.mjs)）：

- `useSession` 内部用 nanostores atom + `useAuthQuery`，初始硬编码 `isPending: true, data: null`
- **不暴露 `initialData` / `setSession` API**，无法直接注入 SSR 预取值
- atom 是 createAuthClient 实例私有的，不能从外部安全写入

服务端 `auth.api.getSession({ headers })` 是稳定 API，PR #48 已验证可用。

## 3. 方案选型

| 方案                            | 描述                                                                                                     | 取舍                                    |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **A. 改写 useSession**          | 包装一个自定义 `useSessionWithInitial` 替换全模块                                                        | 侵入大，未来 Better Auth 升级风险高     |
| **B. 私有 atom 注入**           | 直接写入 Better Auth 私有 atom                                                                           | 依赖私有 API，破坏性升级风险            |
| **C. 渐进增强 Context（选用）** | SSR 预取 → Context 注入 initialSession → 客户端组件 displaySession = useSession().data ?? initialSession | 零侵入、强类型、可扩展、易回滚          |
| **D. props 一路传**             | initialSession 用 prop 一直传到 MessageForm                                                              | 中间层冗余，将来 MessageList 也要时麻烦 |

**选 C**：用 React Context 在 Guestbook 客户端边界处一次注入，下游组件按需取用；既有 `useSession` 调用完全不变，只在渲染层做 fallback。

## 4. 详细设计

### 4.1 SSR 预取

```ts
// apps/app/src/app/(page)/guestbook/page.tsx
import { headers } from "next/headers";
import { auth } from "@/api/auth";

const GuestbookPage = async () => {
  const initialSession = await auth.api.getSession({
    headers: await headers(),
  }).catch(() => null); // 预取失败不阻塞渲染，回退到客户端拉取
  return (
    <Container data-aos="fade-up">
      <Guestbook initialSession={initialSession} />
    </Container>
  );
};
```

**关键点**：

- `await headers()`：Next.js 15 async API
- `.catch(() => null)`：DB 抖动 / cookie 缺失时不让整页 500
- 不加 `export const dynamic = "force-dynamic"`，让 Next.js 根据 headers() 自动判定为动态渲染

### 4.2 Context 抽象

新增 `apps/app/src/modules/guestbook/context/InitialSessionContext.tsx`：

```tsx
"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { auth } from "@/api/auth";

export type InitialSession = Awaited<ReturnType<typeof auth.api.getSession>>;

const InitialSessionContext = createContext<InitialSession>(null);

export const InitialSessionProvider = ({
  value,
  children,
}: {
  value: InitialSession;
  children: ReactNode;
}) => (
  <InitialSessionContext.Provider value={value}>
    {children}
  </InitialSessionContext.Provider>
);

export const useInitialSession = () => useContext(InitialSessionContext);
```

**类型推断**：复用 `auth.api.getSession` 返回类型，避免手写 Session/User shape。

### 4.3 Guestbook 接收并注入

```tsx
// apps/app/src/modules/guestbook/index.tsx
"use client";
import {
  InitialSessionProvider,
  type InitialSession,
} from "./context/InitialSessionContext";

interface Props {
  initialSession: InitialSession;
}

const Guestbook = ({ initialSession }: Props) => {
  // ... existing state
  return (
    <InitialSessionProvider value={initialSession}>
      <div className="space-y-8">...</div>
    </InitialSessionProvider>
  );
};
```

### 4.4 MessageForm 消费

```tsx
const { data: session, isPending } = useSession();
const initialSession = useInitialSession();

// 渲染层 fallback：有 SSR 数据时直接展示，避免首帧 isPending=true 的闪烁
const displaySession = session ?? initialSession;
const displayPending = isPending && !initialSession;
```

所有原来用 `session` / `isPending` 的渲染分支替换为 `displaySession` / `displayPending`：

- 已登录 SSR 数据 + 客户端 useSession 还在加载 → 直接显示登录态，不抖
- 未登录 SSR 数据（initialSession=null）+ 客户端拉到了 session（极少见）→ 切换为登录态（与现状一致）
- SSR 失败（initialSession=null）→ 行为与现状完全一致

## 5. 影响文件

- 新增 `apps/app/src/modules/guestbook/context/InitialSessionContext.tsx`
- 修改 `apps/app/src/app/(page)/guestbook/page.tsx`（改 async，预取）
- 修改 `apps/app/src/modules/guestbook/index.tsx`（接收 prop + Provider 包装）
- 修改 `apps/app/src/modules/guestbook/components/MessageForm.tsx`（fallback 消费）

不动 `MessageList.tsx`（不需要 session）、`RealtimeListener.tsx`、`auth-client.ts`、`auth.ts`。

## 6. 验收标准

### 功能

- [ ] 已登录用户访问 `/guestbook` 首屏直接显示头像 + "提交留言" 按钮，无 Skeleton 闪烁
- [ ] 未登录用户访问 `/guestbook` 首屏直接显示 "使用 GitHub 登录" 按钮，无 Skeleton 闪烁
- [ ] 用户登录后 / 退出后 UI 正确切换（依赖 useSession 实时性，不受 SSR 数据影响）
- [ ] DB 抖动导致 SSR 预取失败时，页面仍能渲染，行为退化为现有客户端拉取

### 不破坏现状

- [ ] PR #48 修复的登录态稳定性不受影响
- [ ] PR #54 修复的登录失败链路不受影响
- [ ] 留言增删改、Realtime 推送、登录/登出流程全部正常

### 质量

- [ ] TypeScript 类型检查通过（`bun x tsc --noEmit` in apps/app）
- [ ] ESLint 0 错误 0 警告
- [ ] 生产构建通过
- [ ] pre-commit / pre-push 钩子通过

## 7. 测试策略

与 PR #54 同理：核心改动是 React 客户端组件 + Next.js Server Component，单测需要 mock Next.js 运行时 + Better Auth client，ROI 极低。采用：

- **类型检查**：捕获 InitialSession 类型推断、prop 传递
- **ESLint**：捕获 Context 使用错误、prop 类型缺失
- **生产构建**：确保 Server Component / Client Component 边界正确
- **人工烟雾测试**：开 DevTools Network 慢速模式，对比改动前后首屏闪烁差异

不引入 Vitest / Testing Library / Playwright（仍是单组件改动，过度工程）。

## 8. 风险与缓解

| 风险                                                                 | 缓解                                                           |
| -------------------------------------------------------------------- | -------------------------------------------------------------- |
| `auth.api.getSession` 在服务端抛错导致整页 500                       | `.catch(() => null)` 兜底，降级到客户端拉取                    |
| `headers()` 在某些渲染路径下不可用                                   | Next.js 15 在 Server Component 中调用合法；page.tsx 是顶层 RSC |
| Server Component 与 Client Component 类型边界不匹配                  | 在 Context 文件内 export `InitialSession` 类型作为单一来源     |
| 命中 cookieCache 时 SSR 预取仍走 DB（性能）                          | PR #48 已配 `session.cookieCache`，5 分钟内命中内存            |
| 未登录时 SSR 返回 null，hydration 后 useSession 拉到 session（罕见） | `displaySession = session ?? initialSession` 自动切换为登录态  |

## 9. 回滚

如发现问题：

1. revert PR 即可，所有改动都集中在 4 个文件
2. 临时降级：把 page.tsx 改回同步、移除 prop，模块自动退化到现状
