import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { getMdxFileCount } from "@/common/libs/mdx";

import { cache } from "../middleware/cache";

const app = new Hono();

// GET /api/learn - 获取学习模块文件数量
// slug 必填：缺失时返回 400，而不是让文件系统抛出 ENOENT 变成 500
const querySchema = z.object({
	slug: z.string().min(1, "slug parameter is required"),
});

app.get("/", zValidator("query", querySchema), cache(), async (c) => {
	const { slug } = c.req.valid("query");
	const count = await getMdxFileCount(`learn/${slug}`);

	return c.json({ count });
});

export default app;
