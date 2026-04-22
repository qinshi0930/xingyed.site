# Guestbook 删除确认对话框实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 MessageItem.tsx 中的 `window.confirm` 替换为基于 `@radix-ui/react-alert-dialog` 的自定义 ConfirmDialog 组件，保持与现有 shadcn/ui 设计体系一致。

**Architecture:** 基于已安装的 `@radix-ui/react-alert-dialog` 封装轻量级 ConfirmDialog 组件，通过 Props 控制显隐、标题、描述、回调和加载状态。MessageItem.tsx 新增 `isDeleteDialogOpen` 状态管理对话框，将删除逻辑拆分为"打开对话框"和"确认后执行"。

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, @radix-ui/react-alert-dialog, lucide-react, shadcn/ui Button

---

## 文件结构

| 文件                                                          | 操作 | 说明                                           |
| ------------------------------------------------------------- | ---- | ---------------------------------------------- |
| `apps/app/src/modules/guestbook/components/ConfirmDialog.tsx` | 创建 | 基于 Radix UI AlertDialog 封装的确认对话框组件 |
| `apps/app/src/modules/guestbook/components/MessageItem.tsx`   | 修改 | 移除 `window.confirm`，集成 ConfirmDialog      |

---

## Task 1: 创建 ConfirmDialog 组件

**Files:**

- Create: `apps/app/src/modules/guestbook/components/ConfirmDialog.tsx`

**前置检查：**

```bash
cd /home/xingye/workspace/xingyed.site/apps/app
cat package.json | grep "@radix-ui/react-alert-dialog"
```

Expected: `"@radix-ui/react-alert-dialog": "^1.1.15"`（已安装，无需新增依赖）

- [ ] **Step 1: 编写 ConfirmDialog 组件**

创建文件 `apps/app/src/modules/guestbook/components/ConfirmDialog.tsx`：

```tsx
"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { Loader2Icon } from "lucide-react";
import * as React from "react";

import { cn } from "@/common/components/shadcn/utils";
import { Button } from "@/common/components/shadcn/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) => {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
        <AlertDialogPrimitive.Content
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-card p-6 shadow-lg rounded-lg",
          )}
        >
          <AlertDialogPrimitive.Title className="text-lg font-semibold text-foreground">
            {title}
          </AlertDialogPrimitive.Title>
          {description && (
            <AlertDialogPrimitive.Description className="text-sm text-muted-foreground">
              {description}
            </AlertDialogPrimitive.Description>
          )}
          <div className="flex flex-row justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
};
```

- [ ] **Step 2: 验证组件文件创建成功**

Run:

```bash
ls -la /home/xingye/workspace/xingyed.site/apps/app/src/modules/guestbook/components/ConfirmDialog.tsx
```

Expected: 文件存在，大小约 2KB

- [ ] **Step 3: TypeScript 类型检查**

Run:

```bash
cd /home/xingye/workspace/xingyed.site/apps/app
bunx tsc --noEmit --jsx react-jsx src/modules/guestbook/components/ConfirmDialog.tsx
```

Expected: 无类型错误输出

- [ ] **Step 4: Commit**

```bash
cd /home/xingye/workspace/xingyed.site
git add apps/app/src/modules/guestbook/components/ConfirmDialog.tsx
git commit -m "feat(guestbook): 添加 ConfirmDialog 确认对话框组件

基于 @radix-ui/react-alert-dialog 封装，支持：
- 自定义标题和描述
- 确认/取消按钮文案
- 加载状态显示
- 与 shadcn/ui 设计体系一致的样式和动画"
```

---

## Task 2: 修改 MessageItem.tsx 集成 ConfirmDialog

**Files:**

- Modify: `apps/app/src/modules/guestbook/components/MessageItem.tsx`

- [ ] **Step 1: 查看当前 MessageItem.tsx 内容**

Run:

```bash
cat /home/xingye/workspace/xingyed.site/apps/app/src/modules/guestbook/components/MessageItem.tsx
```

确认当前文件包含 `window.confirm` 调用和 `/* eslint-disable no-alert */` 注释。

- [ ] **Step 2: 移除顶部的 eslint-disable 注释**

修改文件开头，删除第 1 行：

```typescript
/* eslint-disable no-alert -- 删除确认需要使用 confirm */
```

文件开头应直接从 `"use client";` 开始。

- [ ] **Step 3: 添加 ConfirmDialog 导入**

在现有导入语句后添加：

```typescript
import { ConfirmDialog } from "./ConfirmDialog";
```

导入顺序保持与现有文件一致：外部库 → 类型 → 内部组件。

- [ ] **Step 4: 新增状态变量**

在 `MessageItem` 组件内部的 state 声明区域，添加：

```typescript
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
```

添加位置：在 `const [isDeleting, setIsDeleting] = useState(false);` 之后。

- [ ] **Step 5: 改造 handleDelete 函数**

将现有的 `handleDelete` 函数：

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

替换为：

```typescript
const handleDelete = () => {
  if (isDeleting) return;
  setIsDeleteDialogOpen(true);
};

const handleConfirmDelete = async () => {
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
    setIsDeleteDialogOpen(false);
    onDelete();
  } catch {
    toast.error("网络错误，请稍后重试");
  } finally {
    setIsDeleting(false);
  }
};
```

- [ ] **Step 6: 在 JSX 中添加 ConfirmDialog**

在 `MessageItem` 组件 return 语句的最外层 `div` 结束前添加 ConfirmDialog 组件：

