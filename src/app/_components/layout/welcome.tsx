import type { PropsWithChildren } from "react";

import { cn } from "@/app/_components/shadcn/utils";

import $styles from "./welcome.module.css";

interface HeaderProps {
	className?: string;
}

export function Welcome({ children, className }: PropsWithChildren<HeaderProps>) {
	return (
		<div className={cn($styles.welcome, $styles.welcomePrimary, className)}>
			<span>🌟🍺✨🎉</span>
			<span>你好，2025</span>
			<span>🎉✨🍺🌟</span>
			{children}
		</div>
	);
}
