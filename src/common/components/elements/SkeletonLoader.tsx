import type { ReactNode } from "react";

import { SkeletonTheme } from "react-loading-skeleton";

import { useThemeState } from "@/common/stores/theme/theme-provider";
import "react-loading-skeleton/dist/skeleton.css";

interface SkeletonLoaderProps {
	children: ReactNode;
}

const SkeletonLoader = ({ children }: SkeletonLoaderProps) => {
	const { theme: resolvedTheme } = useThemeState((state) => ({ theme: state.theme }));
	const baseColor = resolvedTheme === "light" ? "#ebebeb" : "#202020";
	const highlightColor = resolvedTheme === "light" ? "#f5f5f5" : "#2e2e2e";

	return (
		<SkeletonTheme baseColor={baseColor} highlightColor={highlightColor}>
			{children}
		</SkeletonTheme>
	);
};

export default SkeletonLoader;
