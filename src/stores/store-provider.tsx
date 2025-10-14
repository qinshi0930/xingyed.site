import type { ReactNode } from "react";

import { AuthProvider } from "./auth/auth-provider";
import { ThemeBridge } from "./theme/theme-birdge";
import { ThemeProvider } from "./theme/theme-provider";

export function AppStoreProvider({
	children,
	initialTheme,
	initialToken,
}: {
	children: ReactNode;
	initialTheme?: "light" | "dark";
	initialToken?: string | null;
}) {
	return (
		<ThemeProvider initialTheme={initialTheme}>
			<AuthProvider initialToken={initialToken}>
				<ThemeBridge />
				{children}
			</AuthProvider>
		</ThemeProvider>
	);
}
