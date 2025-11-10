/* eslint-disable unused-imports/no-unused-vars */
"use client";
import type { ReactNode } from "react";

import clsx from "clsx";
import { usePathname } from "next/navigation";
import { useWindowSize } from "usehooks-ts";

// import ChatButton from "@/modules/chat/components/ChatButton";
import useHasMounted from "@/common/hooks/useHasMounted";
import { useThemeState } from "@/common/stores/theme/theme-provider";

import HeaderSidebar from "./header/HeaderSidebar";
import HeaderTop from "./header/HeaderTop";

// import TopBar from '../elements/TopBar';

interface LayoutProps {
	children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
	const { resolvedTheme } = useThemeState((s) => ({ resolvedTheme: s.theme }));
	const hasMounted = useHasMounted();
	const { width } = useWindowSize();
	const isMobile = width < 480;

	const isDarkTheme = hasMounted && resolvedTheme === "dark";

	const pathname = usePathname();
	const pageName = pathname.split("/")[1];

	const isFullPageHeader =
		pageName === "playground" ||
		pageName === "blog" ||
		pathname.startsWith("/blog/") ||
		pathname.startsWith("/learn/");

	// const isShowChatButton = pageName !== "guestbook";

	return (
		<>
			{/* <TopBar /> */}
			<div className={clsx("mx-auto max-w-6xl", isDarkTheme ? "dark:text-darkText" : "")}>
				{isFullPageHeader ? (
					<div className="flex flex-col xl:pb-8">
						<HeaderTop />
						<main className="transition-all duration-300">{children}</main>
					</div>
				) : (
					<div className="flex flex-col lg:flex-row lg:gap-2 lg:py-4 xl:pb-8">
						<HeaderSidebar />
						<main className="mx-auto max-w-[915px] transition-all duration-300 lg:w-4/5">
							{children}
						</main>
					</div>
				)}
			</div>
			{/* {isShowChatButton && <ChatButton />} */}
			{/* {isMobile ? <NowPlayingCard /> : <NowPlayingBar />} */}
		</>
	);
};

export default Layout;
