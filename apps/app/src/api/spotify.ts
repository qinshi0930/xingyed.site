import { Hono } from "hono";

import { getAvailableDevices, getNowPlaying } from "@/services/spotify";
import { cache } from "./middleware/cache";

const app = new Hono();

// GET /api/spotify/now-playing - 获取当前播放信息
app.get("/now-playing", cache(), async (c) => {
	const response = await getNowPlaying();

	return c.json(response?.data);
});

// GET /api/spotify/available-devices - 获取可用设备列表
app.get("/available-devices", cache(), async (c) => {
	const response = await getAvailableDevices();

	return c.json(response?.data);
});

export default app;
