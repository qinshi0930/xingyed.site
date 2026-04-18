import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	// 使用 Hono API 路由作为 baseURL
	baseURL: typeof window !== "undefined" ? window.location.origin : process.env.BETTER_AUTH_URL,
	plugins: [usernameClient()],
});

export const { useSession, signIn, signOut } = authClient;
