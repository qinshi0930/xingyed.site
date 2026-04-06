## ADDED Requirements

### Requirement: Contact API 后端代理
Contact API SHALL 在后端处理邮件发送,保护 SMTP 配置不被暴露到前端。

#### Scenario: API 路由定义
- **WHEN** POST 请求发送到 `/api/contact`
- **THEN** Hono 路由从 `src/modules/contact/api.ts` 处理请求

#### Scenario: 请求体结构
- **WHEN** 前端提交联系表单
- **THEN** 直接发送 `{ name, email, message }`,不嵌套在对象中

### Requirement: 表单验证
Contact API SHALL 验证必需字段,返回清晰的错误消息。

#### Scenario: 缺少字段验证
- **WHEN** 请求缺少 `name`、`email` 或 `message`
- **THEN** 返回 400 状态码和 `{ status: false, error: 'Missing required fields' }`

#### Scenario: 邮箱格式验证
- **WHEN** email 字段格式不正确
- **THEN** 返回 400 状态码和相应的错误消息

### Requirement: SMTP 邮件发送
Contact API SHALL 使用 Nodemailer 通过 163 邮箱 SMTP 服务器发送邮件。

#### Scenario: 邮件发送成功
- **WHEN** SMTP 配置正确且网络正常
- **THEN** 邮件成功发送到配置的收件人,返回 `{ status: true, message: 'Message sent successfully' }`

#### Scenario: SMTP 错误处理
- **WHEN** SMTP 服务器连接失败或认证失败
- **THEN** 返回 500 状态码和 `{ status: false, error: 'Failed to send message' }`

### Requirement: 前端 Toast 反馈
Contact Form SHALL 使用 Sonner Toast 展示提交结果。

#### Scenario: 提交成功反馈
- **WHEN** API 返回成功状态
- **THEN** 显示 `toast.success('消息发送成功!')` 并清空表单

#### Scenario: 提交失败反馈
- **WHEN** API 返回错误或网络异常
- **THEN** 显示 `toast.error('网络错误,请稍后重试')`
