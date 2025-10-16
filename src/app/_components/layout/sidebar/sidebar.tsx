"use client";

import { BadgeCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import avatar from "@/../public/images/avatar.jpg";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/_components/shadcn/ui/tooltip";
import { cn } from "@/app/_components/shadcn/utils";
import ThemeToggle from "@/app/_components/theme/theme-toggle";
import { useScroll } from "@/hooks/useScroll";

import Navigate from "../navigate/navigate";

function SidebarHeader() {
	const isScrolled = useScroll(10);

	return (
		<div className="flex items-start justify-between lg:flex-col lg:space-y-4 md:px-2">
			<div className="flex flex-col w-full gap-0.5">
				<div
					className={cn(
						"rounded-full overflow-hidden relative",
						"transition-all duration-500 delay-200",
						isScrolled ? "size-20" : "size-30",
					)}
				>
					<Image src={avatar} alt="avatar" fill style={{ objectFit: "cover" }} />
				</div>
				<div className="flex gap-2 items-center mt-1 lg:mt-4">
					<Link href="/">
						<h2>Adam</h2>
					</Link>
					<Tooltip>
						<TooltipTrigger asChild>
							<BadgeCheck
								fill="currentColor"
								stroke="var(--background)"
								strokeWidth={2}
								className="text-blue-400"
							/>
						</TooltipTrigger>
						<TooltipContent align="start">
							<p>Verified</p>
						</TooltipContent>
					</Tooltip>
				</div>
				<small>@qinshi1333</small>
			</div>
			<div className="flex items-center justify-between w-full">
				<div className="flex items-center gap-2">
					<span className="relative flex size-3">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
						<span className="relative inline-flex size-3 rounded-full bg-green-500"></span>
					</span>
					<small>Open for collabs!</small>
				</div>
				<ThemeToggle />
			</div>
			{/* <div>
						<div className="flex gap-5">
							<ThemeToggle />
							<div
								className="flex flex-col justify-between w-[26px] h-[21px]"
								role="button"
								tabIndex={0}
								onClick={handleOpenNav}
								onKeyDown={(e) => {
									e.preventDefault();
								}}
							>
								{isNavOpen ? (
									<>
										<span className="bg-neutral-700 dark:bg-neutral-100 rounded-xl h-[3px] w-full origin-left animate-in spin-in-45 ease-in-out direction-reverse duration-500 repeat-initial fill-mode-forwards"></span>
										<span className="bg-neutral-700 dark:bg-neutral-100 rounded-xl h-[3px] w-full origin-left animate-in zoom-in ease-in-out direction-reverse duration-500 repeat-initial fill-mode-forwards"></span>
										<span className="bg-neutral-700 dark:bg-neutral-100 rounded-xl h-[3px] w-full origin-left animate-in -spin-in-45 ease-in-out direction-reverse duration-500 repeat-initial fill-mode-forwards"></span>
									</>
								) : (
									<>
										<span className="bg-neutral-700 dark:bg-neutral-100 rounded-xl h-[3px] w-full origin-left animate-in spin-in-45 ease-in-out duration-500 repeat-initial fill-mode-forwards"></span>
										<span className="bg-neutral-700 dark:bg-neutral-100 rounded-xl h-[3px] w-full origin-left animate-in zoom-in ease-in-out duration-500 repeat-initial fill-mode-forwards"></span>
										<span className="bg-neutral-700 dark:bg-neutral-100 rounded-xl h-[3px] w-full origin-left animate-in -spin-in-45 ease-in-out duration-500 repeat-initial fill-mode-forwards"></span>
									</>
								)}
							</div>
						</div>
					</div> */}
		</div>
	);
}

function SidebarFooter() {
	return (
		<small className="flex gap-1 justify-center">
			<span>©</span>
			<span>2025</span>
			<span>with</span>
			<span>❤</span>
			<span>by</span>
			<span>Adam</span>
		</small>
	);
}

export default function AppSidebar() {
	return (
		<aside id="siderbar" className="lg:sticky lg:top-0 lg:py-8">
			<SidebarHeader />
			<div className="border-b my-4"></div>
			<Navigate />
			<div className="border-b my-4"></div>
			<SidebarFooter />
		</aside>
	);
}
