import Redis from "ioredis";

// 支持两种配置方式：
// 1. REDIS_URL (推荐): redis://[:password@]host:port[/db]
// 2. 独立变量: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB (向后兼容)
const getRedisConfig = () => {
	const redisUrl = process.env.REDIS_URL;
	
	if (redisUrl) {
		// 使用 URL 连接方式
		return redisUrl;
	}
	
	// 向后兼容：使用独立变量
	return {
		host: process.env.REDIS_HOST || "localhost",
		port: Number(process.env.REDIS_PORT) || 6379,
		password: process.env.REDIS_PASSWORD || undefined,
		db: Number(process.env.REDIS_DB) || 0,
	};
};

const redis = new Redis(getRedisConfig(), {
	retryStrategy(times) {
		const delay = Math.min(times * 50, 2000);
		return delay;
	},
	maxRetriesPerRequest: 3,
});

redis.on("error", (err) => {
	console.error("Redis Client Error:", err);
});

redis.on("connect", () => {
	console.log("Redis Client Connected");
});

export default redis;
