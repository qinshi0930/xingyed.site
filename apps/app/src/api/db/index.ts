import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// 扩展 globalThis 类型以支持数据库单例
declare global {
	var __db: ReturnType<typeof drizzle> | undefined;
	var __dbClient: ReturnType<typeof postgres> | undefined;
}

/**
 * 获取数据库实例（单例）
 * - 构建时：不执行任何操作
 * - 运行时：首次调用时创建连接，后续调用返回缓存实例
 */
function getDb() {
	if (!globalThis.__db) {
		const connectionString = process.env.DATABASE_URL;
		if (!connectionString) {
			throw new Error("Missing DATABASE_URL environment variable");
		}

		// 创建数据库连接
		globalThis.__dbClient = postgres(connectionString, {
			max: 10, // 最大连接数
			idle_timeout: 20, // 空闲连接超时（秒）
			connect_timeout: 10, // 连接超时（秒）
		});

		// 创建 Drizzle ORM 实例
		globalThis.__db = drizzle(globalThis.__dbClient);
	}

	return globalThis.__db;
}

/**
 * 数据库代理对象
 * - 透明转发所有操作到 getDb() 返回的实例
 * - 保持原有 API 不变：db.select(), db.insert() 等
 */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
	get: (_, prop) => {
		const database = getDb();
		return database[prop as keyof typeof database];
	},
});

/**
 * 优雅关闭数据库连接
 * - 清除 globalThis 缓存
 * - 允许重新初始化（开发模式热重载）
 */
export const closeDb = async () => {
	if (globalThis.__dbClient) {
		await globalThis.__dbClient.end();
		globalThis.__db = undefined;
		globalThis.__dbClient = undefined;
	}
};

// 导出 getDb 函数供 auth.ts 使用
export { getDb };
