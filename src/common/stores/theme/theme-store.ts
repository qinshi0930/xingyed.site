import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

export interface ThemeState {
	theme: "light" | "dark";
	setTheme: (t: "light" | "dark") => void;
	toggleTheme: () => void;
}

export const createThemeStore = (initialTheme: "light" | "dark" = "light") => {
	// console.log(`createThemeStore initialTheme=${initialTheme}`);
	const store = createStore<ThemeState>()(
		persist(
			(set) => ({
				theme: initialTheme,
				setTheme: (t) => set({ theme: t }),
				toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
			}),
			{
				name: "theme",
			},
		),
	);

	return store;
};

export type ThemeStoreType = ReturnType<typeof createThemeStore>;
