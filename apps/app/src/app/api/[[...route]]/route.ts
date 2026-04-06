import { Hono } from "hono";
import { handle } from "hono/vercel";

import blogRoute from "@/modules/blog/api";
import contactRoute from "@/modules/contact/api";

const app = new Hono().basePath("/api");

// 挂载子路由
app.route("/blog", blogRoute);
app.route("/contact", contactRoute);

// 健康检查
app.get("/", (c) => {
	return c.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		version: "1.0.0",
	});
});

// 导出所有 HTTP 方法
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
