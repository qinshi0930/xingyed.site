# Personal Blog - Monorepo Isomorphic Architecture

基于 Next.js + Hono 的个人博客网站,采用同构架构设计。

## 架构特点

- **同构架构**: 前端和 API 统一在单个 Next.js 应用中
- **Hono 框架**: 使用 Hono 通过 `hono/vercel` 适配器提供 API 服务
- **零 CORS**: 同域 API 调用,无需跨域配置
- **Toast 通知**: 集成 Sonner 提供全局消息反馈
- **Docker 部署**: 单容器单端口简化部署

## 技术栈

- **框架**: Next.js 15 + React 19
- **API**: Hono + hono/vercel 适配器
- **样式**: Tailwind CSS + shadcn/ui
- **包管理器**: Bun 1.3.11+
- **构建**: Bun + Next.js (传统模式)
- **部署**: Docker + Podman

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

# 启动开发服务器
bun run dev
```

访问 http://localhost:3000

### 生产构建

```bash
# 构建应用
bun run build

# 启动生产服务器
bun run start
```

### Docker 部署

```bash
# 构建镜像
podman build -t xingyed-site .

# 运行容器
podman run -d -p 3000:3000 --env-file .env.production xingyed-site

# 或使用 docker-compose
podman-compose up -d
```

## 环境变量

复制 `.env.production.example` 为 `.env.production` 并配置:

```bash
# SMTP 配置(联系表单)
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=your_email@163.com
SMTP_PASS=your_password
SMTP_FROM=your_email@163.com
SMTP_TO=recipient@example.com

# Redis 配置 (推荐使用 URL)
REDIS_URL=redis://localhost:6379/0
# 或者使用独立变量 (向后兼容)
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=
# REDIS_DB=0

# 其他 API Keys...
```

## 项目结构

```
apps/app/                    # 主应用 @repo/app
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/[[...route]]/# Hono API 统一入口
│   │   ├── (page)/          # 页面路由
│   │   └── layout.tsx       # 根布局(含 Toaster)
│   ├── modules/             # 业务模块
│   │   ├── blog/            # 博客模块
│   │   │   ├── api.ts       # Blog API (Hono)
│   │   │   └── service.ts   # 业务逻辑
│   │   └── contact/         # 联系表单模块
│   │       ├── api.ts       # Contact API (Hono)
│   │       └── components/  # 表单组件
│   └── services/            # 前端服务层
├── package.json
└── Dockerfile

packages/                    # 共享包
├── types/                   # @repo/types
└── utils/                   # @repo/utils
```

## API 端点

- `GET /api/blog` - 获取博客列表(支持分页、搜索、分类)
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

*This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).*
