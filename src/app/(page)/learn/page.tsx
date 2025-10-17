import type { Metadata } from "next";

const _TITLE = "Learn";
// const _TITLE = "开发速查表";

export const metadata: Metadata = {
	title: `${_TITLE} - Personal Site`,
	description: "Adam 的个人博客网站",
};

export default function Learn() {
	return (
		<div className="page-container">
			<h2>{_TITLE}</h2>
			<p className="graph-primary pt-2">
				It's not a course, it's my personal learning notes. But if you are interested, let's
				learn together.
			</p>
			<div className="border-b border-dashed border-neutral-600 mt-6"></div>
		</div>
	);
}
