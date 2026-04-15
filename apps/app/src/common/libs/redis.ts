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

// 单例模式：使用 globalThis 确保在 Next.js 开发模式的模块重载中保持同一个实例
// 这样避免了每次模块重新加载时创建新的 Redis 连接
declare global {
	let __redisInstance: Redis | null;
	let __redisListenersRegistered: boolean;
}

const getGlobalThis = () => {
	if (!(globalThis as any).__redisInstance) {
		(globalThis as any).__redisInstance = null;
	}
	if (!(globalThis as any).__redisListenersRegistered) {
		(globalThis as any).__redisListenersRegistered = false;
	}
	return globalThis as any;
};

/**
 * 获取 Redis 实例（延迟初始化）
 * 只有在调用此函数时才会创建 Redis 连接
 * 避免了模块级导入时的副作用
 *
 * 使用 globalThis 存储单例，确保在 Next.js 开发模式下模块重载时复用同一实例
 */
export const getRedis = (): Redis => {
	const g = getGlobalThis();

	if (!g.__redisInstance) {
		const connectionUrl = getConnectionConfig();
		const clientOptions = getClientOptions();

		g.__redisInstance = new Redis(connectionUrl, clientOptions);

		g.__redisInstance.on("error", (err: Error) => {
			console.error("Redis Client Error:", err);
		});

		g.__redisInstance.on("connect", () => {
			console.log("Redis Client Connected");
		});

		// 优雅关闭：监听进程退出信号
		// 使用 globalThis 存储实例引用，避免闭包问题
		const gracefulShutdown = async (signal: string) => {
			console.log(`\n${signal} received. Closing Redis connection...`);
			try {
				if (g.__redisInstance) {
					await g.__redisInstance.quit();
					console.log("Redis connection closed gracefully.");
					g.__redisInstance = null;
				}
			} catch (error) {
				console.error("Error closing Redis connection:", error);
				// 强制关闭
				if (g.__redisInstance) {
					g.__redisInstance.disconnect();
					g.__redisInstance = null;
				}
			}
		};

		// 只在首次注册事件监听器，避免重复注册
		if (!g.__redisListenersRegistered) {
			g.__redisListenersRegistered = true;
			process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
			process.on("SIGINT", () => gracefulShutdown("SIGINT"));
		}
	}

	return g.__redisInstance;
};

/**
 * 关闭 Redis 连接
 * 注意：不会清理 globalThis 中的标记，因为进程即将退出
 */
export const closeRedis = async (): Promise<void> => {
	const g = getGlobalThis();

	if (g.__redisInstance) {
		try {
			await g.__redisInstance.quit();
			console.log("Redis connection closed gracefully.");
		} catch (error) {
			console.error("Error closing Redis connection:", error);
			g.__redisInstance.disconnect();
		}
		g.__redisInstance = null;
	}
};

/**
 * 清理 globalThis 中的 Redis 相关标记
 * 仅用于测试环境或需要完全重置的场景
 * 生产环境和开发环境不需要调用此函数
 */
export const cleanupRedisGlobalState = (): void => {
	const g = globalThis as any;
	if (g.__redisInstance) {
		console.warn("[Redis] Cleaning up active Redis instance");
		g.__redisInstance.disconnect();
	}
	g.__redisInstance = null;
	g.__redisListenersRegistered = false;
};
