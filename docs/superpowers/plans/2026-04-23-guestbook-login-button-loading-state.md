# Guestbook 登录按钮 Loading 状态实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `MessageForm.tsx` 的 GitHub 登录按钮添加 `isLoggingIn` loading 状态，请求期间禁用按钮并显示"登录中..."文案。

**Architecture:** 采用局部 state 方案，与组件内已有的 `isSubmitting` 保持同一模式。无新增文件，仅修改现有组件。

**Tech Stack:** React, TypeScript, shadcn/ui Button, better-auth

---

## File Structure

| File                                                        | Action | Responsibility                               |
| ----------------------------------------------------------- | ------ | -------------------------------------------- |
| `apps/app/src/modules/guestbook/components/MessageForm.tsx` | Modify | 添加 `isLoggingIn` state 及按钮 loading 行为 |

---

## Task 1: 添加登录按钮 Loading 状态

**Files:**

- Modify: `apps/app/src/modules/guestbook/components/MessageForm.tsx`

- [ ] **Step 1: 添加 `isLoggingIn` state**

在 `useState` 声明区域（第 18-19 行附近），新增 `isLoggingIn` state：

```tsx
const [message, setMessage] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);
const [isLoggingIn, setIsLoggingIn] = useState(false);
```

- [ ] **Step 2: 修改 `handleLogin` 以管理 loading 状态**

将现有 `handleLogin`：

```tsx
const handleLogin = async () => {
  try {
    // 先检查 OAuth 配置
    const response = await fetch("/api/auth/github/status");
    const data = await response.json();

    if (!data.enabled) {
      toast.error("登录功能暂时不可用");
      return;
    }

    // 配置正常，执行跳转
    signIn.social({
      provider: "github",
      callbackURL: "/guestbook",
    });
  } catch {
    toast.error("网络错误，请稍后重试");
  }
};
```

替换为：

```tsx
const handleLogin = async () => {
  setIsLoggingIn(true);
  try {
    // 先检查 OAuth 配置
    const response = await fetch("/api/auth/github/status");
    const data = await response.json();

    if (!data.enabled) {
      toast.error("登录功能暂时不可用");
      return;
    }

    // 配置正常，执行跳转
    signIn.social({
      provider: "github",
      callbackURL: "/guestbook",
    });
  } catch {
    toast.error("网络错误，请稍后重试");
  } finally {
    setIsLoggingIn(false);
  }
};
```

- [ ] **Step 3: 修改登录按钮的 disabled 和文案**

将现有登录按钮（第 121-124 行）：

```tsx
<Button onClick={handleLogin}>
  <GithubIcon className="mr-2 h-4 w-4" />
  使用 GitHub 登录
</Button>
```

替换为：

```tsx
<Button onClick={handleLogin} disabled={isLoggingIn}>
  <GithubIcon className="mr-2 h-4 w-4" />
  {isLoggingIn ? "登录中..." : "使用 GitHub 登录"}
</Button>
```

- [ ] **Step 4: 验证代码格式和类型**

运行以下命令检查修改后的文件：

```bash
cd /home/xingye/workspace/xingyed.site/apps/app && npx tsc --noEmit --pretty
```

Expected: 无类型错误，命令以 0 退出。

- [ ] **Step 5: Commit**

```bash
git add apps/app/src/modules/guestbook/components/MessageForm.tsx
git commit -m "feat(guestbook): 登录按钮添加 loading 状态防止重复点击"
```

---

## Self-Review Checklist

**1. Spec coverage:**

- [x] 新增 `isLoggingIn` state — Task 1 Step 1
- [x] `handleLogin` 开始/结束时管理状态 — Task 1 Step 2
- [x] 按钮 `disabled` 绑定 — Task 1 Step 3
- [x] 按钮文案切换 — Task 1 Step 3
- [x] `finally` 保证状态恢复 — Task 1 Step 2

**2. Placeholder scan:** 无 TBD/TODO/"稍后实现"等占位符。

**3. Type consistency：** 仅使用 `boolean` 类型，与现有 `isSubmitting` 一致。
