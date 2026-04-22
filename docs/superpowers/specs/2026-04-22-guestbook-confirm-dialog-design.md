# Guestbook 删除确认对话框设计

**日期**: 2026-04-22  
**状态**: 待实施  
**模块**: Guestbook - MessageItem 组件

---

## 背景与目标

当前 Guestbook 模块的留言删除操作使用浏览器原生的 `window.confirm` 弹出确认框，存在以下问题：

1. **视觉风格不一致**：原生确认框的样式与项目整体的 shadcn/ui + Tailwind CSS 设计风格脱节
2. **用户体验不佳**：原生对话框不可定制，无法展示品牌一致性
3. **可访问性局限**：原生 confirm 阻塞主线程，且无法适配暗色主题

**目标**：将 `window.confirm` 替换为基于 `@radix-ui/react-alert-dialog` 的自定义确认对话框组件，保持与现有设计体系完全一致。

---

## 设计方案

### 核心思路

基于项目已安装的 `@radix-ui/react-alert-dialog`（v1.1.15）依赖，手动封装一个轻量级 `ConfirmDialog` 组件，仅暴露必需 props，样式沿用现有 shadcn/ui 组件的设计语言。

### 改动范围

**新增一个文件**：`apps/app/src/modules/guestbook/components/ConfirmDialog.tsx`  
**修改一个文件**：`apps/app/src/modules/guestbook/components/MessageItem.tsx`

---

## 详细设计

### 1. ConfirmDialog 组件

**文件路径**：`apps/app/src/modules/guestbook/components/ConfirmDialog.tsx`

#### Props 接口

```typescript
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
```

#### 组件结构

```tsx
"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { Loader2Icon } from "lucide-react";
import * as React from "react";

import { cn } from "@/common/components/shadcn/utils";
import { Button } from "@/common/components/shadcn/ui/button";
```

使用 Radix UI Alert Dialog 的以下子组件：

- `AlertDialogPrimitive.Root` — 控制对话框开关状态
- `AlertDialogPrimitive.Portal` — 将对话框渲染到 body 层级
- `AlertDialogPrimitive.Overlay` — 背景遮罩层
- `AlertDialogPrimitive.Content` — 对话框内容容器
- `AlertDialogPrimitive.Title` — 标题
- `AlertDialogPrimitive.Description` — 描述文本

#### 样式规范

**遮罩层**：

```
fixed inset-0 z-50 bg-black/50
```

