import type { JSX, ReactNode } from "react";

import styles from "./Admonition.module.css";
import { IconDanger, IconInfo, IconNote, IconTip, IconWarning } from "./icons";

export type TAdmonition = "warning" | "danger" | "info" | "note" | "tip";

interface TAdmonitionInfo {
	title: string;
	icon: ReactNode;
}

type TAdmonitions = Record<TAdmonition, TAdmonitionInfo>;

interface Props {
	type?: TAdmonition;
	title?: string;
	margin?: string; // only remove margins
	children: ReactNode | ReactNode[];
}

const ADMONITIONS: TAdmonitions = {
	warning: {
		title: "warning",
		icon: <IconWarning />,
	},
	danger: {
		title: "danger",
		icon: <IconDanger />,
	},
	info: {
		title: "info",
		icon: <IconInfo />,
	},
	tip: {
		title: "tip",
		icon: <IconTip />,
	},
	note: {
		title: "note",
		icon: <IconNote />,
	},
};

const Admonition = ({ children, type = "note", title }: Props): JSX.Element => {
	const defaultType = "note" as TAdmonition;
	const types: TAdmonition[] = ["warning", "danger", "info", "note", "tip"];

	const admonitionType = types.includes(type) ? type : defaultType;
	const admonition = ADMONITIONS[admonitionType];

	return (
		<div className={`${styles["admonition-container"]} ${styles[admonitionType]}`}>
			<div className={styles["admonition-title"]}>
				{admonition.icon}
				{title ?? admonition.title}
			</div>
			<div className={styles["admonition-content"]}>{children}</div>
		</div>
	);
};

export default Admonition;

/** ************************ ::: Custom Container: admonition ::: */

interface CustomProps {
	children: ReactNode | ReactNode[];
	className?: string;
	["data-type"]: string;
	["data-title"]?: string;
}

export const admonition = ({ children, ...props }: CustomProps): JSX.Element | null => {
	if (!props["data-type"]) return null;

	const type = props["data-type"] as TAdmonition;
	const title = props["data-title"];

	return (
		<Admonition type={type} title={title}>
			{children}
		</Admonition>
	);
};
