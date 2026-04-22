import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./auth-schema";

export const guestbookMessages = pgTable(
	"guestbook_messages",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		userName: text("user_name").notNull(),
		userImage: text("user_image"),
		githubUsername: text("github_username").notNull(),
		content: text("content").notNull(),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(table) => [
		index("idx_guestbook_created_at").on(table.createdAt.desc()),
		index("idx_guestbook_user_id").on(table.userId),
	],
);

export const guestbookMessagesRelations = relations(guestbookMessages, ({ one }) => ({
	user: one(users, {
		fields: [guestbookMessages.userId],
		references: [users.id],
	}),
}));

// 聚合导出 guestbook schema
export const guestbookSchema = {
	guestbookMessages,
	guestbookMessagesRelations,
};
