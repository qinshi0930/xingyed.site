import type { ReactNode } from "react";

import { ThemeProvider } from "next-themes";

import { TooltipProvider } from "@/common/components/shadcn/ui/tooltip";

import { AuthProvider } from "./auth/auth-provider";

export function AppStoreProvider({
	children,
	initialToken,
}: {
	children: ReactNode;
	initialTheme?: "light" | "dark";
	initialToken?: string | null;
}) {
	return (
		<ThemeProvider enableSystem={false} attribute={"class"}>
			<AuthProvider initialToken={initialToken}>
				<TooltipProvider>{children}</TooltipProvider>
			</AuthProvider>
		</ThemeProvider>
	);
}
