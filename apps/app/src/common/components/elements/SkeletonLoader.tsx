import type { ReactNode } from "react";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface SkeletonLoaderProps {
	children: ReactNode;
}

const SkeletonLoader = ({ children }: SkeletonLoaderProps) => {
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	// 避免水合错误：在客户端挂载前使用固定的默认颜色（浅色主题）
	const baseColor = mounted ? (resolvedTheme === "light" ? "#ebebeb" : "#202020") : "#ebebeb";
	const highlightColor = mounted
		? resolvedTheme === "light"
			? "#f5f5f5"
			: "#2e2e2e"
		: "#f5f5f5";

	return (
		<SkeletonTheme baseColor={baseColor} highlightColor={highlightColor}>
			{children}
		</SkeletonTheme>
	);
};

export default SkeletonLoader;
