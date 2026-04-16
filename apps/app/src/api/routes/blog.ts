import { Hono } from "hono";

import { getBlogs } from "@/api/services/blog";

import { cache } from "../middleware/cache";

const app = new Hono();

// GET /api/blog - 获取博客列表（支持分页、搜索、分类）或单个博客（id/slug）
app.get("/", cache(), async (c) => {
	try {
		const url = new URL(c.req.url);
		const page = Number(url.searchParams.get("page")) || 1;
		const per_page = Number(url.searchParams.get("per_page")) || 9;
		const search = url.searchParams.get("search") || "";
		const category = url.searchParams.get("category") || "";
		const id = url.searchParams.get("id") ? Number(url.searchParams.get("id")) : undefined;
		const slug = url.searchParams.get("slug") || undefined;

		// 特殊处理 featured（categories=16 映射为 is_featured）
		const categories = url.searchParams.get("categories");
		const is_featured = categories === "16" ? true : undefined;

		const data = await getBlogs({
			page,
			per_page,
			search,
			category,
			is_featured,
			id,
			slug,
		});

		return c.json({
			status: true,
			data,
		});
	} catch (error) {
		return c.json(
			{
				status: false,
				error: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

export default app;
