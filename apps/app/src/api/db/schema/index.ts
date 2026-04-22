// 统一的 Schema 入口文件
// 导出所有数据库表定义，供 Drizzle ORM 使用

import { authSchema } from "./auth-schema";
import { guestbookSchema } from "./guestbook-schema";

// 合并所有 schema
export const schema = {
	...authSchema,
	...guestbookSchema,
};

// 从 auth-schema 导出（按字母顺序）
export { accounts, authSchema, sessions, users, verifications } from "./auth-schema";

// 从 guestbook-schema 导出（按字母顺序）
export { guestbookMessages, guestbookSchema } from "./guestbook-schema";
