# Projects 模块真实数据替换设计

## 背景

projects 模块当前展示 4 个占位符假项目（E-Commerce Platform、Task Management App、Weather Dashboard、Blog Platform），需删除全部假数据，将当前站点 xingyed.site 作为第一个真实项目案例。

## 设计

### 数据条目

```typescript
{
  title: "xingyed.site",
  slug: "xingyed-site",
  description: "基于 Next.js 15 的个人博客与作品集，采用同构架构和容器化部署",
  image: "/images/projects/xingyed-site.png",
  link_demo: "https://xingyed.xyz",
  link_github: "https://github.com/qinshi0930/xingyed.site",
  stacks: '["Next.js", "React.js", "TypeScript", "TailwindCSS", "Hono.js", "Drizzle"]',
  content: "xingyed-site.mdx",
  is_show: true,
  is_featured: true,
  updated_at: new Date("2026-04-25"),
}
```

### MDX 内容结构（标准四段式）

- **项目概述**：一句话定位
- **主要功能**：博客系统、留言板、项目展示、Dashboard、联系表单、学习模块等
- **技术特点**：Monorepo、Turbopack、GitHub Actions CI/CD、Podman 容器化、Redis 缓存等
- **开发亮点**：同构 Hono API 网关、Better Auth + GitHub OAuth、Supabase + Drizzle 数据层、Standalone 构建等

### 项目图片

浏览器截取网站首页截图，保存为 PNG 至 `public/images/projects/xingyed-site.png`。

## 文件变更清单

| 操作     | 文件路径                                                               |
| -------- | ---------------------------------------------------------------------- |
| 修改     | `src/common/constant/projects.ts` — 删除 4 个假条目，添加 1 个真实条目 |
| 删除     | `src/contents/projects/ecommerce-platform.mdx`                         |
| 删除     | `src/contents/projects/task-management.mdx`                            |
| 删除     | `src/contents/projects/weather-dashboard.mdx`                          |
| 新建     | `src/contents/projects/xingyed-site.mdx`                               |
| 新增     | `public/images/projects/xingyed-site.png`（浏览器截图）                |
| 可选删除 | `public/images/projects/*.svg`（旧占位图）                             |

## 不变更

- 组件层（ProjectCard、ProjectDetail、Projects、ProjectLink）无需改动
- 类型定义无需改动
- API 路由无需改动
- MDX 加载逻辑无需改动
