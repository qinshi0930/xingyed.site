import type { Context, Next } from "hono";

/**
 * HTTP缓存中间件
 * 
 * 为响应添加 Cache-Control 头
 * 
 * @param maxAge - s-maxage 时间（秒），默认60
 * @param staleWhileRevalidate - stale-while-revalidate 时间（秒），默认30
 * 
 * @example
 * // 使用默认缓存时间（60s + 30s）
 * app.get("/data", cache(), handler);
 * 
 * @example
 * // 自定义缓存时间（5分钟 + 1分钟）
 * app.get("/data", cache(300, 60), handler);
 */
export const cache = (maxAge = 60, staleWhileRevalidate = 30) => {
	return async (c: Context, next: Next) => {
		await next();
		c.header(
			"Cache-Control",
			`public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
		);
	};
};
