import { Hono } from "hono";

import { getGithubUser } from "@/services/github";

import { cache } from "../middleware/cache";

const app = new Hono();

// GET /api/github - 获取GitHub用户信息
app.get("/", cache(), async (c) => {
	const url = new URL(c.req.url);
	const type = url.searchParams.get("type") || "";

	const response = await getGithubUser(type);

	return c.json(response.data, response.status as 200);
});

export default app;
