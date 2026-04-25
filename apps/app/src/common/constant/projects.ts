import type { ProjectItemProps } from "../types/projects";

export const PROJECT_CONTENTS: ProjectItemProps[] = [
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
	},
	{
		title: "next-canary-release",
		slug: "next-canary-release",
		description: "基于 Podman Compose + Nginx 权重路由的灰度发布系统",
		image: "/images/projects/next-canary-release.svg",
		link_github: "https://github.com/qinshi0930/next-canary-release",
		stacks: '["Nginx", "Node.js"]',
		content: "next-canary-release.mdx",
		is_show: true,
		is_featured: false,
		updated_at: new Date("2026-04-25"),
	},
];
