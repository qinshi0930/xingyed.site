import type { Metadata } from "next";

import { Toaster } from "sonner";
import "prism-themes/themes/prism-one-dark.css";

import "./styles/globals.css";
import { AppStoreProvider } from "@/common/stores/store-provider";

export const metadata: Metadata = {
	title: "Home - Personal Site",
	description: "Adam 的个人博客网站",
	metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://xingyed.xyz"),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="zh-CN" suppressHydrationWarning>
			<body>
				<AppStoreProvider>{children}</AppStoreProvider>
				<Toaster position="bottom-right" richColors closeButton />
			</body>
		</html>
	);
}
