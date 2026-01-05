"use client";

import type { TocItem } from "remark-flexible-toc";

import { motion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { FiMenu as MenuIcon } from "react-icons/fi";
import { MdClose as CloseIcon } from "react-icons/md";

import useIsMobile from "@/common/hooks/useIsMobile";

interface TocProps {
	toc: TocItem[];
}

function Toc({ toc }: TocProps) {
	const [expandToc, setExpandMenu] = useState(false);
	const isMobile = useIsMobile();

	const tocList = useMemo(() => {
		if (!toc) return null;
		return toc.map((item) => (
			<Link
				key={item.value}
				href={item.href}
				className="hover:text-blue-500 cursor-pointer"
				scroll={false}
				onClick={(e) => {
					e.preventDefault();
					const targetId = item.href.replace("#", "");
					const element = document.getElementById(targetId);
					if (element) {
						const elementPos = element.getBoundingClientRect().top;
						const offsetPosition = elementPos + window.pageYOffset;

						const offset = 100;

						window.scrollTo({
							top: offsetPosition - offset,
							behavior: "smooth",
						});
					}
				}}
			>
				<p
					className="text-sm line-clamp-1"
					style={{ paddingLeft: `${(item.depth - 1) * 16}px` }}
				>
					{item.value}
				</p>
			</Link>
		));
	}, [toc]);

	return (
		<>
			{isMobile && (
				<div className="fixed top-1/2 right-0 transform -translate-y-1/2">
					<div className="flex flex-row items-center">
						<button
							type="button"
							className="bg-background border-l border-y rounded-l-lg flex flex-col justify-center items-center h-[80px] px-2 gap-1"
							onClick={(e) => {
								e.preventDefault();
								setExpandMenu(!expandToc);
							}}
						>
							{expandToc ? <CloseIcon size={14} /> : <MenuIcon size={14} />}
							<span className="text-sm" style={{ writingMode: "vertical-rl" }}>
								菜单
							</span>
						</button>
						{expandToc && (
							<motion.div
								className="p-6 border rounded-xl bg-neutral-800"
								initial={{ x: "100%", opacity: 0 }}
								animate={{ x: "0%", opacity: 1 }}
							>
								<nav>
									<div className="flex items-center gap-2 pb-4">
										<MenuIcon size={18} />
										<p>菜单</p>
									</div>
									<div className="flex flex-col space-y-2">{tocList}</div>
								</nav>
							</motion.div>
						)}
					</div>
				</div>
			)}
			{!isMobile && (
				<nav className="p-6 border rounded-xl bg-neutral-800">
					<div className="flex items-center gap-2 pb-4">
						<MenuIcon size={18} />
						<p>菜单</p>
					</div>
					<div className="flex flex-col space-y-2">{tocList}</div>
				</nav>
			)}
		</>
	);
}

export default Toc;
