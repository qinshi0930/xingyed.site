# Guestbook 登录失败链路修复 - 实施计划

- 日期：2026-05-19
- 关联 Spec：[2026-05-19-guestbook-login-fail-loop-design.md](../specs/2026-05-19-guestbook-login-fail-loop-design.md)
- 关联 Issues：closes #52、closes #53
- 分支：`fix/guestbook-login-fail-loop`
- 基于：`main`（PR #48 已合并 / 待合并）

## 0. 总览

两个 issue 共用同一文件 [`MessageForm.tsx`](file:///home/xingye/workspace/xingyed.site/apps/app/src/modules/guestbook/components/MessageForm.tsx)，按 issue 边界拆为两个 commit，单 PR 提交。

**完成判定**：

- 两个 commit 都进 PR
- pre-commit + pre-push 全绿
- 类型检查通过
- 生产构建通过
- PR 描述链接 closes #52 #53 + 关联 spec 文档

## 1. 任务序列（串行）

### Task 1：创建分支

```bash
git checkout main
git pull origin main
git checkout -b fix/guestbook-login-fail-loop
```

### Task 2：实施 #53 isLoggingIn 卡死修复

**文件**：`apps/app/src/modules/guestbook/components/MessageForm.tsx`

**改动**：在现有 useEffect 之后追加新 useEffect 监听 `pageshow`/`visibilitychange` + 30s 超时。

**关键代码骨架**：

```ts
// 兜底重置 isLoggingIn：用户从 GitHub 取消返回（bfcache）/ 切回 tab / 长时间无响应
useEffect(() => {
  if (!isLoggingIn) return;

  const reset = () => setIsLoggingIn(false);

  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) reset();
  };

  const onVisibility = () => {
    if (document.visibilityState === "visible") {
      window.setTimeout(() => {
        // 在闭包外重新读取最新 state 通过 setter 函数式更新
        setIsLoggingIn((current) => (current ? false : current));
      }, 1500);
    }
  };

  const timeoutId = window.setTimeout(reset, 30_000);

  window.addEventListener("pageshow", onPageShow);
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    window.removeEventListener("pageshow", onPageShow);
    document.removeEventListener("visibilitychange", onVisibility);
    window.clearTimeout(timeoutId);
  };
}, [isLoggingIn]);
```

**注意**：

- visibility 分支故意不依赖 `session` 闭包（避免依赖项膨胀），使用函数式 setState 保证幂等
- 仅在 `isLoggingIn=true` 时挂载监听，避免常驻
- 既有的 "session 进来重置" 副作用保留，与新的兜底互不干扰

**Commit 1**：

```
fix(guestbook): 修复登录按钮 isLoggingIn 卡死问题

新增 useEffect 监听三类"用户回到页面"信号作为 loading 状态兜底：
- pageshow + persisted：bfcache 命中（浏览器后退）立即重置
- visibilitychange visible：1.5s 后函数式重置
- 30s 超时兜底

closes #53
```

### Task 3：实施 #52 OAuth 失败重定向

**文件**：同上

**改动**：在 `handleLogin` 中给 `signIn.social` 调用追加 `errorCallbackURL`：

```ts
await signIn.social({
  provider: "github",
  callbackURL: "/guestbook",
  errorCallbackURL: "/guestbook?login=failed",
});
```

**Commit 2**：

```
feat(guestbook): OAuth 失败显式重定向带 ?login=failed 参数

利用 Better Auth client signIn.social 的 errorCallbackURL 入参，让 OAuth 失败（用户取消授权 / token 交换失败 / state 校验失败）时跳回 /guestbook?login=failed，触发 MessageForm 既有的 toast 提示。

closes #52
```

### Task 4：本地验证（verification-before-completion）

**强制顺序**：

1. `bun x tsc --noEmit`（类型）
2. `cd apps/app && bun run lint`（如有）
3. `bun run build`（生产构建）
4. `git status` 确认无意外变更
5. `git log --oneline main..HEAD` 确认 2 个 commit 干净

**注入 Bun PATH 模板**（参照已有项目记忆）：

```bash
export PATH="$HOME/.bun/bin:/usr/local/bin:/usr/bin:$PATH"
```

### Task 5：推送 + 创建 PR

```bash
git push -u origin fix/guestbook-login-fail-loop
gh pr create --title "fix(guestbook): 闭合登录失败链路 (closes #52 #53)" --body-file <pr-body>
```

**PR 描述结构**：

1. 关联 issues + spec 文档链接
2. 改动摘要（每个 issue 对应一个 commit）
3. 与 issue 原方案的偏差说明（#52 改 client 而非 auth.ts）
4. 验证步骤记录
5. 部署后人工验收清单（4 个场景 checkbox）

## 2. 风险与缓解

| 风险                                          | 缓解                                                                   |
| --------------------------------------------- | ---------------------------------------------------------------------- |
| `errorCallbackURL` 入参在 1.6.3 类型未导出    | 已确认 sign-in.d.mts 含 `errorCallbackURL: z.ZodOptional<z.ZodString>` |
| visibilitychange 在某些移动端冷启动时频繁触发 | 仅在 `isLoggingIn=true` 时挂载 + 1.5s 延迟 + 函数式 setState 幂等      |
| pre-push 钩子构建失败                         | 已知 Bun PATH 注入方案，参照 PR #48 经验                               |
| .env.production 泄漏                          | 不动该文件；本次改动纯客户端代码                                       |

## 3. 不做的事（避免范围蔓延）

- 不动 `auth.ts`
- 不抽 `apiFetch`（属于 #50，下一波）
- 不改 SSR 预取（属于 #49）
- 不改 API 路由
- 不引入测试框架（spec 中已说明）
