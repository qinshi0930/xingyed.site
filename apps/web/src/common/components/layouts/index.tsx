/* eslint-disable unused-imports/no-unused-vars */
"use client";
import type { ReactNode } from "react";

import clsx from "clsx";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useWindowSize } from "usehooks-ts";

// import ChatButton from "@/modules/chat/components/ChatButton";
import useHasMounted from "@/common/hooks/useHasMounted";

import HeaderSidebar from "./header/HeaderSidebar";
import HeaderTop from "./header/HeaderTop";

// import TopBar from '../elements/TopBar';

interface LayoutProps {
	children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
	const { resolvedTheme } = useTheme();
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
			<div
				className={clsx(
					"mx-auto flex min-h-screen max-w-6xl flex-col",
					isDarkTheme ? "dark:text-darkText" : "",
				)}
			>
				{isFullPageHeader ? (
					<div className="flex flex-1 flex-col xl:pb-8">
						<HeaderTop />
						<main className="flex-1 transition-all duration-300">{children}</main>
					</div>
				) : (
					<div className="flex flex-1 flex-col lg:flex-row lg:gap-2 lg:py-4 xl:pb-8">
						<HeaderSidebar />
						<main className="mx-auto flex-1 max-w-[915px] transition-all duration-300 lg:w-4/5">
							{children}
						</main>
					</div>
				)}
				<footer className="mt-auto flex justify-center gap-1 py-6 text-sm text-neutral-600 dark:text-neutral-400">
					<span>ICP备案号：</span>
					<a
						href="https://beian.miit.gov.cn/"
						target="_blank"
						rel="noreferrer noopener"
						className="hover:text-neutral-900 dark:hover:text-neutral-200"
					>
						赣ICP备2025078961号
					</a>
				</footer>
			</div>
			{/* {isShowChatButton && <ChatButton />} */}
			{/* {isMobile ? <NowPlayingCard /> : <NowPlayingBar />} */}
		</>
	);
};

export default Layout;