与现有 [Sheet](file:///home/xingye/workspace/xingyed.site/apps/app/src/common/components/shadcn/ui/sheet.tsx) 遮罩保持一致。

**对话框容器**：

```
fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-card p-6 shadow-lg rounded-lg
```

- 居中定位，最大宽度 `max-w-md`
- 背景 `bg-card`，边框 `border`，圆角 `rounded-lg`
- 与现有卡片组件风格一致

**标题**：

```
text-lg font-semibold text-foreground
```

**描述**：

```
text-sm text-muted-foreground
```

**按钮区**：

```
flex flex-row justify-end gap-2 mt-4
```

- 右对齐布局
- 确认按钮：`variant="destructive"`，传达删除操作的危险性
- 取消按钮：`variant="outline"`
- 加载状态：确认按钮显示 `Loader2Icon` 旋转图标并禁用

#### 动画规范

```
data-[state=open]:animate-in data-[state=closed]:animate-out
data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
```

与现有 Sheet 组件一致的淡入淡出动画。

**内容动画**：

```
data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]
data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]
```

缩放 + 位移的复合动画，从稍小尺寸和稍偏上的位置平滑进入。

---

### 2. MessageItem.tsx 集成

**文件路径**：`apps/app/src/modules/guestbook/components/MessageItem.tsx`

#### 状态管理

新增一个 state：

```typescript
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
```

#### handleDelete 函数改造

**改造前**：

```typescript
const handleDelete = async () => {
  const confirmed = window.confirm("确定要删除这条留言吗？");
  if (!confirmed) return;
  // ... 删除逻辑
};
```

**改造后**：

```typescript
const handleDelete = () => {
  if (isDeleting) return;
  setIsDeleteDialogOpen(true);
};
```

`handleDelete` 不再执行实际删除，仅负责打开确认对话框。

#### 新增 handleConfirmDelete 函数

```typescript
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

#### JSX 集成

在 `MessageItem` 组件 return 的末尾添加 `ConfirmDialog`：

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

#### 移除的内容

- 删除 `/* eslint-disable no-alert -- 删除确认需要使用 confirm */` 注释
- 删除 `window.confirm` 调用

---

## 用户体验流程

### 删除操作流程

1. **用户点击删除按钮** → 触发 `handleDelete` → 打开自定义确认对话框
2. **对话框展示** → 显示标题"删除留言"、描述"确定要删除这条留言吗？此操作不可撤销。"、"取消"和"删除"按钮
3. **用户点击"取消"或遮罩/ESC** → 关闭对话框，无任何操作
4. **用户点击"删除"** → 确认按钮变为加载状态（旋转图标 + 禁用），同时取消按钮也禁用
5. **请求完成** → 关闭对话框 → 显示 toast 提示 → 刷新留言列表
6. **请求失败** → 保持对话框打开 → 显示 toast 错误提示 → 按钮恢复可用

---

## 关键设计决策

### 为什么基于 `@radix-ui/react-alert-dialog` 手动封装，而不是使用 `shadcn add`？

- **轻量级**：项目已安装该依赖，无需新增任何包
- **可控性**：仅实现当前需要的功能，避免引入不需要的代码
- **一致性**：编码风格与现有 shadcn/ui 组件（如 Sheet）完全一致

### 为什么确认按钮使用 `destructive` variant？

- **视觉警示**：红色背景明确传达删除操作的危险性
- **符合惯例**：与主流设计系统（Material Design、Ant Design 等）的删除确认模式一致
- **项目已有**：现有的 [Button](file:///home/xingye/workspace/xingyed.site/apps/app/src/common/components/shadcn/ui/button.tsx) 组件已定义 `destructive` variant

### 为什么删除失败时保持对话框打开？

- **用户上下文保留**：用户可以直接再次尝试删除，无需重新触发删除按钮
- **避免打断流程**：关闭对话框会迫使用户重新开始操作
- **错误可见性**：toast 提示与对话框同时存在，用户可以清晰看到发生了什么

### 为什么使用 `zoom-in-95` 动画？

- **与 shadcn/ui 官方一致**：shadcn/ui 的 AlertDialog 官方实现使用相同的缩放动画
- **细腻感**：从稍小尺寸缩放进入，比纯淡入更有质感
- **性能友好**：仅使用 CSS transform，不触发重排

---

## 与现有代码的兼容性

✅ **完全兼容**：不影响其他组件  
✅ **遵循现有模式**：样式体系与现有 shadcn/ui 组件一致  
✅ **不引入新依赖**：使用已安装的 `@radix-ui/react-alert-dialog`  
✅ **不改变 API 接口**：后端数据结构保持不变  
✅ **保持原有交互**：删除后的 toast 提示和列表刷新逻辑不变

---

## 实施要点

1. 创建 `ConfirmDialog.tsx` 组件文件，封装 Radix UI AlertDialog
2. 在 MessageItem.tsx 中导入 `ConfirmDialog`
3. 新增 `isDeleteDialogOpen` 状态控制对话框显隐
4. 将 `handleDelete` 拆分为：打开对话框 + 确认后执行删除
5. 移除 `window.confirm` 和对应的 eslint-disable 注释
6. 确保确认按钮在加载状态下正确显示旋转图标并禁用

---

## 测试建议

- [ ] 点击删除按钮，验证自定义确认对话框正常弹出
- [ ] 点击"取消"，验证对话框关闭且无删除请求发出
- [ ] 点击遮罩层，验证对话框关闭
- [ ] 按 ESC 键，验证对话框关闭
- [ ] 点击"删除"，验证确认按钮进入加载状态（旋转图标）
- [ ] 验证删除成功后的 toast 提示、对话框关闭、列表刷新
- [ ] 验证删除失败时的 toast 提示和对话框保持打开
- [ ] 验证加载状态下取消按钮也被禁用
- [ ] 验证暗色主题下对话框样式正确
