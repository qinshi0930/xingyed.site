"use client";
import clsx from "clsx";
import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MenuContext } from "@/common/context/MenuContext";
import useIsMobile from "@/common/hooks/useIsMobile";

import SearchBox from "../elements/SearchBox";
import ThemeToggleButton from "../elements/ThemeToggleButton";
import MobileMenu from "./MobileMenu";
import MobileMenuButton from "./MobileMenuButton";
import ProfileHeader from "./ProfileHeader";

interface ProfileProps {
	isScrolled?: boolean;
}

const Profile = ({ isScrolled = false }: ProfileProps) => {
	// 监听窗口宽度变化，控制移动端响应式布局，并根据设备状态和滚动位置动态计算头像尺寸
	const isMobile = useIsMobile();

	const getImageSize = useCallback(() => {
		let size = isMobile ? 40 : 80;
		if (!isMobile && isScrolled) {
			size = 55;
		}
		return size;
	}, [isMobile]);

	// 控制移动端菜单展开状态，并提供全局上下文管理菜单显示/隐藏，同时处理菜单展开时的页面滚动锁定
	const [expandMenu, setExpandMenu] = useState<boolean>(false);

	const context = useMemo(() => {
		return {
			hideNavbar: () => {
				setExpandMenu(false);
			},
		};
	}, []);

	useEffect(() => {
		if (expandMenu) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "auto";
		}
		return () => {
			document.body.style.overflow = "auto";
		};
	}, [expandMenu]);

	return (
		<MenuContext value={context}>
			<div
				className={clsx(
					"fixed z-20 w-full bg-background p-5 shadow-sm dark:border-b dark:border-neutral-800 sm:shadow-none lg:relative lg:border-none lg:!bg-transparent lg:p-0",
					expandMenu && "pb-0",
				)}
			>
				<div className="flex items-start justify-between lg:flex-col lg:space-y-4">
					<ProfileHeader expandMenu={expandMenu} imageSize={getImageSize()} />
					{/* <ProfileHeader expandMenu={expandMenu} imageSize={55} /> */}

					{!isMobile && (
						<div className="flex justify-between w-full items-center">
							<div className="flex items-center gap-1 pl-2">
								<span className="relative flex size-3">
									<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
									<span className="relative inline-flex size-3 rounded-full bg-green-500"></span>
								</span>
								<p className="text-sm">Open for collabs!</p>
							</div>
							<ThemeToggleButton />
						</div>
					)}

					{isMobile && (
						<div
							className={clsx(
								"mt-2 flex items-center gap-5 lg:hidden",
								expandMenu &&
									"h-[120px] flex-col-reverse !items-end justify-between pb-1",
							)}
						>
							<ThemeToggleButton />
							<MobileMenuButton
								expandMenu={expandMenu}
								setExpandMenu={setExpandMenu}
							/>
						</div>
					)}
				</div>

				{isMobile && (
					<AnimatePresence>
						{expandMenu && (
							<div className="space-y-5 pt-6">
								<SearchBox />
								<MobileMenu />
							</div>
						)}
					</AnimatePresence>
				)}
			</div>
		</MenuContext>
	);
};

export default Profile;
