import { Hono } from "hono";

import { getBlogComment } from "@/services/devto";
import { cache } from "./middleware/cache";

const app = new Hono();

// GET /api/comments - 获取博客评论
app.get("/", cache(), async (c) => {
	try {
		const url = new URL(c.req.url);
		const post_id = url.searchParams.get("post_id");

		const response = await getBlogComment({
			post_id: post_id as string,
		});

		return c.json({
			status: true,
			data: response.data,
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
