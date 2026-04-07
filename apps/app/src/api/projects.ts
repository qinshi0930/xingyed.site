import { Hono } from "hono";

import { PROJECT_CONTENTS } from "@/common/constant/projects";
import { cache } from "./middleware/cache";

const app = new Hono();

// GET /api/projects - 获取项目列表
app.get("/", cache(), (c) => {
	try {
		const response = PROJECT_CONTENTS.filter((p) => p.is_show);
		return c.json({
			status: true,
			data: response,
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
