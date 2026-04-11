import type { RedisOptions } from "ioredis";

import Redis from "ioredis";

// Redis 连接配置（统一返回 URL 字符串）
const getConnectionConfig = (): string => {
	const redisUrl = process.env.REDIS_URL;

	if (redisUrl) {
		// 使用 URL 连接方式
		return redisUrl;
	}

	// 向后兼容：将独立变量拼接为 URL 字符串
	const host = process.env.REDIS_HOST || "localhost";
	const port = Number(process.env.REDIS_PORT) || 6379;
	const password = process.env.REDIS_PASSWORD;
	const db = Number(process.env.REDIS_DB) || 0;

	// 构建 URL: redis://[:password@]host:port[/db]
	const authPart = password ? `:${password}@` : "";
	return `redis://${authPart}${host}:${port}/${db}`;
};

// Redis 客户端选项（重试策略等）
const getClientOptions = (): RedisOptions => ({
	retryStrategy(times) {
		const delay = Math.min(times * 50, 2000);
		return delay;
	},
	maxRetriesPerRequest: 3,
});

// 创建 Redis 实例
const connectionUrl = getConnectionConfig();
const clientOptions = getClientOptions();

const redis = new Redis(connectionUrl, clientOptions);

redis.on("error", (err) => {
	console.error("Redis Client Error:", err);
});

redis.on("connect", () => {
	console.log("Redis Client Connected");
});

// 优雅关闭：监听进程退出信号
const gracefulShutdown = async (signal: string) => {
	console.log(`\n${signal} received. Closing Redis connection...`);
	try {
		await redis.quit();
		console.log("Redis connection closed gracefully.");
	} catch (error) {
		console.error("Error closing Redis connection:", error);
		// 强制关闭
		redis.disconnect();
	}
};

// 监听进程退出信号
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// 暴露关闭方法（供测试或手动调用）
export const closeRedis = async () => {
	await gracefulShutdown("Manual");
};

export default redis;
