import { Hono } from "hono";

import { getMdxFileCount } from "@/common/libs/mdx";

import { cache } from "./middleware/cache";

const app = new Hono();

// GET /api/learn - 获取学习模块文件数量
app.get("/", cache(), async (c) => {
	const url = new URL(c.req.url);
	const slug = url.searchParams.get("slug") as string;
	const count = await getMdxFileCount(`learn/${slug}`);

	return c.json({ count });
});

export default app;
