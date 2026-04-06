import Redis from "ioredis";

const redis = new Redis({
	host: process.env.REDIS_HOST || "localhost",
	port: Number(process.env.REDIS_PORT) || 6379,
	password: process.env.REDIS_PASSWORD,
	db: Number(process.env.REDIS_DB) || 0,
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
