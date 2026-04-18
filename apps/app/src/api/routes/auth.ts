import { Hono } from "hono";

import { auth } from "@/api/auth";

const authRoute = new Hono();

// 将 Better Auth handler 挂载到 Hono 路由
authRoute.on(["POST", "GET"], "/*", async (c) => {
	return await auth.handler(c.req.raw);
});

export default authRoute;
