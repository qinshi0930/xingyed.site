import type { ReactNode } from "react";

import { TooltipProvider } from "@/app/_components/shadcn/ui/tooltip";

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
				<TooltipProvider>
					<ThemeBridge />
					{children}
				</TooltipProvider>
			</AuthProvider>
		</ThemeProvider>
	);
}
