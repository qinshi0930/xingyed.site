import { Hono } from "hono";

import { auth } from "@/api/auth";

const authRoute = new Hono();

// GitHub OAuth 状态检查接口
authRoute.get("/github/status", async (c) => {
	const clientId = process.env.AUTH_GITHUB_CLIENT_ID;
	const clientSecret = process.env.AUTH_GITHUB_CLIENT_SECRET;

	const isEnabled = !!(clientId && clientSecret && clientId !== '""' && clientSecret !== '""');

	if (!isEnabled) {
		console.error(
			"[GitHub OAuth] Not configured: missing AUTH_GITHUB_CLIENT_ID or AUTH_GITHUB_CLIENT_SECRET",
		);
	}

	return c.json({ enabled: isEnabled });
});

// 将 Better Auth handler 挂载到 Hono 路由
authRoute.on(["POST", "GET"], "/*", async (c) => {
	return await auth.handler(c.req.raw);
});

export default authRoute;
