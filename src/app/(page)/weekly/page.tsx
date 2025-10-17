import type { Metadata } from "next";

const _TITLE = "Weekly";

export const metadata: Metadata = {
	title: `${_TITLE} - Personal Site`,
	description: "Adam 的个人博客网站",
};

export default function Weekly() {
	return (
		<div className="page-container">
			<h2>{_TITLE}</h2>
			<p className="graph-primary pt-2">
				这里是「果酱前端周刊」，以后每周都会把看到的有趣的工具、开源项目、文章发布到周刊，欢迎关注。
			</p>
			<div className="border-b border-dashed border-neutral-600 mt-6"></div>
		</div>
	);
}
