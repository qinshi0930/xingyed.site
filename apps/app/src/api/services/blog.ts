import matter from "gray-matter";
import fs from "node:fs";
import path from "node:path";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";

import type { BlogItemProps } from "@/common/types/blog";

import { getRedis } from "@/common/libs/redis";

// ==================== 类型定义 ====================

export interface GetBlogsParams {
	page?: number;
	per_page?: number;
	search?: string;
	category?: string;
	is_featured?: boolean;
	id?: number;
	slug?: string;
}

export interface GetBlogsResult {
	posts: BlogItemProps[];
	page: number;
	per_page: number;
	total_pages: number;
	total_posts: number;
}

// ==================== 缓存配置 ====================

const BLOG_CACHE_KEY = "blog:all";
const BLOG_CACHE_TTL = 7 * 24 * 60 * 60; // 7天（秒）

// ==================== 核心函数 ====================

/**
 * 从文件系统加载并解析所有 MDX 博客文件
 * @returns 博客数据数组（按日期降序排序）
 */
export const loadBlogFiles = (): BlogItemProps[] => {
	const dirPath = path.join(process.cwd(), "src", "contents", "blog");

	if (!fs.existsSync(dirPath)) {
		console.warn("[Blog Service] Blog directory not found:", dirPath);
		return [];
	}

	const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".mdx"));

	const blogs = files.map((file) => {
		try {
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
		} catch (error) {
			console.error(`[Blog Service] Error processing MDX file "${file}":`, error);
			throw error;
		}
	});

	// 按日期排序（最新的在前）
	return blogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

/**
 * 带 Redis 缓存的博客数据获取
 * 优先从 Redis 缓存读取，未命中时从文件系统加载并缓存
 * @returns 博客数据数组
 */
export const getCachedBlogs = async (): Promise<BlogItemProps[]> => {
	try {
		const redis = getRedis();

		// 尝试从缓存获取
		const cached = await redis.get(BLOG_CACHE_KEY);
		if (cached) {
			console.log("[Blog Service] Cache hit for blog data");
			return JSON.parse(cached) as BlogItemProps[];
		}

		// 缓存未命中，从文件系统加载
		console.log("[Blog Service] Cache miss, loading from filesystem");
		const blogs = loadBlogFiles();

		// 写入缓存
		await redis.setex(BLOG_CACHE_KEY, BLOG_CACHE_TTL, JSON.stringify(blogs));
		console.log(`[Blog Service] Cached ${blogs.length} blog posts (TTL: ${BLOG_CACHE_TTL}s)`);

		return blogs;
	} catch (error) {
		// Redis 不可用时降级到文件系统读取
		console.warn("[Blog Service] Redis unavailable, falling back to filesystem:", error);
		return loadBlogFiles();
	}
};

/**
 * 博客数据查询（支持 id/slug 查询 + 列表过滤分页）
 * @param params 查询参数
 * @returns 查询结果（包含分页信息）
 */
export const getBlogs = async ({
	page = 1,
	per_page = 6,
	search = "",
	category = "",
	is_featured = undefined,
	id,
	slug,
}: GetBlogsParams = {}): Promise<GetBlogsResult> => {
	const blogs = await getCachedBlogs();

	// 如果指定了 id，返回单个博客
	if (id !== undefined) {
		const blog = blogs.find((b) => b.id === id);
		return {
			posts: blog ? [blog] : [],
			page: 1,
			per_page: 1,
			total_pages: blog ? 1 : 0,
			total_posts: blog ? 1 : 0,
		};
	}

	// 如果指定了 slug，返回单个博客
	if (slug) {
		const blog = blogs.find((b) => b.slug === slug);
		return {
			posts: blog ? [blog] : [],
			page: 1,
			per_page: 1,
			total_pages: blog ? 1 : 0,
			total_posts: blog ? 1 : 0,
		};
	}

	// 列表查询：应用过滤和分页
	let filteredBlogs = blogs;

	// 分类筛选
	if (category) {
		filteredBlogs = filteredBlogs.filter((blog) => blog.categories.includes(category));
	}

	// Featured 筛选
	if (is_featured !== undefined) {
		filteredBlogs = filteredBlogs.filter((blog) => blog.is_featured === is_featured);
	}

	// 搜索功能
	if (search) {
		const searchLower = search.toLowerCase();
		filteredBlogs = filteredBlogs.filter(
			(blog) =>
				blog.title.rendered.toLowerCase().includes(searchLower) ||
				blog.excerpt.rendered.toLowerCase().includes(searchLower) ||
				blog.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
		);
	}

	const total_posts = filteredBlogs.length;
	const total_pages = Math.ceil(total_posts / per_page);

	// 分页
	const start = (page - 1) * per_page;
	const paginatedBlogs = filteredBlogs.slice(start, start + per_page);

	return {
		posts: paginatedBlogs,
		page,
		per_page,
		total_pages,
		total_posts,
	};
};

/**
 * 启动时预热缓存
 * 在应用启动时调用，提前加载博客数据到 Redis
 * 注意：在 Next.js 开发模式下，每次 API 路由编译都会调用此函数
 * 这是正常行为，生产环境不会出现
 */
export const warmBlogCache = async (): Promise<void> => {
	try {
		const blogs = loadBlogFiles();
		const redis = getRedis();

		await redis.setex(BLOG_CACHE_KEY, BLOG_CACHE_TTL, JSON.stringify(blogs));
		// 只在开发模式下打印一次详细日志
		if (process.env.NODE_ENV === "production" || !(globalThis as any).__blogWarmLogPrinted) {
			(globalThis as any).__blogWarmLogPrinted = true;
			console.log(
				`[Blog Service] Cache warmed: ${blogs.length} blog posts cached (TTL: ${BLOG_CACHE_TTL}s)`,
			);
		}
	} catch (error) {
		// 预热失败不应阻塞应用启动
		console.error("[Blog Service] Failed to warm cache:", error);
	}
};
