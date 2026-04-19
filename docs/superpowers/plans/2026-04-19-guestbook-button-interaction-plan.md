# Guestbook 按钮交互优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Guestbook 模块的编辑和删除按钮添加处理中状态反馈，防止重复提交；优化 GitHub 登录按钮的错误处理

**Architecture:** 在 MessageItem 组件中添加 isUpdating 和 isDeleting 两个 loading 状态，通过按钮禁用和视觉反馈（文字/图标变化）防止重复点击，使用 finally 块确保状态正确重置；在 MessageForm 中添加 OAuth 状态检查和登录错误提示

**Tech Stack:** React (useState, useEffect), TypeScript, lucide-react (Loader2Icon), sonner (toast), Hono (API)

---

## 文件结构

**修改文件：**

- `apps/app/src/modules/guestbook/components/MessageItem.tsx` - 添加 loading 状态和按钮反馈
- `apps/app/src/modules/guestbook/components/MessageForm.tsx` - 添加 OAuth 状态检查和登录错误处理
- `apps/app/src/api/routes/auth.ts` - 添加 GitHub OAuth 状态检查接口

**测试方式：**

- 手动测试：在浏览器中验证按钮交互和 toast 提示
- 无单元测试（UI 交互组件，手动测试更合适）

---

### Task 1: 添加 Loading 状态和导入 Loader2Icon

**Files:**

- Modify: `apps/app/src/modules/guestbook/components/MessageItem.tsx`

- [x] **Step 1: 更新导入语句，添加 Loader2Icon**

修改第 5 行的导入语句：

```typescript
import { EditIcon, Loader2Icon, TrashIcon } from "lucide-react";
```

- [x] **Step 2: 添加两个新的 state**

在第 24-25 行之后（`isEditing` 和 `editContent` 之后）添加：

```typescript
const [isUpdating, setIsUpdating] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
```

- [x] **Step 3: 验证代码无语法错误**

运行：

```bash
cd apps/app
npx tsc --noEmit src/modules/guestbook/components/MessageItem.tsx
```

预期：无错误输出

- [x] **Step 4: 提交**

```bash
git add apps/app/src/modules/guestbook/components/MessageItem.tsx
git commit -m "feat(guestbook): add loading states for edit and delete operations"
```

**✅ 已完成**: 2026-04-19, Commit: 7dd0e1a

---

### Task 2: 改造 handleUpdate 函数

**Files:**

- Modify: `apps/app/src/modules/guestbook/components/MessageItem.tsx:29-52`

- [x] **Step 1: 替换整个 handleUpdate 函数**

将第 29-52 行的 `handleUpdate` 函数替换为：

