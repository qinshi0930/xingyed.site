import { Hono } from "hono";

import { getRedis, isRedisConfigured } from "@/api/services/redis";

const app = new Hono();

// GET /api/views - 获取浏览量
app.get("/", async (c) => {
	const url = new URL(c.req.url);
	const slug = url.searchParams.get("slug");

	if (!slug) {
		return c.json({ error: "slug parameter is required" }, 400);
	}

	if (!isRedisConfigured()) {
		// 浏览量依赖 Redis，未配置时返回 0 而不是让请求失败
		return c.json({ views: 0 });
	}

	try {
		const redis = getRedis();
		const views = await redis.get(`views:${slug}`);
		const viewsCount = views ? Number.parseInt(views, 10) : 0;

		return c.json({ views: viewsCount });
	} catch (error) {
		console.error("Failed to fetch views:", error);
		return c.json({ error: "Failed to fetch content meta" }, 500);
	}
});

// POST /api/views - 增加浏览量
app.post("/", async (c) => {
	const url = new URL(c.req.url);
	const slug = url.searchParams.get("slug");

	if (!slug) {
		return c.json({ error: "slug parameter is required" }, 400);
	}

	if (!isRedisConfigured()) {
		// 未配置 Redis：自增无法持久化，直接返回 0，不报错
		return c.json({ views: 0 });
	}

	try {
		const redis = getRedis();
		const views = await redis.incr(`views:${slug}`);
		return c.json({ views });
	} catch (error) {
		console.error("Failed to update views:", error);
		return c.json({ error: "Failed to update views count" }, 500);
	}
});

export default app;
