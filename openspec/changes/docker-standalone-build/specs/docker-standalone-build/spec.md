## ADDED Requirements

### Requirement: Dockerfile 单阶段构建
Dockerfile SHALL 仅包含一个 runner 阶段，基于 `node:22-alpine` 镜像，负责运行已构建的 standalone 应用。

#### Scenario: Dockerfile 结构验证
- **WHEN** 检查 Dockerfile 阶段数量
- **THEN** 仅存在一个 FROM 语句（runner 阶段）

#### Scenario: 基础镜像配置
- **WHEN** 构建 Docker 镜像
- **THEN** 使用 `node:22-alpine` 作为基础镜像

#### Scenario: 非 root 用户配置
- **WHEN** 容器启动
- **THEN** 应用以 `nextjs` 用户（UID 1001）运行，而非 root

### Requirement: 构建产物复制
Dockerfile MUST 复制以下构建产物到镜像中：
- `.next/standalone`（包含所有生产依赖）
- `.next/static`（静态资源）
- `apps/app/public`（公共资源）
- `apps/app/src/contents`（MDX 内容）

#### Scenario: Standalone 产物复制
- **WHEN** Docker 构建执行
- **THEN** `.next/standalone` 目录被复制到镜像工作目录 `/app`

#### Scenario: 静态资源复制
- **WHEN** Docker 构建执行
- **THEN** `.next/static` 被复制到 `/app/apps/app/.next/static`

#### Scenario: 依赖完整性
- **WHEN** 检查镜像内容
- **THEN** standalone 目录内包含完整的 `node_modules`，无需额外复制

### Requirement: Docker 上下文优化
`.dockerignore` MUST 排除 `.next/` 目录，但允许以下例外：
- `!.next/standalone`
- `!.next/static`

#### Scenario: Docker 上下文传输
- **WHEN** 执行 `podman-compose build`
- **THEN** 仅 `.next/standalone` 和 `.next/static` 被包含在构建上下文中

#### Scenario: 其他构建产物排除
- **WHEN** 检查 Docker 上下文
- **THEN** `.next/cache`、`.next/types` 等其他子目录被排除

### Requirement: 构建流程封装
`package.json` MUST 提供以下 npm scripts：
- `docker:build`：构建 standalone 产物并创建 Docker 镜像
- `docker:up`：启动 Docker 容器
- `docker:deploy`：完整部署流程（构建 + 启动）

#### Scenario: Docker 构建脚本
- **WHEN** 执行 `pnpm docker:build`
- **THEN** 依次执行：`pnpm build` → 验证产物 → `podman-compose build`

#### Scenario: Docker 部署脚本
- **WHEN** 执行 `pnpm docker:deploy`
- **THEN** 依次执行：`pnpm build` → 验证产物 → `podman-compose build` → `podman-compose up -d`

#### Scenario: 容器启动脚本
- **WHEN** 执行 `pnpm docker:up`
- **THEN** 执行 `podman-compose up -d` 启动容器

### Requirement: 构建产物验证
所有 Docker 构建脚本 MUST 在构建镜像前验证 `.next/standalone` 目录存在性，若不存在则立即失败并提示错误。

#### Scenario: 构建成功验证
- **WHEN** `pnpm build` 成功执行
- **THEN** `.next/standalone` 目录存在，Docker 构建继续

#### Scenario: 构建失败拦截
- **WHEN** `pnpm build` 失败或未执行
- **THEN** 脚本输出 "Build failed" 并退出（exit 1），Docker 构建不执行

### Requirement: 环境变量运行时注入
环境变量 MUST 通过 `podman-compose.yml` 的 `env_file` 配置在容器运行时注入，不得打包进镜像。

#### Scenario: 生产环境变量加载
- **WHEN** 容器启动
- **THEN** `.env.production` 中的环境变量被注入容器

#### Scenario: 环境变量隔离
- **WHEN** 检查 Docker 镜像层
- **THEN** 镜像中不包含 `.env.production` 或其他敏感环境变量
