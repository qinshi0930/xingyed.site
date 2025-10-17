import type { Metadata } from "next";

const _TITLE = "Projects";

export const metadata: Metadata = {
	title: `${_TITLE} - Personal Site`,
	description: "Adam 的个人博客网站",
};

export default function Projects() {
	return (
		<div className="page-container">
			<h2>{_TITLE}</h2>
			<p className="graph-primary pt-2">
				Several projects that I have worked on, both private and open source.
			</p>
			<div className="border-b border-dashed border-neutral-600 mt-6"></div>
		</div>
	);
}