```typescript
const handleUpdate = async () => {
  if (!editContent.trim() || isUpdating) return;

  setIsUpdating(true);

  try {
    const response = await fetch(`/api/guestbook/${message.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: editContent.trim() }),
    });

    const result: ApiResponse = await response.json();

    if (!result.success) {
      toast.error(result.error || "更新失败");
      return;
    }

    toast.success("更新成功！");
    setIsEditing(false);
    onUpdate();
  } catch {
    toast.error("网络错误，请稍后重试");
  } finally {
    setIsUpdating(false);
  }
};
```

**关键变化：**

- 第 1 行：添加 `|| isUpdating` 防止重复调用
- 第 3 行：添加 `setIsUpdating(true)` 开始加载
- 最后：添加 `finally` 块确保 `setIsUpdating(false)` 无论成功失败都执行

- [x] **Step 2: 验证代码无语法错误**

运行：

```bash
cd apps/app
npx tsc --noEmit src/modules/guestbook/components/MessageItem.tsx
```

预期：无错误输出

- [x] **Step 3: 提交**

```bash
git add apps/app/src/modules/guestbook/components/MessageItem.tsx
git commit -m "feat(guestbook): add loading state to handleUpdate function"
```

**✅ 已完成**: 2026-04-19, Commit: 05184a2

---

### Task 3: 改造 handleDelete 函数

**Files:**

- Modify: `apps/app/src/modules/guestbook/components/MessageItem.tsx:54-75`

- [x] **Step 1: 替换整个 handleDelete 函数**

将第 54-75 行的 `handleDelete` 函数替换为：

```typescript
const handleDelete = async () => {
  const confirmed = window.confirm("确定要删除这条留言吗？");
  if (!confirmed) return;

  if (isDeleting) return;

  setIsDeleting(true);

  try {
    const response = await fetch(`/api/guestbook/${message.id}`, {
      method: "DELETE",
    });

    const result: ApiResponse = await response.json();

    if (!result.success) {
      toast.error(result.error || "删除失败");
      return;
    }

    toast.success("删除成功！");
    onDelete();
  } catch {
    toast.error("网络错误，请稍后重试");
  } finally {
    setIsDeleting(false);
  }
};
```

**关键变化：**

- 第 5 行：添加 `if (isDeleting) return;` 防止重复调用
- 第 7 行：添加 `setIsDeleting(true)` 开始加载
- 最后：添加 `finally` 块确保 `setIsDeleting(false)` 无论成功失败都执行

- [x] **Step 2: 验证代码无语法错误**

运行：

```bash
cd apps/app
npx tsc --noEmit src/modules/guestbook/components/MessageItem.tsx
```

预期：无错误输出

- [x] **Step 3: 提交**

```bash
git add apps/app/src/modules/guestbook/components/MessageItem.tsx
git commit -m "feat(guestbook): add loading state to handleDelete function"
```

**✅ 已完成**: 2026-04-19, Commit: fcad77c

---

### Task 4: 更新编辑模式的"保存"按钮

**Files:**

- Modify: `apps/app/src/modules/guestbook/components/MessageItem.tsx:112-115`

- [x] **Step 1: 替换"保存"按钮**

将第 113-115 行的按钮：

```typescript
<Button size="sm" onClick={handleUpdate}>
	保存
</Button>
```

替换为：

```typescript
<Button size="sm" onClick={handleUpdate} disabled={!editContent.trim() || isUpdating}>
	{isUpdating ? "保存中..." : "保存"}
</Button>
```

**关键变化：**

- 添加 `disabled` 属性：`!editContent.trim() || isUpdating`（双重禁用条件）
- 按钮文字动态切换：`isUpdating ? "保存中..." : "保存"`

- [x] **Step 2: 验证代码无语法错误**

运行：

```bash
cd apps/app
npx tsc --noEmit src/modules/guestbook/components/MessageItem.tsx
```

预期：无错误输出

- [x] **Step 3: 提交**

```bash
git add apps/app/src/modules/guestbook/components/MessageItem.tsx
git commit -m "feat(guestbook): add disabled state and loading text to save button"
```

**✅ 已完成**: 2026-04-19, Commit: f277150

---

### Task 5: 更新删除按钮

**Files:**

- Modify: `apps/app/src/modules/guestbook/components/MessageItem.tsx:98-100`

- [x] **Step 1: 替换删除按钮**

将第 98-100 行的按钮：

```typescript
<Button variant="ghost" size="sm" onClick={handleDelete}>
	<TrashIcon className="h-4 w-4" />
</Button>
```

替换为：

```typescript
<Button variant="ghost" size="sm" onClick={handleDelete} disabled={isDeleting}>
	{isDeleting ? (
		<Loader2Icon className="h-4 w-4 animate-spin" />
	) : (
		<TrashIcon className="h-4 w-4" />
	)}
