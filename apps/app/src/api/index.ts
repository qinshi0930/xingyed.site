import { Hono } from "hono";

import blogRoute from "./routes/blog";
import commentsRoute from "./routes/comments";
import contactRoute from "./routes/contact";
import contentRoute from "./routes/content";
import githubRoute from "./routes/github";
import guestbookRoute from "./routes/guestbook";
import learnRoute from "./routes/learn";
import projectsRoute from "./routes/projects";
import readStatsRoute from "./routes/read-stats";
import spotifyRoute from "./routes/spotify";
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

// 挂载子路由
app.route("/blog", blogRoute);
app.route("/comments", commentsRoute);
app.route("/contact", contactRoute);
app.route("/content", contentRoute);
app.route("/github", githubRoute);
app.route("/guestbook", guestbookRoute);
app.route("/learn", learnRoute);
app.route("/projects", projectsRoute);
app.route("/read-stats", readStatsRoute);
app.route("/spotify", spotifyRoute);
app.route("/views", viewsRoute);

// 启动时预热博客缓存（异步，不阻塞应用启动）
warmBlogCache().catch((err) => {
	console.error("[API] Failed to warm blog cache:", err);
});

export default app;
