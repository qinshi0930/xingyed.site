import type { Metadata } from "next";

import { getCookie } from "cookies-next/server";
import { cookies } from "next/headers";
import "prism-themes/themes/prism-one-dark.css";

import "./styles/globals.css";
import { AppStoreProvider } from "@/common/stores/store-provider";

export const metadata: Metadata = {
	title: "Home - Personal Site",
	description: "Adam 的个人博客网站",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	// 服务端初始化状态
	const theme = await getCookie("theme", { cookies });
	const initialTheme = theme === "light" || theme === "dark" ? theme : "light";

	// console.log(`theme: ${theme} initialTheme: ${initialTheme}`);
	return (
		<html lang="zh-CN" className={initialTheme} data-theme={initialTheme}>
			<body>
				<AppStoreProvider initialTheme={initialTheme}>{children}</AppStoreProvider>
			</body>
		</html>
	);
}
