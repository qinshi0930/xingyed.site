"use client";

import type { ReactNode } from "react";

import { createContext, use, useRef } from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/shallow";

import type { ThemeState, ThemeStoreType } from "./theme-store";

import { createThemeStore } from "./theme-store";

const ThemeContext = createContext<ReturnType<typeof createThemeStore> | null>(null);

export function ThemeProvider({
	children,
	initialTheme = "light",
}: {
	children: ReactNode;
	initialTheme?: "light" | "dark";
}) {
	const storeRef = useRef<ThemeStoreType>(null);
	if (!storeRef.current) storeRef.current = createThemeStore(initialTheme);
	return <ThemeContext value={storeRef.current}>{children}</ThemeContext>;
}

export function useThemeStore() {
	const store = use(ThemeContext);
	if (!store) throw new Error("useTheme must be used within ThemeProvider");
	return store;
}

export function useThemeState<T>(selector: (state: ThemeState) => T): T {
	const store = useThemeStore();
	return useStore(store, useShallow(selector));
}
