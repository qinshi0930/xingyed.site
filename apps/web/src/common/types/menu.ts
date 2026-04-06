import type { JSX, ReactNode } from "react";

export interface MenuItemProps {
	title: string;
	href: string;
	icon: JSX.Element;
	isShow?: boolean;
	isExternal: boolean;
	onClick?: () => void;
	className?: string;
	children?: ReactNode;
	eventName?: string;
	hideIcon?: boolean;
	type?: string;
}
