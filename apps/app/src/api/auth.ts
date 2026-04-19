import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";

import { getDb } from "@/api/db";
import { authSchema } from "@/api/db/schema/auth-schema";

export const auth = betterAuth({
	database: drizzleAdapter(getDb(), {
		provider: "pg",
		usePlural: true,
		schema: authSchema,
	}),
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
