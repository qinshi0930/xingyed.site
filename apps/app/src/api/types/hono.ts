import type { ContextVariableMap } from "hono";

// 扩展 Hono 的 Context 类型
declare module "hono" {
	interface ContextVariableMap {
		user: {
			id: string;
			name: string;
			email: string;
			image: string | null | undefined;
			githubUsername: string | null | undefined;
		};
	}
}

export type UserContext = ContextVariableMap["user"];
