import type { Metadata } from "next";

const PAGE_TITLE = "Weekly";
const PAGE_DESCRIPTION =
	"这里是「果酱前端周刊」，以后每周都会把看到的有趣的工具、开源项目、文章发布到周刊，欢迎关注。";

export const metadata: Metadata = {
	title: `${PAGE_TITLE} - Adam`,
	description: PAGE_DESCRIPTION,
};

export default function Weekly() {
	return (
		<div className="page-container">
			<h2>{PAGE_TITLE}</h2>
			<p className="graph-primary pt-2">{PAGE_DESCRIPTION}</p>
			<div className="border-b border-dashed border-neutral-600 mt-6"></div>
		</div>
	);
}
