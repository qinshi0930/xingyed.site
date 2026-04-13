## ADDED Requirements

### Requirement: Dockerfile 多阶段结构
Dockerfile MUST 包含 builder 和 runner 两个阶段，实现自包含构建。

#### Scenario: Builder 阶段配置
- **WHEN** 检查 Dockerfile
- **THEN** builder 阶段包含：node:22-alpine、pnpm 安装、依赖复制、构建执行

#### Scenario: Runner 阶段配置
- **WHEN** 检查 Dockerfile
- **THEN** runner 阶段包含：node:22-alpine、非 root 用户、产物复制、启动命令
