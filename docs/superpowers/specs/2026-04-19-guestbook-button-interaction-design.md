# Guestbook 按钮交互优化设计

**日期**: 2026-04-19  
**状态**: 待实施  
**模块**: Guestbook - MessageItem 组件

---

## 问题描述

Guestbook 模块的留言簿编辑和删除按钮存在以下问题：

1. **缺少处理中状态反馈**：用户点击后没有视觉反馈，不知道操作是否正在进行
2. **重复提交风险**：快速点击多次会触发多个并发请求
3. **Toast 提示混乱**：第一个请求成功后，后续请求因数据已变更而失败，导致"成功后又提示失败"
4. **并发操作风险**：删除操作进行时，用户仍可点击编辑按钮，可能导致状态混乱
5. **GitHub 登录按钮无错误反馈**：点击登录按钮后，如果 OAuth 未配置或登录失败，用户没有任何提示

---

## 设计方案

### 核心思路

为编辑和删除操作分别添加独立的 loading 状态，复用项目中 MessageForm 已有的 `isSubmitting` 模式。

### 改动范围

**仅修改一个文件**：`apps/app/src/modules/guestbook/components/MessageItem.tsx`

---

## 详细设计

### 1. 状态管理

新增两个 state：

```typescript
const [isUpdating, setIsUpdating] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
```

- `isUpdating`：控制编辑操作的加载状态
- `isDeleting`：控制删除操作的加载状态

### 2. 按钮行为改造

#### 编辑模式 - "保存"按钮

```typescript
<Button
  size="sm"
  onClick={handleUpdate}
  disabled={!editContent.trim() || isUpdating}
>
  {isUpdating ? "保存中..." : "保存"}
</Button>
```

**交互逻辑**：

- 内容是否为空 + 是否正在更新 → 双重禁用条件
- 按钮文字动态切换："保存" ↔ "保存中..."
- 与 MessageForm 的"提交留言" ↔ "提交中..."模式一致

#### 编辑按钮（进入编辑模式）

```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={() => setIsEditing(true)}
  disabled={isDeleting}
>
  <EditIcon className="h-4 w-4" />
</Button>
```

**交互逻辑**：

- 删除操作进行时（`isDeleting = true`），编辑按钮禁用
- 防止用户在删除过程中进入编辑模式，避免状态混乱
- 保持 UI 布局稳定（禁用而非隐藏）

#### 删除按钮

```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={handleDelete}
  disabled={isDeleting}
>
  {isDeleting ? (
    <Loader2Icon className="h-4 w-4 animate-spin" />
  ) : (
    <TrashIcon className="h-4 w-4" />
  )}
</Button>
```

**交互逻辑**：

- 使用图标替代文字，保持 ghost 按钮风格
- 加载时显示旋转的 Loader2Icon
- 正常状态显示 TrashIcon

### 3. 异步操作改造

#### handleUpdate 函数

```typescript
const handleUpdate = async () => {
  if (!editContent.trim() || isUpdating) return; // 防止重复调用

  setIsUpdating(true); // 开始加载

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
    setIsUpdating(false); // 无论成功失败都结束加载
  }
};
```

#### handleDelete 函数

```typescript
const handleDelete = async () => {
  const confirmed = window.confirm("确定要删除这条留言吗？");
  if (!confirmed) return;

  if (isDeleting) return; // 防止重复调用

  setIsDeleting(true); // 开始加载

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
    setIsDeleting(false); // 无论成功失败都结束加载
  }
};
```

### 4. 图标导入

新增 `Loader2Icon` 导入：

```typescript
import { EditIcon, TrashIcon, Loader2Icon } from "lucide-react";
```

### 5. GitHub 登录错误处理

#### 后端：OAuth 状态检查接口

**文件**：`apps/app/src/api/routes/auth.ts`

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
    console.error("[GitHub OAuth] Not configured: missing credentials");
  }

  return c.json({ enabled: isEnabled });
});
```

**设计要点**：

- 前端友好的响应：只返回 `{ enabled: boolean }`
- 后端详细日志：`console.error` 记录配置问题
- 不暴露敏感信息：不返回具体的配置错误细节

#### 前端：MessageForm 登录逻辑改造

**文件**：`apps/app/src/modules/guestbook/components/MessageForm.tsx`

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

**交互逻辑**：

1. **点击登录** → 调用 `/api/auth/github/status` 检查配置
2. **配置不可用** → Toast: "登录功能暂时不可用" + 后端记录错误日志
3. **配置正常** → 跳转 GitHub 授权页面
4. **网络错误** → Toast: "网络错误，请稍后重试"
5. **用户取消/其他错误** → Toast: "未完成登录，请重试"

**用户体验流程**：

```
场景 1：OAuth 未配置
用户点击登录 → 检查 API → 返回 {enabled: false} → Toast: "登录功能暂时不可用"

