import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { authMiddleware } from "@/api/middleware/auth";
import { supabaseServerClient } from "@/common/libs/supabase-server";

const guestbookRoute = new Hono();

// 创建留言
const createMessageSchema = z.object({
	message: z.string().min(1, "Message is required").max(1000),
});

guestbookRoute.post("/", authMiddleware, zValidator("json", createMessageSchema), async (c) => {
	const user = c.get("user");
	const { message } = c.req.valid("json");

	const { data, error } = await supabaseServerClient
		.from("guestbook_messages")
		.insert({
			user_id: user.id,
			user_name: user.name,
			user_image: user.image,
			github_username: user.githubUsername,
			content: message.trim(),
		})
		.select()
		.single();

	if (error) {
		console.error("Failed to create message:", error);
		return c.json({ success: false, error: "Failed to create message" }, 500);
	}

	return c.json({ success: true, data }, 201);
});

// 更新留言
const updateMessageSchema = z.object({
	message: z.string().min(1, "Message is required").max(1000),
});

guestbookRoute.put("/:id", authMiddleware, zValidator("json", updateMessageSchema), async (c) => {
	const user = c.get("user");
	const messageId = c.req.param("id");
	const { message } = c.req.valid("json");

	// 验证作者身份
	const { data: existingMessage } = await supabaseServerClient
		.from("guestbook_messages")
		.select("user_id")
		.eq("id", messageId)
		.single();

	if (!existingMessage) {
		return c.json({ success: false, error: "Message not found" }, 404);
	}

	if (existingMessage.user_id !== user.id) {
		return c.json(
			{ success: false, error: "Forbidden: You can only edit your own messages" },
			403,
		);
	}

	const { data, error } = await supabaseServerClient
		.from("guestbook_messages")
		.update({ content: message.trim(), updated_at: new Date().toISOString() })
		.eq("id", messageId)
		.select()
		.single();

	if (error) {
		console.error("Failed to update message:", error);
		return c.json({ success: false, error: "Failed to update message" }, 500);
	}

	return c.json({ success: true, data });
});

// 删除留言
guestbookRoute.delete("/:id", authMiddleware, async (c) => {
	const user = c.get("user");
	const messageId = c.req.param("id");

	// 验证作者身份
	const { data: existingMessage } = await supabaseServerClient
		.from("guestbook_messages")
		.select("user_id")
		.eq("id", messageId)
		.single();

	if (!existingMessage) {
		return c.json({ success: false, error: "Message not found" }, 404);
	}

	if (existingMessage.user_id !== user.id) {
		return c.json(
			{ success: false, error: "Forbidden: You can only delete your own messages" },
			403,
		);
	}

	const { error } = await supabaseServerClient
		.from("guestbook_messages")
		.delete()
		.eq("id", messageId);

	if (error) {
		console.error("Failed to delete message:", error);
		return c.json({ success: false, error: "Failed to delete message" }, 500);
	}

	return c.json({ success: true, message: "Message deleted successfully" });
});

export default guestbookRoute;
