import { zValidator } from "@hono/zod-validator";
import { count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/api/db";
import { guestbookMessages } from "@/api/db/schema/guestbook-schema";
import { authMiddleware } from "@/api/middleware/auth";
import "@/api/types/hono";

const guestbookRoute = new Hono();

type GuestbookRow = typeof guestbookMessages.$inferSelect;

// 统一转换为对外的 snake_case 结构，保持既有 API 契约不变
const toApiMessage = (row: GuestbookRow) => ({
	id: row.id,
	user_id: row.userId,
	user_name: row.userName,
	user_image: row.userImage ?? null,
	github_username: row.githubUsername,
	content: row.content,
	created_at: row.createdAt ? row.createdAt.toISOString() : null,
	updated_at: row.updatedAt ? row.updatedAt.toISOString() : null,
});

// 查询留言列表（公开接口，不需要鉴权）
const listQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(20),
	offset: z.coerce.number().int().min(0).default(0),
});

guestbookRoute.get("/", zValidator("query", listQuerySchema), async (c) => {
	const { limit, offset } = c.req.valid("query");

	try {
		const [rows, totalRows] = await Promise.all([
			db
				.select()
				.from(guestbookMessages)
				.orderBy(desc(guestbookMessages.createdAt))
				.limit(limit)
				.offset(offset),
			db.select({ total: count() }).from(guestbookMessages),
		]);

		return c.json({
			success: true,
			data: { items: rows.map(toApiMessage), total: totalRows[0]?.total ?? 0 },
		});
	} catch (error) {
		console.error("Failed to list messages:", error);
		return c.json({ success: false, error: "Failed to list messages" }, 500);
	}
});

// 创建留言
const createMessageSchema = z.object({
	message: z.string().min(1, "Message is required").max(1000),
});

guestbookRoute.post("/", authMiddleware, zValidator("json", createMessageSchema), async (c) => {
	const user = c.get("user");
	const { message } = c.req.valid("json");

	try {
		const inserted = await db
			.insert(guestbookMessages)
			.values({
				userId: user.id,
				userName: user.name,
				userImage: user.image ?? null,
				// 使用 username 或 name 作为 github_username 的 fallback
				githubUsername: user.githubUsername || user.name || "unknown",
				content: message.trim(),
			})
			.returning();

		const row = inserted[0];
		if (!row) {
			return c.json({ success: false, error: "Failed to create message" }, 500);
		}

		return c.json({ success: true, data: toApiMessage(row) }, 201);
	} catch (error) {
		console.error("Failed to create message:", error);
		return c.json({ success: false, error: "Failed to create message" }, 500);
	}
});

// 路径参数校验：非 UUID 直接返回 400，避免落到数据库报类型错误
const messageIdParamSchema = z.object({ id: z.uuid() });

// 更新留言
const updateMessageSchema = z.object({
	message: z.string().min(1, "Message is required").max(1000),
});

guestbookRoute.put(
	"/:id",
	authMiddleware,
	zValidator("param", messageIdParamSchema),
	zValidator("json", updateMessageSchema),
	async (c) => {
		const user = c.get("user");
		const { id: messageId } = c.req.valid("param");
		const { message } = c.req.valid("json");

		try {
			const existing = await db
				.select({ userId: guestbookMessages.userId })
				.from(guestbookMessages)
				.where(eq(guestbookMessages.id, messageId))
				.limit(1);

			if (!existing[0]) {
				return c.json({ success: false, error: "Message not found" }, 404);
			}

			if (existing[0].userId !== user.id) {
				return c.json(
					{ success: false, error: "Forbidden: You can only edit your own messages" },
					403,
				);
			}

			const updated = await db
				.update(guestbookMessages)
				.set({ content: message.trim(), updatedAt: new Date() })
				.where(eq(guestbookMessages.id, messageId))
				.returning();

			const row = updated[0];
			if (!row) {
				return c.json({ success: false, error: "Failed to update message" }, 500);
			}

			return c.json({ success: true, data: toApiMessage(row) });
		} catch (error) {
			console.error("Failed to update message:", error);
			return c.json({ success: false, error: "Failed to update message" }, 500);
		}
	},
);

// 删除留言
guestbookRoute.delete(
	"/:id",
	authMiddleware,
	zValidator("param", messageIdParamSchema),
	async (c) => {
		const user = c.get("user");
		const { id: messageId } = c.req.valid("param");

		try {
			const existing = await db
				.select({ userId: guestbookMessages.userId })
				.from(guestbookMessages)
				.where(eq(guestbookMessages.id, messageId))
				.limit(1);

			if (!existing[0]) {
				return c.json({ success: false, error: "Message not found" }, 404);
			}

			if (existing[0].userId !== user.id) {
				return c.json(
					{ success: false, error: "Forbidden: You can only delete your own messages" },
					403,
				);
			}

			await db.delete(guestbookMessages).where(eq(guestbookMessages.id, messageId));

			return c.json({ success: true, message: "Message deleted successfully" });
		} catch (error) {
			console.error("Failed to delete message:", error);
			return c.json({ success: false, error: "Failed to delete message" }, 500);
		}
	},
);

export default guestbookRoute;
