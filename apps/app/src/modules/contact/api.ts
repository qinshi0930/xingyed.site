import { Hono } from "hono";

import { sendContactEmail } from "./service";

const app = new Hono();

app.post("/", async (c) => {
	try {
		const body = await c.req.json();
		const { name, email, message } = body;

		// 验证
		if (!name || !email || !message) {
			return c.json(
				{
					status: false,
					error: "Missing required fields",
				},
				400,
			);
		}

		await sendContactEmail({ name, email, message });

		return c.json({
			status: true,
			message: "Message sent successfully",
		});
	} catch {
		return c.json(
			{
				status: false,
				error: "Failed to send message",
			},
			500,
		);
	}
});

export default app;
