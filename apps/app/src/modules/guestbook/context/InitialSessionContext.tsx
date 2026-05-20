"use client";

import type { ReactNode } from "react";

import { createContext, use } from "react";

import type { auth } from "@/api/auth";

// SSR 预取的 session 类型，复用 Better Auth 服务端 getSession 推断
export type InitialSession = Awaited<ReturnType<typeof auth.api.getSession>>;

const InitialSessionContext = createContext<InitialSession>(null);

interface InitialSessionProviderProps {
	value: InitialSession;
	children: ReactNode;
}

export const InitialSessionProvider = ({ value, children }: InitialSessionProviderProps) => (
	<InitialSessionContext value={value}>{children}</InitialSessionContext>
);

// 读取 SSR 预取的 session；客户端组件可用其作为 useSession() 的渲染层 fallback，消除 hydration 闪烁
export const useInitialSession = () => use(InitialSessionContext);
