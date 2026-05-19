import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";

import { db } from "@/api/db";
import { authSchema } from "@/api/db/schema/auth-schema";

// 从 BETTER_AUTH_URL 推导 base URL 与主域，用于显式配置 trustedOrigins 与跨子域 Cookie
// 避免仅依赖框架隐式读取环境变量导致运行时不一致
const baseURL = process.env.BETTER_AUTH_URL;
const rootDomain = (() => {
	if (!baseURL) return undefined;
	try {
		const { hostname } = new URL(baseURL);
		if (hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return undefined;
		const parts = hostname.split(".");
		return parts.length >= 2 ? `.${parts.slice(-2).join(".")}` : undefined;
	} catch {
		return undefined;
	}
})();

export const auth = betterAuth({
	// 显式 baseURL，避免运行时推断错误
	baseURL,
	// 显式 secret，与环境变量解耦，缺失时也能在启动阶段明确报错
	secret: process.env.BETTER_AUTH_SECRET,
	// 信任的 origin 白名单（用于 OAuth 回调与 CSRF 校验）
	trustedOrigins: baseURL ? [baseURL] : undefined,
	database: drizzleAdapter(db, {
		provider: "pg",
		usePlural: true,
		schema: authSchema,
	}),
	session: {
		// 开启 cookie 缓存，避免每次 getSession 打 DB，减少 Supabase 抖动导致的偶发未登录误判
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60, // 5 分钟
		},
	},
	advanced: {
		// 跨子域共享 Cookie（例如灵活部署下 preview.xingyed.xyz 与 xingyed.xyz 共享登录态）
		...(rootDomain
			? {
					crossSubDomainCookies: {
						enabled: true,
						domain: rootDomain,
					},
				}
			: {}),
	},
	plugins: [nextCookies(), username({ minUsernameLength: 8, maxUsernameLength: 32 })],
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		// 仅在提供了有效的 GitHub OAuth 配置时才启用
		// 使用 AUTH_GITHUB_ 前缀避免与 GitHub Actions 系统变量冲突
		...(process.env.AUTH_GITHUB_CLIENT_ID && process.env.AUTH_GITHUB_CLIENT_SECRET
			? {
					github: {
						clientId: process.env.AUTH_GITHUB_CLIENT_ID,
						clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET,
					},
				}
			: {}),
	},
});
