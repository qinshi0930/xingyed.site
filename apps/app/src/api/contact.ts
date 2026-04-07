import { Hono } from "hono";

import { sendMessage } from "@/services/contact";

const app = new Hono();

// POST /api/contact - 发送联系消息
app.post("/", async (c) => {
	try {
		// 修复bug：直接解构请求体，而非 { formData }
		const { name, email, message } = await c.req.json();

		// 验证必填字段
		if (!name || !email || !message) {
			return c.json(
				{
					status: false,
					error: "请填写所有必填字段",
				},
				400,
			);
		}

		// 发送邮件
		const response = await sendMessage({ name, email, message });

		if (response.status !== 200) {
			return c.json(
				{
					status: false,
					error: response.message || "邮件发送失败",
				},
				response.status as 400 | 500,
			);
		}

		return c.json({
			status: true,
			message: response.data?.message || "消息发送成功",
		});
	} catch (error) {
		console.error("Contact API error:", error);
		return c.json(
			{
				status: false,
				error: "服务器错误，请稍后重试",
			},
			500,
		);
	}
});

export default app;
