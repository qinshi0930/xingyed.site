import { Hono } from "hono";

import blogRoute from "./blog";
import commentsRoute from "./comments";
import contactRoute from "./contact";
import contentRoute from "./content";
import githubRoute from "./github";
import learnRoute from "./learn";
import projectsRoute from "./projects";
import readStatsRoute from "./read-stats";
import spotifyRoute from "./spotify";
import viewsRoute from "./views";

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

// 挂载子路由
app.route("/blog", blogRoute);
app.route("/comments", commentsRoute);
app.route("/contact", contactRoute);
app.route("/content", contentRoute);
app.route("/github", githubRoute);
app.route("/learn", learnRoute);
app.route("/projects", projectsRoute);
app.route("/read-stats", readStatsRoute);
app.route("/spotify", spotifyRoute);
app.route("/views", viewsRoute);

export default app;
