export const getSystemTheme = () => {
	if (typeof window === "undefined") return "light";
	const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
	return isDarkMode ? "dark" : "light";
};
