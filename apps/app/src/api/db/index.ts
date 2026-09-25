import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	// 刻意不在这里抛错：本模块会被 API 路由在构建期和运行期导入，
	// 一旦抛错，整个 API 图（包括不依赖数据库的 /api/blog、/api/health）都会一起挂掉。
	// 只读镜像（Vercel）就是这种情况——依赖数据库的路由已由 api/index.ts 的
	// readOnlyGuard 拦下，不会走到这里真正建连。
	console.warn("[db] 未配置 DATABASE_URL，数据库相关功能不可用");
}

// postgres() 会即时解析连接串，缺省时给一个不会被真正使用的占位值
const client = postgres(connectionString || "postgresql://unused:unused@127.0.0.1:5432/unused", {
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
