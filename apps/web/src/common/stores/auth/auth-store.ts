import { createStore } from "zustand/vanilla";

export interface AuthState {
	token: string | null;
	setToken: (token: string | null) => void;
	clearToken: () => void;
}

export const createAuthStore = (initialToken: string | null = null) =>
	createStore<AuthState>((set) => ({
		token: initialToken,
		setToken: (token) => set({ token }),
		clearToken: () => set({ token: null }),
	}));

export type AuthStoreType = ReturnType<typeof createAuthStore>;
