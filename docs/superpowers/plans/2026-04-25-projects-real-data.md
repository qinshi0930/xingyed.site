# Projects 模块真实数据替换 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 删除 projects 模块中的 4 个占位符假项目，替换为当前站点 xingyed.site 作为第一个真实项目案例。

**Architecture:** 纯数据层替换，不涉及组件/API/类型变更。修改常量文件中的项目数据，替换 MDX 内容文件，用浏览器截图替换 SVG 占位图。

**Tech Stack:** Next.js MDX、TypeScript 常量数据

---

### Task 1: 截取项目首页截图并保存

**Files:**

- Create: `apps/app/public/images/projects/xingyed-site.png`

- [ ] **Step 1: 使用浏览器截取首页截图**

访问 `http://localhost:6080`，截取首页完整首屏截图，保存为 PNG 文件。

- [ ] **Step 2: 将截图保存到项目目录**

将截图文件保存到 `apps/app/public/images/projects/xingyed-site.png`。

- [ ] **Step 3: 验证图片文件存在且可访问**

Run: `ls -la apps/app/public/images/projects/xingyed-site.png`
Expected: 文件存在，大小合理（>10KB）

---

### Task 2: 删除假项目 MDX 文件

**Files:**

- Delete: `apps/app/src/contents/projects/ecommerce-platform.mdx`
- Delete: `apps/app/src/contents/projects/task-management.mdx`
- Delete: `apps/app/src/contents/projects/weather-dashboard.mdx`

- [ ] **Step 1: 删除三个假项目 MDX 文件**

删除以下文件：

- `apps/app/src/contents/projects/ecommerce-platform.mdx`
- `apps/app/src/contents/projects/task-management.mdx`
- `apps/app/src/contents/projects/weather-dashboard.mdx`

- [ ] **Step 2: 验证文件已删除**

Run: `ls apps/app/src/contents/projects/`
Expected: 目录为空或仅包含后续创建的文件

---

### Task 3: 创建真实项目 MDX 内容文件

**Files:**

- Create: `apps/app/src/contents/projects/xingyed-site.mdx`

- [ ] **Step 1: 创建 xingyed-site.mdx 文件**

```mdx
---
title: "xingyed.site"
date: "2026-04-25"
featured: true
---

# xingyed.site

## 项目概述

一个基于 Next.js 15 构建的现代化个人博客与作品集网站，采用 Monorepo 同构架构，支持容器化自部署。

## 主要功能

- 技术博客系统（MDX 内容管理 + 代码高亮）
- 留言板（GitHub OAuth 登录 + 实时互动）
- 项目作品展示
- Dashboard 数据面板（GitHub / Spotify / WakaTime 集成）
- 联系表单（邮件通知）
- 学习笔记模块

## 技术特点

- Bun Monorepo 工程架构
- Next.js 15 Turbopack 构建
- Hono.js 同构 API 网关
- GitHub Actions CI/CD 自动化流水线
- Podman 容器化部署
- Redis 缓存层
- Supabase PostgreSQL + RLS 行级安全

## 开发亮点

- Better Auth + GitHub OAuth 统一认证
- Drizzle ORM 类型安全数据层
- Standalone 产物输出优化
- Webhook 自动部署流程
- 完善的代码质量门禁（ESLint + Prettier + Husky）
```

- [ ] **Step 2: 验证文件格式正确**

Run: `head -5 apps/app/src/contents/projects/xingyed-site.mdx`
Expected: 输出 frontmatter 头部 `---` 和 title 字段

---

### Task 4: 替换项目常量数据

**Files:**

- Modify: `apps/app/src/common/constant/projects.ts`

- [ ] **Step 1: 替换 PROJECT_CONTENTS 数组内容**

将 `apps/app/src/common/constant/projects.ts` 中的 4 个假项目条目全部删除，替换为 1 个真实项目条目：

```typescript
import type { ProjectItemProps } from "../types/projects";

export const PROJECT_CONTENTS: ProjectItemProps[] = [
  {
    title: "xingyed.site",
    slug: "xingyed-site",
    description: "基于 Next.js 15 的个人博客与作品集，采用同构架构和容器化部署",
    image: "/images/projects/xingyed-site.png",
    link_demo: "https://xingyed.xyz",
    link_github: "https://github.com/qinshi0930/xingyed.site",
    stacks:
      '["Next.js", "React.js", "TypeScript", "TailwindCSS", "Hono.js", "Drizzle"]',
    content: "xingyed-site.mdx",
    is_show: true,
    is_featured: true,
    updated_at: new Date("2026-04-25"),
  },
];
```

- [ ] **Step 2: 验证 TypeScript 编译无错误**

Run: `cd apps/app && bunx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 无类型错误（或仅有与本次变更无关的已有警告）

---

### Task 5: 删除旧占位 SVG 图片

**Files:**

- Delete: `apps/app/public/images/projects/ecommerce-platform.svg`
- Delete: `apps/app/public/images/projects/task-management.svg`
- Delete: `apps/app/public/images/projects/weather-dashboard.svg`
- Delete: `apps/app/public/images/projects/blog-platform.svg`

- [ ] **Step 1: 删除 4 个旧的 SVG 占位图**

删除以下文件：

- `apps/app/public/images/projects/ecommerce-platform.svg`
- `apps/app/public/images/projects/task-management.svg`
- `apps/app/public/images/projects/weather-dashboard.svg`
- `apps/app/public/images/projects/blog-platform.svg`

- [ ] **Step 2: 验证 images/projects 目录仅包含新截图**

Run: `ls apps/app/public/images/projects/`
Expected: 仅包含 `xingyed-site.png`

---

### Task 6: 端到端验证与提交

- [ ] **Step 1: 启动开发服务器验证页面渲染**

访问 `http://localhost:6080/projects`，确认：

1. 列表页仅显示 1 个项目卡片（xingyed.site），带 Featured 标记
2. 项目图片正确加载（PNG 截图）
3. 技术栈图标正确显示

- [ ] **Step 2: 验证详情页**

访问 `http://localhost:6080/projects/xingyed-site`，确认：

1. 标题和描述正确
2. 技术栈图标和 Live Demo / Source Code 链接正确
3. MDX 内容正确渲染（四段式结构完整）
4. 项目图片正确显示

- [ ] **Step 3: 验证 API 端点**

Run: `curl -s http://localhost:6080/api/projects | head -100`
Expected: 返回 JSON，data 数组包含 1 个项目，title 为 "xingyed.site"

- [ ] **Step 4: 提交所有变更**

```bash
git add -A
git commit -m "feat(projects): 替换占位假数据为 xingyed.site 真实项目案例"
```