场景 2：用户取消授权
用户点击登录 → 跳转 GitHub → 用户取消 → 回调 /guestbook → 无 session → Toast: "未完成登录，请重试"

场景 3：网络错误
用户点击登录 → fetch 失败 → catch → Toast: "网络错误，请稍后重试"

场景 4：登录成功
用户点击登录 → 跳转 GitHub → 授权成功 → 回调 /guestbook → 有 session → 无提示
```

---

## 用户体验流程

### 编辑操作流程

1. 用户点击编辑按钮 → 进入编辑模式
2. 修改内容后点击"保存" → 按钮变为"保存中..."并禁用
3. 请求完成 → 显示 toast 提示，退出编辑模式，按钮恢复

### 删除操作流程

1. 用户点击删除按钮 → 弹出确认对话框
2. 确认后 → 删除图标变为旋转的加载图标，**编辑按钮同时禁用**
3. 请求完成 → 显示 toast 提示，刷新列表，**编辑按钮恢复可用**

---

## 关键设计决策

### 为什么用 `finally` 块重置状态？

- 确保无论成功、失败还是异常，按钮都会恢复可用状态
- 避免按钮永久禁用的极端情况

### 为什么在函数开头检查 `isUpdating/isDeleting`？

- 双重保护：即使按钮 `disabled` 失效（理论上不可能），也能防止重复调用
- 防御性编程最佳实践

### 删除按钮为什么用图标而不是文字？

- 保持原有 UI 风格（ghost 按钮 + 图标）
- 加载时用旋转图标替代垃圾桶图标，视觉反馈更直观
- 与编辑按钮的"保存中..."文字方案互补

### 编辑按钮为什么保留文字方案？

- "保存"按钮是主要操作，文字更清晰
- 与 MessageForm 的"提交中..."模式保持一致

### 为什么删除时禁用编辑按钮？

- 防止并发操作：避免用户在删除过程中点击编辑导致状态混乱
- 保持 UI 布局稳定：采用禁用而非隐藏，避免按钮跳动
- 视觉一致性：两个按钮都使用相同的 disabled 状态反馈

### 为什么 GitHub 登录要先检查配置？

- 提前发现问题：在跳转前检测 OAuth 配置，避免无效的跳转
- 友好的用户提示：根据错误类型显示不同的 Toast 文案
- 后端日志追踪：`console.error` 记录配置问题，方便开发人员排查

### 为什么前端不暴露详细的错误信息？

- 安全性：不暴露后端配置细节（如缺少哪个环境变量）
- 用户体验：简洁友好的提示，避免技术术语
- 职责分离：详细日志在后端，前端只负责用户反馈

---

## 与现有代码的兼容性

✅ **完全兼容**：不影响其他组件  
✅ **遵循现有模式**：MessageForm 已使用 `isSubmitting`  
✅ **不引入新依赖**：Loader2Icon 来自已有的 lucide-react  
✅ **不改变 API 接口**：数据结构保持不变

---

## 实施要点

1. 添加两个 state：`isUpdating`、`isDeleting`
2. 改造 `handleUpdate` 和 `handleDelete` 函数，添加 loading 状态管理
3. 更新按钮的 `disabled` 属性和显示内容
4. 导入 `Loader2Icon` 图标
5. 使用 `finally` 块确保状态正确重置

---

## 测试建议

- [ ] 快速点击编辑按钮多次，验证只发送一次请求
- [ ] 快速点击删除按钮多次，验证只发送一次请求
- [ ] 验证编辑成功后的 toast 提示和状态恢复
- [ ] 验证删除成功后的 toast 提示和列表刷新
- [ ] 验证网络错误时的 toast 提示和按钮恢复
- [ ] 验证加载状态下按钮的视觉反馈（文字/图标变化）
- [ ] **验证删除进行时编辑按钮禁用，删除完成后恢复可用**
