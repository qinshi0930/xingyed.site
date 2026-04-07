import { Hono } from "hono";

const app = new Hono().basePath("/api");

// 全局错误处理中间件
app.onError((err, c) => {
	console.error("API Error:", err);
	return c.json(
		{
			status: false,
			error: err.message || "Internal Server Error",
		},
		500,
	);
});

// 健康检查端点
app.get("/", (c) => {
	return c.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		version: "1.0.0",
	});
});

export default app;
