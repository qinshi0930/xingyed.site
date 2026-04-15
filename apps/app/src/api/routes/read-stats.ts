import { Hono } from "hono";

import { getALLTimeSinceToday, getReadStats } from "@/services/wakatime";

import { cache } from "../middleware/cache";

const app = new Hono();

// GET /api/read-stats - 获取阅读统计（WakaTime）
app.get("/", cache(), async (c) => {
	try {
		const readStatsResponse = await getReadStats();
		const allTimeSinceTodayResponse = await getALLTimeSinceToday();

		const data = {
			...readStatsResponse.data,
			all_time_since_today: allTimeSinceTodayResponse.data,
		};

		return c.json(data);
		// eslint-disable-next-line unused-imports/no-unused-vars
	} catch (error) {
		return c.json(
			{
				message: "Internal Server Error",
			},
			500,
		);
	}
});

export default app;