```tsx
<ConfirmDialog
  open={isDeleteDialogOpen}
  onOpenChange={setIsDeleteDialogOpen}
  title="删除留言"
  description="确定要删除这条留言吗？此操作不可撤销。"
  confirmText="删除"
  cancelText="取消"
  onConfirm={handleConfirmDelete}
  isLoading={isDeleting}
/>
```

添加位置：在 `</div>`（最外层 div 的结束标签）之前。

- [ ] **Step 7: 验证完整文件内容**

修改后的 `MessageItem.tsx` 应满足以下检查点：

1. 文件开头无 `/* eslint-disable no-alert */` 注释
2. 导入语句包含 `import { ConfirmDialog } from "./ConfirmDialog";`
3. state 声明包含 `const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);`
4. `handleDelete` 函数不再包含 `window.confirm`
5. 存在 `handleConfirmDelete` 函数
6. JSX 中包含 `<ConfirmDialog ... />` 组件
7. 无 `window.confirm` 残留

Run:

```bash
grep -n "window.confirm" /home/xingye/workspace/xingyed.site/apps/app/src/modules/guestbook/components/MessageItem.tsx || echo "No window.confirm found - GOOD"
grep -n "ConfirmDialog" /home/xingye/workspace/xingyed.site/apps/app/src/modules/guestbook/components/MessageItem.tsx
```

Expected:

- `window.confirm` 无匹配（或显示 GOOD）
- `ConfirmDialog` 有 2 处匹配（导入语句和 JSX 使用）

- [ ] **Step 8: TypeScript 类型检查**

Run:

```bash
cd /home/xingye/workspace/xingyed.site/apps/app
bunx tsc --noEmit --jsx react-jsx src/modules/guestbook/components/MessageItem.tsx
```

Expected: 无类型错误输出

- [ ] **Step 9: ESLint 检查**

Run:

```bash
cd /home/xingye/workspace/xingyed.site/apps/app
bunx eslint src/modules/guestbook/components/MessageItem.tsx
```

Expected: 无 ESLint 错误（特别是不应有 `no-alert` 相关错误，因为已移除 window.confirm）

- [ ] **Step 10: Commit**

```bash
cd /home/xingye/workspace/xingyed.site
git add apps/app/src/modules/guestbook/components/MessageItem.tsx
git commit -m "feat(guestbook): MessageItem 集成自定义确认对话框

- 移除 window.confirm，替换为 ConfirmDialog 组件
- 新增 isDeleteDialogOpen 状态管理对话框显隐
- 将删除逻辑拆分为 handleDelete（打开对话框）和 handleConfirmDelete（执行删除）
- 删除失败时保持对话框打开，便于用户重试
- 移除不再需要的 eslint-disable no-alert 注释"
```

---

## Task 3: 构建验证

**Files:**

- N/A（验证步骤）

- [ ] **Step 1: Next.js 构建验证**

Run:

```bash
cd /home/xingye/workspace/xingyed.site/apps/app
bun run build
```

Expected: 构建成功，无错误输出

- [ ] **Step 2: 检查构建产物**

Run:

```bash
ls -la /home/xingye/workspace/xingyed.site/apps/app/.next/static/chunks | grep -i "guestbook" || echo "Build artifacts present"
```

Expected: 构建产物存在

---

## Self-Review

**1. Spec coverage:**

| 设计文档要求                                                                                        | 实施计划对应任务     |
| --------------------------------------------------------------------------------------------------- | -------------------- |
| 创建 ConfirmDialog 组件                                                                             | Task 1, Step 1-4     |
| Props 接口（open, onOpenChange, title, description, confirmText, cancelText, onConfirm, isLoading） | Task 1, Step 1       |
| 样式规范（遮罩层、对话框容器、标题、描述、按钮区）                                                  | Task 1, Step 1       |
| 动画规范（fade-in, zoom-in-95, slide）                                                              | Task 1, Step 1       |
| MessageItem.tsx 新增 isDeleteDialogOpen 状态                                                        | Task 2, Step 4       |
| handleDelete 改造为仅打开对话框                                                                     | Task 2, Step 5       |
| 新增 handleConfirmDelete 函数                                                                       | Task 2, Step 5       |
| JSX 集成 ConfirmDialog                                                                              | Task 2, Step 6       |
| 移除 window.confirm 和 eslint-disable 注释                                                          | Task 2, Step 2, 5, 7 |
| 构建验证                                                                                            | Task 3               |

✅ 无遗漏

**2. Placeholder scan:**

- 无 "TBD", "TODO", "implement later", "fill in details"
- 所有代码块均为完整可运行代码
- 所有命令均含预期输出

✅ 无占位符

**3. Type consistency:**

- `ConfirmDialogProps` 接口中的 `onOpenChange` 签名与 Radix UI 一致
- `isLoading` 在 ConfirmDialog 和 MessageItem 中命名一致
- `handleConfirmDelete` 为 async 函数，与 `onConfirm: () => void` 兼容（调用方不等待返回值）

✅ 类型一致

---

## 执行交接

**计划已保存至** `docs/superpowers/plans/2026-04-22-guestbook-confirm-dialog.md`

**两种执行方式：**

**1. Subagent-Driven（推荐）** — 每个任务派发独立子代理，任务间审查，快速迭代

**2. Inline Execution** — 在本会话中使用 executing-plans 顺序执行，批量执行带检查点

**选择哪种方式？**