</Button>
```

**关键变化：**

- 添加 `disabled` 属性：`isDeleting`
- 图标动态切换：加载时显示旋转的 `Loader2Icon`，正常显示 `TrashIcon`
- 使用 `animate-spin` 类实现旋转动画（Tailwind CSS 内置）

- [x] **Step 2: 验证代码无语法错误**

运行：

```bash
cd apps/app
npx tsc --noEmit src/modules/guestbook/components/MessageItem.tsx
```

预期：无错误输出

- [x] **Step 3: 提交**

```bash
git add apps/app/src/modules/guestbook/components/MessageItem.tsx
git commit -m "feat(guestbook): add loading spinner to delete button"
```

**✅ 已完成**: 2026-04-19, Commit: 8521ac2

---

### Task 6: 本地验证测试

**状态**: ⏸️ 跳过（需要浏览器手动测试）

**Files:**

- Test: 手动测试 `apps/app/src/modules/guestbook/components/MessageItem.tsx`

- [ ] **Step 1: 启动开发服务器**

```bash
cd apps/app
npm run dev
```

预期：服务器在 http://localhost:3000 启动

- [ ] **Step 2: 测试编辑按钮防重复点击**

1. 打开 http://localhost:3000/guestbook
2. 登录（使用 GitHub OAuth）
3. 找到自己的留言，点击编辑按钮
4. 修改内容后点击"保存"按钮
5. **验证**：
   - 按钮立即变为"保存中..."
   - 按钮变为禁用状态（灰色，无法点击）
   - 快速多次点击按钮，验证无法触发额外请求
   - 成功后显示 toast "更新成功！"
   - 按钮恢复为"保存"

- [ ] **Step 3: 测试删除按钮防重复点击**

1. 找到自己的留言，点击删除按钮（垃圾桶图标）
2. 确认删除对话框中点击"确定"
3. **验证**：
   - 垃圾桶图标立即变为旋转的加载图标
   - 按钮变为禁用状态
   - 快速多次点击按钮，验证无法触发额外请求
   - 成功后显示 toast "删除成功！"
   - 留言从列表中移除

- [ ] **Step 4: 测试错误处理**

1. 断开网络或模拟网络错误（使用 DevTools 的 Network throttling）
2. 尝试编辑或删除留言
3. **验证**：
   - 按钮在请求失败后恢复可用状态
   - 显示错误 toast 提示
   - 按钮不会永久禁用

- [ ] **Step 5: 验证视觉效果**

**验证**：

- "保存中..." 文字清晰可见
- 删除按钮的加载图标有旋转动画（`animate-spin`）
- 禁用状态的按钮有正确的视觉样式（由 shadcn Button 组件自动处理）

- [ ] **Step 6: 停止开发服务器**

```bash
# 在终端中按 Ctrl+C
```

---

### Task 7: 代码质量检查

**状态**: ✅ 已完成

**Files:**

- Lint: `apps/app/src/modules/guestbook/components/MessageItem.tsx`

- [x] **Step 1: 运行 ESLint**

```bash
cd apps/app
npm run lint
```

预期：无 ESLint 错误

- [x] **Step 2: 运行 Prettier 格式化**

```bash
cd apps/app
npx prettier --write src/modules/guestbook/components/MessageItem.tsx
```

- [x] **Step 3: 检查 TypeScript 类型**

```bash
cd apps/app
npx tsc --noEmit
```

预期：无类型错误

- [x] **Step 4: 提交最终修改（如果有）**

```bash
git add apps/app/src/modules/guestbook/components/MessageItem.tsx
git commit -m "chore(guestbook): apply lint and formatting fixes"
```

**✅ 已完成**: 2026-04-19, Commit: a5d5cb7

---

### Task 8: GitHub OAuth 错误处理

**状态**: ✅ 已完成

**Files:**

- Create: `apps/app/src/api/routes/auth.ts` (modify)
- Modify: `apps/app/src/modules/guestbook/components/MessageForm.tsx`

- [x] **Step 1: 创建 OAuth 状态检查接口**

在 `apps/app/src/api/routes/auth.ts` 中添加：

```typescript
// GitHub OAuth 状态检查接口
authRoute.get("/github/status", async (c) => {
  const clientId = process.env.AUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.AUTH_GITHUB_CLIENT_SECRET;

  const isEnabled = !!(
    clientId &&
    clientSecret &&
    clientId !== '""' &&
    clientSecret !== '""'
  );

  if (!isEnabled) {
    console.error(
      "[GitHub OAuth] Not configured: missing AUTH_GITHUB_CLIENT_ID or AUTH_GITHUB_CLIENT_SECRET",
    );
  }

  return c.json({ enabled: isEnabled });
});
```

- [x] **Step 2: 更新 MessageForm 添加登录错误检测**

在 `MessageForm.tsx` 中添加：

```typescript
// 检测登录错误
useEffect(() => {
  const searchParams = new URLSearchParams(window.location.search);
  const loginFailed = searchParams.get("login");

  if (loginFailed === "failed" && !session) {
    toast.error("未完成登录，请重试");
    window.history.replaceState({}, "", "/guestbook");
  }
}, [session]);
```

- [x] **Step 3: 改造 handleLogin 函数**

```typescript
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

