"use client";

import { useEffect } from "react";

import { Switch } from "@/app/_components/shadcn/ui/switch";
import { useThemeState } from "@/stores/theme/theme-provider";

export default function ThemeToggle() {
	const theme = useThemeState((s) => s.theme);
	const toggleTheme = useThemeState((s) => s.toggleTheme);

	useEffect(() => {
		document.documentElement.classList.toggle("dark", theme === "dark");
		document.documentElement.setAttribute("data-theme", theme);
	}, [theme]);

	return <Switch id="toggleTheme" checked={theme === "dark"} onCheckedChange={toggleTheme} />;
}
