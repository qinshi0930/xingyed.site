import type { Metadata } from "next";

const PAGE_TITLE = "Cheatsheet";
const PAGE_DESCRIPTION = "精选的代码片段、命令和配置示例，提高开发效率的得力助手";

export const metadata: Metadata = {
	title: `${PAGE_TITLE} - Adam`,
	description: PAGE_DESCRIPTION,
};

export default function Cheatsheet() {
	return (
		<div className="page-container">
			<h2>{PAGE_TITLE}</h2>
			<p className="graph-primary pt-2">{PAGE_DESCRIPTION}</p>
			<div className="border-b border-dashed border-neutral-600 mt-6"></div>
		</div>
	);
}
