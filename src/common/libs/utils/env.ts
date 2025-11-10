export const isServer = typeof window === "undefined";

/**
 * 安全地解析JSON字符串
 * @param value 需要解析的字符串或undefined
 * @returns 解析后的JSON对象或原始值，如果解析失败则返回原始值
 */
export const safeJsonParse = (value: string | undefined) => {
	if (!value) return undefined;
	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
};

export const getSystemTheme = () => {
	if (isServer) return "light";

	const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
	return isDarkMode ? "dark" : "light";
};
