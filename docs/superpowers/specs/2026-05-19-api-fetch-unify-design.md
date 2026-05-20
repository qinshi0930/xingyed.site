# Spec: 抽 `apiFetch` 统一处理 401 / 403 / 网络错误

- **issue**: [#50](https://github.com/qinshi0930/site/issues/50)
- **波次**: P1 第三波 · 子波次 3a
- **依赖**: 无（独立基础设施）
- **下游**: #51 列表查询走 Hono API（直接复用本工具）
- **风险**: 低（纯重构 + 行为增强，不改后端协议）

## 1. 背景

guestbook 模块当前 3 处 fetch 调用（[MessageForm.handleSubmit](file:///home/xingye/workspace/xingyed.site/apps/app/src/modules/guestbook/components/MessageForm.tsx)、[MessageItem.handleUpdate](file:///home/xingye/workspace/xingyed.site/apps/app/src/modules/guestbook/components/MessageItem.tsx)、`MessageItem.handleConfirmDelete`）重复手写 `try/catch + response.json() + result.success 判断 + toast`。

更关键的痛点：**401 失败链路缺失**

- cookie 过期时，`authMiddleware` 返回 `401 { success: false, error: "Unauthorized: GitHub login required" }`
- 前端只 toast 一句"提交失败"，无任何"重新登录"引导
- 用户视角：界面仍是"已登录"（因 useSession 缓存），但提交持续失败 → 困惑

属于 PR #48 后续 P1 优化清单。

## 2. 后端响应协议（事实摘录）

```ts
// 成功
{ success: true, data?: T, message?: string }     // 200 / 201

// 鉴权失败（authMiddleware）
{ success: false, error: "Unauthorized: GitHub login required" }  // 401

// 业务失败
{ success: false, error: "..." }                  // 403 / 404 / 500
```

`zValidator` 校验失败时返回 400 + Zod 标准错误（不带 `success` 字段），但前端已有 trim 校验，实操不会触发，仅在边界视为 `defaultErrorMessage` 兜底处理。

## 3. 设计方案

### 3.1 选型对比

| 方案                                      | 描述                            | 评价                                                                             |
| ----------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------- |
| A. apiFetch 内部副作用（toast + signOut） | 调用点几乎无样板                | ✅ 切合 issue 诉求，但需提供 `silent` 出口                                       |
| B. apiFetch 仅抛错，调用点处理            | 纯函数好测试                    | ❌ 调用点重复样板，背离抽象目标                                                  |
| C. useApiFetch hook（捕获 router）        | 401 后命令式 `router.refresh()` | ❌ 改动面大；且本仓库已用 SSR + Context fallback，signOut 后 useSession 自然反应 |

**采用方案 A**，关键论据：

- `signOut()` 清 cookie + 重置 nanostores atom，`useSession` 在下一次拉取自然返回 null
- [MessageForm](file:///home/xingye/workspace/xingyed.site/apps/app/src/modules/guestbook/components/MessageForm.tsx) 已在 #49 接入 SSR Context fallback，UI 切回未登录态无需手动 `router.refresh()`
- 命令式刷新会丢失正在编辑的留言草稿，体验更差

### 3.2 接口设计

```ts
// apps/app/src/common/libs/api-fetch.ts
export class ApiError extends Error {
  status: number; // HTTP 状态；0 表示网络层失败
  body: { success?: boolean; error?: string } | null;
}

interface ApiFetchOptions extends RequestInit {
  /** HTTP !ok 且响应体无 error 字段时的兜底 toast 文案 */
  defaultErrorMessage?: string;
  /** 禁用 apiFetch 内置 toast（用于静默 GET 状态检查） */
  silent?: boolean;
}

export async function apiFetch<T = unknown>(
  input: RequestInfo | URL,
  options?: ApiFetchOptions,
): Promise<T>;
```

### 3.3 行为契约

| 场景                           | HTTP    | apiFetch 行为                                                                              |
| ------------------------------ | ------- | ------------------------------------------------------------------------------------------ |
| 网络层失败（fetch reject）     | —       | `toast.error("网络错误，请稍后重试")` → throw `ApiError(0, null)`                          |
| 成功（2xx + `{success:true}`） | 200/201 | 返回 `body.data`（无则返回 `body` 自身）                                                   |
| 鉴权过期                       | 401     | `toast.warning("登录已过期，请重新登录")` + `void signOut()` → throw `ApiError(401, body)` |
| 权限不足                       | 403     | `toast.error(body.error ?? "权限不足，无法操作")` → throw                                  |
| 业务/服务端错误                | 4xx/5xx | `toast.error(body.error ?? defaultErrorMessage)` → throw                                   |
| `silent: true`                 | 任意    | 不弹 toast，仍 signOut（401）+ throw                                                       |

### 3.4 调用点改造模板

```ts
// MessageForm.handleSubmit
const handleSubmit = async () => {
  if (!message.trim()) return;
  setIsSubmitting(true);
  try {
    await apiFetch("/api/guestbook", {
      method: "POST",
      body: JSON.stringify({ message: message.trim() }),
      defaultErrorMessage: "提交失败",
    });
    toast.success("留言成功！");
    setMessage("");
  } catch {
    // apiFetch 已统一弹 toast，业务清理在 finally
  } finally {
    setIsSubmitting(false);
  }
};
```

`Content-Type: application/json` 在 `init.body` 存在时自动注入，调用点不再重复。

## 4. 取舍说明

| 决策                                      | 取舍                                                                |
| ----------------------------------------- | ------------------------------------------------------------------- |
| 401 不做 `router.refresh()`               | 依赖 useSession 自然反应 + SSR Context fallback；保留草稿；单侧依赖 |
| `signOut` 失败容忍（`.catch(undefined)`） | 防止 toast 弹两次；用户视觉只看到一次 warning                       |
| 不引入 `swr`/`tanstack-query`             | issue 范围明确仅 fetch 抽离；引入会越权                             |
| `data ?? body` 兜底返回                   | 兼容 `{success:true, message}` 形态（如 DELETE 响应）               |
| `silent` 而非 `noToast`                   | 与 npm/CLI 习惯对齐；语义更短                                       |

## 5. 不在范围

- `/api/auth/github/status` 静默 GET（公开端点，与本 issue 描述的 401 痛点无关，保留原样）
- contact / dashboard 等其他模块迁移（issue 已注明"逐步迁移"，本 PR 仅锁定 guestbook 3 处）
- apiFetch 单元测试（项目当前未配置 vitest，新增成本远高于收益；通过烟雾测试覆盖）

## 6. 验收标准（对齐 issue #50）

| 标准                                               | 验证方式                        |
| -------------------------------------------------- | ------------------------------- |
| ① cookie 过期 → 提交弹"登录已过期" + UI 切回未登录 | 浏览器手动删 cookie 后点提交    |
| ② 伪造他人留言更新 → 弹"权限不足"                  | DevTools 改 message.id 后点保存 |
| ③ 网络断开 → 弹"网络错误，请稍后重试"              | DevTools Offline 模式           |
| ④ 三处 fetch 调用代码行数明显减少                  | `git diff --stat` 验证          |
| ⑤ TypeScript 类型检查通过                          | `bun x tsc --noEmit` 0 错误     |
| ⑥ pre-commit / pre-push 全绿                       | 钩子自动运行                    |

## 7. 影响文件

- 新增：[apps/app/src/common/libs/api-fetch.ts](file:///home/xingye/workspace/xingyed.site/apps/app/src/common/libs/api-fetch.ts)
- 修改：[apps/app/src/modules/guestbook/components/MessageForm.tsx](file:///home/xingye/workspace/xingyed.site/apps/app/src/modules/guestbook/components/MessageForm.tsx)
- 修改：[apps/app/src/modules/guestbook/components/MessageItem.tsx](file:///home/xingye/workspace/xingyed.site/apps/app/src/modules/guestbook/components/MessageItem.tsx)
