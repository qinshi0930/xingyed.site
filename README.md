# Personal Blog - Monorepo Isomorphic Architecture

基于 Next.js + Hono 的个人博客网站,采用同构架构设计。

## 架构特点

- **同构架构**: 前端和 API 统一在单个 Next.js 应用中
- **Hono 框架**: 使用 Hono 通过 `hono/vercel` 适配器提供 API 服务
- **零 CORS**: 同域 API 调用,无需跨域配置
- **Toast 通知**: 集成 Sonner 提供全局消息反馈
- **容器部署**: 单容器单端口，镜像由开发机构建后推送到自托管环境

## 技术栈

- **框架**: Next.js 15 + React 19
- **API**: Hono + hono/vercel 适配器
- **样式**: Tailwind CSS + shadcn/ui
- **包管理器**: Bun 1.3.11+
- **构建**: Node.js + Turbopack (构建速度提升 57%)
- **部署**: Podman（自托管）+ Vercel（外网入口）

## 环境要求

- **Node.js**: 22.x
- **Bun**: 1.3.11+ （安装：`curl -fsSL https://bun.sh/install | bash`）
- **Podman**: 4.0+ 或 Docker

## 快速开始

### 开发环境

```bash
# 安装 Bun (如果未安装)
curl -fsSL https://bun.sh/install | bash

# 安装依赖
bun install

# 启动开发服务器 (使用 Turbopack)
bun run app:dev
```

访问 http://localhost:3000

### 生产构建

```bash
# 构建应用 (使用 Turbopack)
bun run app:build

# 启动生产服务器
bun run app:start
```

### 部署

自托管生产环境（阿里云 + nginx）由本机执行脚本推送镜像，**不使用 GitHub Actions 部署**——云服务器在国内，工作流部署会从境外 IP 出网并频繁触发阿里云告警。

```bash
# 完整发布：构建 → 本地冒烟 → 上传 → 候选验证 → 切换 → 巡检
bash scripts/deploy/deploy.sh
```

细节、回滚方式与产物打包注意事项见 [`scripts/deploy/README.md`](scripts/deploy/README.md)。

相关文档：

- [`AGENTS.md`](AGENTS.md) —— 面向 AI 会话与协作者：部署入口、硬性约束、生产机结构
- [`docs/guide/DEPLOY_GUIDE.md`](docs/guide/DEPLOY_GUIDE.md) —— 人类向完整指南：原理、步骤、回滚、排障
- [`docs/guide/AUTO_DEPLOY_QUICKSTART.md`](docs/guide/AUTO_DEPLOY_QUICKSTART.md) —— 一页速查

### Vercel（只读镜像）

外网另有一套 Vercel 部署，定位为**只读镜像**：博客与页面正常提供，留言板与登录关闭。

原因是留言板与登录依赖 PostgreSQL，而自托管生产库只监听阿里云的 `127.0.0.1:5432`，Vercel 访问不到，也不应为此把数据库暴露到公网。

Vercel 项目需要配置：

| 变量                        | 值             | 说明                                                                           |
| --------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_READONLY` | `1`            | 隐藏留言板入口、留言板页面返回 404、`/api/guestbook` 与 `/api/auth/*` 返回 503 |
| `NEXT_PUBLIC_SITE_URL`      | 该 Vercel 域名 | 影响 metadata 的 base URL                                                      |

不要配置 `DATABASE_URL` 与 `REDIS_URL`：前者已由只读模式拦截；后者不设时 Redis 客户端会快速失败并自动降级为读取文件系统（实测 `/api/blog` 仍返回 200）。

自托管主站不要设置 `NEXT_PUBLIC_SITE_READONLY`，保持功能完整。

## 环境变量

复制 `.env.example` 为 `.env.production` 并配置：

```bash
# PostgreSQL（自托管环境使用共享 infra 服务，应用独占库）
DATABASE_URL=postgresql://app_user:password@127.0.0.1:5432/app_db

# Redis（博客缓存）
REDIS_URL=redis://:password@127.0.0.1:6379/0

# Better Auth
BETTER_AUTH_URL=https://xingyed.xyz
BETTER_AUTH_SECRET=

# SMTP 配置(联系表单)
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=your_email@163.com
SMTP_PASS=your_password
SMTP_FROM=your_email@163.com
SMTP_TO=recipient@example.com

# 其他 API Keys...
```

## 基础设施

本项目**不再自带 PostgreSQL / Redis 容器**，统一使用宿主机上共享的 `infra` 服务：

| 服务       | 本地开发                   | 生产                                         |
| ---------- | -------------------------- | -------------------------------------------- |
| PostgreSQL | 由 `infra` 提供            | 共享 `infra` 实例，应用独占库与角色          |
| Redis      | `redis://localhost:6379/0` | 共享 `infra` 实例，按 DB 序号或 key 前缀隔离 |
| MinIO      | 由 `infra` 提供            | 共享 `infra` 实例，按 bucket 隔离            |

> 容器以 `Network=host` 运行，容器内的 `127.0.0.1` 就是宿主机，因此连接串可以直接写 `127.0.0.1:5432` / `127.0.0.1:6379`。
>
> 仓库中曾有的 `podman-compose.yml` 与 `podman-compose.infra.yml` 已删除——它们会自带 Redis 并与共享服务争抢 6379/5432 端口，且与「构建镜像后整体推送」的部署方式重复。

## 项目结构

```
apps/app/                    # 主应用 @repo/app
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/[[...route]]/# Hono API 统一入口
│   │   ├── (page)/          # 页面路由
│   │   └── layout.tsx       # 根布局(含 Toaster)
│   ├── api/                 # 服务端 API 实现
│   │   ├── routes/          # Hono 子路由
│   │   ├── db/              # Drizzle schema 与迁移
│   │   └── services/        # 业务逻辑（博客、GitHub、WakaTime 等）
│   └── modules/             # 前端业务模块
├── package.json
└── scripts/                 # 应用内脚本

packages/                    # 共享包
├── types/                   # @repo/types
└── utils/                   # @repo/utils

scripts/deploy/              # 部署流水线（见 scripts/deploy/README.md）
Dockerfile                   # 镜像构建（基于已构建的 standalone 产物）
```

## API 端点

- `GET /api/blog` - 获取博客列表(支持分页、搜索、分类)
- `GET /api/guestbook` - 留言列表
- `POST /api/guestbook` - 发表留言（需登录）
- `POST /api/contact` - 提交联系表单

## 破坏性变更

从分离架构迁移到同构架构的变更:

- **端口**: 从双端口(3000+3001)改为单端口 3000
- **API URL**: 移除 `NEXT_PUBLIC_API_URL` 环境变量
- **应用名称**: `apps/web` 重命名为 `apps/app`
- **进程管理**: 移除 `concurrently`,不再同时启动两个应用

## 更多信息

- [Next.js Documentation](https://nextjs.org/docs)
- [Hono Documentation](https://hono.dev/docs)
- [Sonner Documentation](https://sonner.emilkowal.ski/)

---

_This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)._
