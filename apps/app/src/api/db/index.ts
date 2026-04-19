import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
	throw new Error("Missing DATABASE_URL environment variable");
}

// 配置连接池参数
const client = postgres(connectionString, {
	max: 10, // 最大连接数
	idle_timeout: 20, // 空闲连接超时（秒）
	connect_timeout: 10, // 连接超时（秒）
});

export const db = drizzle(client);

/**
 * 优雅关闭数据库连接
 * 在应用退出时调用
 */
export const closeDb = async () => {
	await client.end();
};
