import matter from "gray-matter";
import fs from "node:fs";
import path from "node:path";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";

import type { BlogItemProps } from "@/common/types/blog";

interface GetBlogsParams {
	page?: number;
	per_page?: number;
	search?: string;
	category?: string;
	is_featured?: boolean;
}

export const loadBlogFiles = (): BlogItemProps[] => {
	const dirPath = path.join(process.cwd(), "src", "contents", "blog");

	if (!fs.existsSync(dirPath)) {
		return [];
	}

	const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".mdx"));

	const blogs = files.map((file) => {
		const filePath = path.join(dirPath, file);
		const source = fs.readFileSync(filePath, "utf-8");
		const { content, data } = matter(source);

		// 处理 MDX 内容
		const mdxCompiler = remark().use(remarkParse).use(remarkGfm).use(remarkMdx);
		const mdxContent = mdxCompiler.processSync(content).toString();

		return {
			id: data.id,
			slug: data.slug || file.replace(".mdx", ""),
			title: { rendered: data.title },
			content: {
				rendered: mdxContent,
				markdown: content,
				protected: false,
			},
			excerpt: { rendered: data.excerpt, protected: false },
			date: data.date,
			modified: data.date,
			featured_image_url: data.featured_image,
			categories: data.categories || [],
			tags: data.tags || [],
			is_featured: data.is_featured || false,
			total_views_count: data.total_views_count || 0,
			// 添加其他必需字段的默认值
			status: "publish",
			link: `/blog/${data.slug}?id=${data.id}`,
			author: 1,
			featured_media: 0,
			comment_status: "open",
			ping_status: "open",
			sticky: false,
			template: "",
			format: "standard",
			meta: { footnotes: "" },
			tags_list: [],
			amp_enabled: false,
		} as BlogItemProps;
	});

	// 按日期排序（最新的在前）
	return blogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getBlogBySlug = (slug: string): BlogItemProps | undefined => {
	const blogs = loadBlogFiles();
	return blogs.find((blog) => blog.slug === slug);
};

export const getBlogById = (id: number): BlogItemProps | undefined => {
	const blogs = loadBlogFiles();
	return blogs.find((blog) => blog.id === id);
};

export const getBlogs = ({
	page = 1,
	per_page = 6,
	search = "",
	category = "",
	is_featured = undefined,
}: GetBlogsParams) => {
	let blogs = loadBlogFiles();

	// 分类筛选
	if (category) {
		blogs = blogs.filter((blog) => blog.categories.includes(category));
	}

	// Featured 筛选
	if (is_featured !== undefined) {
		blogs = blogs.filter((blog) => blog.is_featured === is_featured);
	}

	// 搜索功能
	if (search) {
		const searchLower = search.toLowerCase();
		blogs = blogs.filter(
			(blog) =>
				blog.title.rendered.toLowerCase().includes(searchLower) ||
				blog.excerpt.rendered.toLowerCase().includes(searchLower) ||
				blog.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
		);
	}

	const total_posts = blogs.length;
	const total_pages = Math.ceil(total_posts / per_page);

	// 分页
	const start = (page - 1) * per_page;
	const paginatedBlogs = blogs.slice(start, start + per_page);

	return {
		posts: paginatedBlogs,
		page,
		per_page,
		total_pages,
		total_posts,
	};
};
