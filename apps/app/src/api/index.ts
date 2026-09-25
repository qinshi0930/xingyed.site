import { Hono } from "hono";
import { createMiddleware } from "hono/factory";

import { IS_READONLY_SITE } from "@/common/constant/site";

import authRoute from "./routes/auth";
import blogRoute from "./routes/blog";
import contactRoute from "./routes/contact";
import contentRoute from "./routes/content";
import githubRoute from "./routes/github";
import guestbookRoute from "./routes/guestbook";
import learnRoute from "./routes/learn";
import projectsRoute from "./routes/projects";
import viewsRoute from "./routes/views";
import { warmBlogCache } from "./services/blog";

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
app.get("/health", (c) => {
	return c.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		version: "1.0.0",
	});
});

// 只读镜像（Vercel）拦截依赖数据库的交互路由：
// 返回明确的 503，而不是让请求落到不可用的数据库上变成 500
const readOnlyGuard = createMiddleware(async (c, next) => {
	if (!IS_READONLY_SITE) return next();
	return c.json({ success: false, error: "该功能仅在主站提供，当前部署为只读镜像" }, 503);
});

if (IS_READONLY_SITE) {
	for (const path of ["/auth", "/auth/*", "/guestbook", "/guestbook/*"]) {
		app.use(path, readOnlyGuard);
	}
}

// 挂载子路由
app.route("/auth", authRoute);
app.route("/blog", blogRoute);
app.route("/contact", contactRoute);
app.route("/content", contentRoute);
app.route("/github", githubRoute);
app.route("/guestbook", guestbookRoute);
app.route("/learn", learnRoute);
app.route("/projects", projectsRoute);
app.route("/views", viewsRoute);

// 启动时预热博客缓存（异步，不阻塞应用启动）
warmBlogCache().catch((err) => {
	console.error("[API] Failed to warm blog cache:", err);
});

export default app;
