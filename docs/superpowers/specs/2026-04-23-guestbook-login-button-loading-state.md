# Guestbook 登录按钮 Loading 状态设计

## 背景

`MessageForm.tsx` 中的提交按钮已具备 `isSubmitting` loading 状态（禁用按钮 + "提交中..." 文案），但登录按钮在调用 GitHub OAuth 流程期间没有任何反馈，用户可重复点击，体验不佳。

## 目标

为登录按钮添加与提交按钮一致的 loading 状态，在 OAuth 跳转请求期间禁用按钮并提供文字反馈。

## 方案

采用局部状态方案，与现有 `isSubmitting` 保持同一模式。

### 状态设计

- 新增 `isLoggingIn: boolean` 局部 state，初始值为 `false`
- `handleLogin` 开始时 `setIsLoggingIn(true)`
- `handleLogin` 的 `finally` 块中 `setIsLoggingIn(false)`

### UI 行为

- 登录按钮在 `isLoggingIn` 期间 `disabled`
- 登录按钮文案在 `isLoggingIn` 期间由"使用 GitHub 登录"变为"登录中..."

### 边界处理

- `signIn.social` 触发页面跳转，组件卸载后 React 会自动忽略后续的 state 更新，不会报错
- 网络请求失败（`/api/auth/github/status` 抛异常）时，`catch` 块显示 toast 错误，`finally` 恢复按钮状态

## 影响范围

仅修改 `apps/app/src/modules/guestbook/components/MessageForm.tsx`，无其他文件变更。

## 兼容性

与现有 `isSubmitting` 模式完全对齐，零引入风险。
