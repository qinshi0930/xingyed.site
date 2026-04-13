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

// 单例模式：延迟初始化 Redis 实例
let redisInstance: Redis | null = null;

/**
 * 获取 Redis 实例（延迟初始化）
 * 只有在调用此函数时才会创建 Redis 连接
 * 避免了模块级导入时的副作用
 */
export const getRedis = (): Redis => {
	if (!redisInstance) {
		const connectionUrl = getConnectionConfig();
		const clientOptions = getClientOptions();

		redisInstance = new Redis(connectionUrl, clientOptions);

		redisInstance.on("error", (err) => {
			console.error("Redis Client Error:", err);
		});

		redisInstance.on("connect", () => {
			console.log("Redis Client Connected");
		});

		// 优雅关闭：监听进程退出信号
		const gracefulShutdown = async (signal: string) => {
			console.log(`\n${signal} received. Closing Redis connection...`);
			try {
				if (redisInstance) {
					await redisInstance.quit();
					console.log("Redis connection closed gracefully.");
					redisInstance = null;
				}
			} catch (error) {
				console.error("Error closing Redis connection:", error);
				// 强制关闭
				if (redisInstance) {
					redisInstance.disconnect();
					redisInstance = null;
				}
			}
		};

		// 监听进程退出信号
		process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
		process.on("SIGINT", () => gracefulShutdown("SIGINT"));
	}

	return redisInstance;
};

/**
 * 关闭 Redis 连接
 */
export const closeRedis = async (): Promise<void> => {
	if (redisInstance) {
		try {
			await redisInstance.quit();
			console.log("Redis connection closed gracefully.");
		} catch (error) {
			console.error("Error closing Redis connection:", error);
			redisInstance.disconnect();
		}
		redisInstance = null;
	}
};
