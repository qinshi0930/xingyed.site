"use client";

import type { ReactNode } from "react";

import { createContext, use, useRef } from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/shallow";

import type { AuthState, AuthStoreType } from "./auth-store";

import { createAuthStore } from "./auth-store";

const AuthContext = createContext<ReturnType<typeof createAuthStore> | null>(null);

export function AuthProvider({
	children,
	initialToken = null,
}: {
	children: ReactNode;
	initialToken?: string | null;
}) {
	const storeRef = useRef<AuthStoreType>(null);
	if (!storeRef.current) storeRef.current = createAuthStore(initialToken);
	return <AuthContext value={storeRef.current}>{children}</AuthContext>;
}

export function useAuthStore() {
	const store = use(AuthContext);
	if (!store) throw new Error("useAuth must be used within AuthProvider");
	return store;
}

export function useAuthState<T>(selector: (state: AuthState) => T): T {
	const store = useAuthStore();
	return useStore(store, useShallow(selector));
}
