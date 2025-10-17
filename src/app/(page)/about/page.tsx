import type { Metadata } from "next";

const _TITLE = "About";
// const _TITLE = "开发速查表";

export const metadata: Metadata = {
	title: `${_TITLE} - Personal Site`,
	description: "Adam 的个人博客网站",
};

export default function About() {
	return (
		<div className="page-container">
			<h2>{_TITLE}</h2>
			<p className="graph-primary pt-2">
				A short story of me, not important but seem better than nothing.
			</p>
			<div className="border-b border-dashed border-neutral-600 mt-6"></div>
		</div>
	);
}
