# Guestbook 登录失败链路修复 - 设计文档

- 日期：2026-05-19
- 关联 Issues：[#52](https://github.com/qinshi0930/xingyed.site/issues/52)、[#53](https://github.com/qinshi0930/xingyed.site/issues/53)
- 关联 PR：（实施后补充）
- 上游：PR #48 P1 后续优化清单第一波

## 1. 背景

PR #48 修复了 Better Auth 登录态稳定性的 P0 配置问题（协议一致性 / cookieCache / crossSubDomainCookies）。但 guestbook 登录交互层仍有两个未闭合的边缘问题：

1. **isLoggingIn 永久卡死**（issue #53）：用户点击"使用 GitHub 登录"→ 跳到 GitHub → 点取消/关闭 → 浏览器后退回到 `/guestbook`，页面从 bfcache 恢复，`isLoggingIn=true` 导致按钮永远显示"登录中..."。
2. **OAuth 失败 toast 永远不触发**（issue #52）：[`MessageForm.tsx`](file:///home/xingye/workspace/xingyed.site/apps/app/src/modules/guestbook/components/MessageForm.tsx) 已有 `?login=failed` 参数检测逻辑，但后端从未生成此参数，分支不可达。

两个问题共同形成"登录失败链路"——用户取消授权后的页面状态既不恢复也无提示，体验断裂。本次将作为一个垂直切片闭合该链路。

## 2. 根因分析

### 2.1 isLoggingIn 卡死

[`MessageForm.tsx#L24-L28`](file:///home/xingye/workspace/xingyed.site/apps/app/src/modules/guestbook/components/MessageForm.tsx#L24-L28) 当前仅在 `session` 变更时重置：

```ts
useEffect(() => {
  if (session && isLoggingIn) {
    setIsLoggingIn(false);
  }
}, [session, isLoggingIn]);
```

`handleLogin` 只在 catch 分支同步重置（[L89-L92](file:///home/xingye/workspace/xingyed.site/apps/app/src/modules/guestbook/components/MessageForm.tsx#L89-L92)）。但若 `signIn.social` 已开始跳转外部 URL，再回来时 catch 不会触发。

触发路径：

- 用户点登录 → `signIn.social` 跳到 `https://github.com/login/oauth/authorize`
- 用户点 Cancel 或关闭窗口 → 浏览器执行 history.back()
- `/guestbook` 从 bfcache 恢复 → React 状态持久化 → `isLoggingIn` 仍为 `true`
- 没有 session 进来，没有 catch，永久卡死

### 2.2 OAuth 失败参数永远不来

调研 Better Auth 1.6.3：

- `apps/app/.../better-auth/dist/api/routes/sign-in.mjs` 显示 `signIn.social()` 客户端入参支持 `errorCallbackURL: z.string().optional()`
- `apps/app/.../better-auth/dist/api/routes/callback.mjs#L57-L60` 显示 OAuth callback 失败时优先使用 state 中的 `errorURL`，其次使用 `c.context.options.onAPIError?.errorURL`，最后 fallback 到 `${baseURL}/error`

当前代码 [L85-L88](file:///home/xingye/workspace/xingyed.site/apps/app/src/modules/guestbook/components/MessageForm.tsx#L85-L88) 调用：

```ts
await signIn.social({
  provider: "github",
  callbackURL: "/guestbook",
});
```

未传 `errorCallbackURL`，所以失败时跳到默认 `/api/auth/error`（404 页面）。

## 3. 方案

### 3.1 #53 isLoggingIn 卡死修复

**新增 useEffect** 监听三类"用户回到页面"信号，仅在 `isLoggingIn=true && !session` 时重置：

| 信号                                 | 处理                                                        |
| ------------------------------------ | ----------------------------------------------------------- |
| `pageshow` 且 `event.persisted=true` | 立即重置（最关键场景：浏览器后退命中 bfcache）              |
| `visibilitychange` 至 `visible`      | 延迟 1.5s 后若仍无 session 则重置（给 useSession 时间拉新） |
| 30 秒超时                            | 兜底强制重置，避免任何遗漏路径                              |

**为什么不选其他方案**：

- **超时兜底单独使用**：粒度太粗，用户取消后还要等 30s 才能再次点击。
- **sessionStorage 持久化**：增加状态复杂度，bfcache + visibility 已能 100% 覆盖。
- **直接 polling session**：useSession 已经有自己的策略，重复 polling 浪费请求。

### 3.2 #52 OAuth 失败重定向

**单点改动**：在 `signIn.social` 调用中添加 `errorCallbackURL`：

```ts
await signIn.social({
  provider: "github",
  callbackURL: "/guestbook",
  errorCallbackURL: "/guestbook?login=failed",
});
```

**为什么不改 `auth.ts` 配 `onAPIError.errorURL`**：

- 全局 `errorURL` 会污染未来其他模块的 auth 错误处理（如 dashboard 邮箱登录失败也跳到 guestbook）
- 客户端 `errorCallbackURL` 优先级最高（先 state 后全局），完全控制本模块行为
- 改动最小、最局部

**与 issue #52 描述的差异**：issue 原方案描述指向 `auth.ts`，调研后发现 `signIn.social` 客户端参数是更精确的入口。在 PR 描述中说明该调整。

## 4. 影响文件

- `apps/app/src/modules/guestbook/components/MessageForm.tsx`（两个 issue 共用此文件）

不动 `auth.ts`，不引入新依赖，不改 API 路由。

## 5. 验收标准

### #53 验收

- [ ] 点击"使用 GitHub 登录"→ GitHub 页 → 点 Cancel → 后退回到 /guestbook → 按钮恢复为"使用 GitHub 登录"
- [ ] 点击登录 → 关闭 GitHub 标签 → 切回 /guestbook 标签 → 按钮在 1.5s 内恢复
- [ ] 30 秒超时兜底正常工作
- [ ] 正常登录成功流程不受影响

### #52 验收

- [ ] GitHub 授权页点 Cancel → 跳回 `/guestbook?login=failed` → 弹出"未完成登录，请重试" toast
- [ ] URL 参数被自动清除（既有逻辑保持）
- [ ] 正常登录成功流程不受影响

### 通用

- [ ] TypeScript 类型检查通过（`bun x tsc --noEmit`）
- [ ] ESLint 通过
- [ ] pre-commit / pre-push 钩子全部通过
- [ ] 不破坏 PR #48 已修复的登录态稳定性

## 6. 测试策略

由于改动是 React 客户端组件 + 浏览器原生事件（`pageshow`/`visibilitychange`/bfcache），单元测试 ROI 低（需要 mock 整个浏览器生命周期）。采用**类型 + 静态检查 + 手动验收**的组合：

- TypeScript：捕获 `errorCallbackURL` 入参类型、PageTransitionEvent 类型
- ESLint：捕获 useEffect 依赖、未清理监听等问题
- 构建产物：`bun run build` 必须通过
- 部署后人工走 4 个验收场景

不引入 Vitest/Testing Library，避免在为 1 个组件加测试设施造成过度工程。

## 7. 回滚

如果发现监听器导致内存泄漏或副作用：

1. revert PR
2. 临时方案：仅保留超时兜底，去掉 pageshow/visibilitychange
