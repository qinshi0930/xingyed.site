import { createMiddleware } from "hono/factory";

import { auth } from "@/common/libs/auth";

export const authMiddleware = createMiddleware(async (c, next) => {
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session || !session.user) {
		return c.json({ success: false, error: "Unauthorized: GitHub login required" }, 401);
	}

	c.set("user", {
		id: session.user.id,
		name: session.user.name,
		email: session.user.email,
		image: session.user.image,
		githubUsername: session.user.username,
	});

	await next();
});