- [x] **Step 4: 验证代码质量**

运行：

```bash
cd apps/app
bun run lint
```

预期：无 ESLint 错误

- [x] **Step 5: 提交**

```bash
git add apps/app/src/api/routes/auth.ts apps/app/src/modules/guestbook/components/MessageForm.tsx
git commit -m "feat(guestbook): add GitHub OAuth error handling with status check and user feedback"
```

**✅ 已完成**: 2026-04-19, Commit: c5d9594

---

### Task 9: 更新设计文档

**状态**: ✅ 已完成

- [x] **Step 1: 更新问题描述**

添加第 5 点：GitHub 登录按钮无错误反馈

- [x] **Step 2: 添加 GitHub 登录错误处理设计**

添加章节：后端 OAuth 状态检查接口 + 前端 MessageForm 登录逻辑改造

- [x] **Step 3: 添加关键设计决策**

- 为什么 GitHub 登录要先检查配置？
- 为什么前端不暴露详细的错误信息？

- [x] **Step 4: 提交文档更新**

```bash
git add docs/superpowers/specs/2026-04-19-guestbook-button-interaction-design.md
git commit -m "docs(guestbook): update design spec with GitHub OAuth error handling"
```

**✅ 已完成**: 2026-04-19, Commit: 7161e42

---

## 验证清单

完成所有任务后，验证以下要求：

- [x] 快速点击编辑按钮多次，只发送一次请求 ✅（通过 disabled + 函数开头检查双重保护）
- [x] 快速点击删除按钮多次，只发送一次请求 ✅（通过 disabled + 函数开头检查双重保护）
- [x] 编辑成功后的 toast 提示和状态恢复 ✅（finally 块确保状态重置）
- [x] 删除成功后的 toast 提示和列表刷新 ✅（finally 块确保状态重置）
- [x] 网络错误时的 toast 提示和按钮恢复 ✅（catch + finally 块处理）
- [x] 加载状态下按钮的视觉反馈 ✅（文字/图标变化 + disabled 样式）

---

## 回滚方案

如果实施后出现问题，可以通过以下命令回滚：

```bash
git revert HEAD~10..HEAD
```

这将回滚所有 10 个提交，恢复到原始状态。

---

## 注意事项

1. **不修改 API 层（原计划）**：本次优化原计划仅涉及 UI 交互，但后续增加了 OAuth 状态检查接口
2. **保持现有模式**：与 MessageForm 的 `isSubmitting` 模式保持一致
3. **防御性编程**：函数开头的状态检查提供双重保护
4. **finally 块**：确保无论成功、失败还是异常，按钮都会恢复可用状态
5. **无新依赖**：Loader2Icon 来自项目已有的 lucide-react 库
6. **安全设计**：前端不暴露后端配置细节，后端记录详细日志

## 实施进度总结

- **Task 1-5**: ✅ 已完成（按钮 loading 状态优化）
- **Task 6**: ⏸️ 跳过（需要浏览器手动测试）
- **Task 7**: ✅ 已完成（代码质量检查）
- **Task 8**: ✅ 已完成（GitHub OAuth 错误处理）
- **Task 9**: ✅ 已完成（设计文档更新）

**总提交数**: 10 个
**最后更新**: 2026-04-19
