import { Hono } from "hono";

import { loadMdxFiles } from "@/common/libs/mdx";

import { cache } from "../middleware/cache";

const app = new Hono();

// GET /api/content - 获取学习内容列表
app.get("/", cache(), async (c) => {
	const url = new URL(c.req.url);
	const category = url.searchParams.get("category");
	const contentList = await loadMdxFiles(`learn/${category}`);

	const data = contentList.map((item) => ({
		id: item?.frontMatter?.id,
		parent_slug: category || "",
		slug: item.slug || "",
		title: item.frontMatter.title || "",
	}));

	return c.json({ data });
});

export default app;
