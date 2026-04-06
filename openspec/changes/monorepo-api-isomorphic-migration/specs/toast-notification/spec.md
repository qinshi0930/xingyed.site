## ADDED Requirements

### Requirement: Sonner Toast 安装
系统 SHALL 集成 Sonner 作为全局 Toast 通知组件。

#### Scenario: 依赖安装
- **WHEN** 执行迁移脚本
- **THEN** `sonner` 包被添加到项目依赖

### Requirement: Toaster 全局配置
Toaster SHALL 在根布局中配置,位置为右下角,使用彩色样式。

#### Scenario: Layout 集成
- **WHEN** 应用启动时
- **THEN** `<Toaster position="bottom-right" richColors closeButton />` 被添加到 `layout.tsx`

#### Scenario: Toast 显示位置
- **WHEN** Toast 消息触发
- **THEN** 消息显示在屏幕右下角

### Requirement: 统一错误和成功消息
所有模块 SHALL 使用 Toast 通知展示 API 调用的成功和错误状态。

#### Scenario: Contact Form 成功
- **WHEN** 联系表单提交成功
- **THEN** 显示 `toast.success('消息发送成功!')`

#### Scenario: Contact Form 失败
- **WHEN** 联系表单提交失败
- **THEN** 显示 `toast.error('网络错误,请稍后重试')`

#### Scenario: Blog API 错误
- **WHEN** Blog API 调用失败
- **THEN** 显示相应的错误 Toast 消息
