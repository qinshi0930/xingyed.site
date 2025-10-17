import type { Metadata } from "next";

const _TITLE = "Contact";
// const _TITLE = "开发速查表";

export const metadata: Metadata = {
	title: `${_TITLE} - Personal Site`,
	description: "Adam 的个人博客网站",
};

export default function Contact() {
	return (
		<div className="page-container">
			<h2>{_TITLE}</h2>
			<p className="graph-primary pt-2">
				Feel free to get in touch and let's have a discussion about how we can work
				together.
			</p>
			<div className="border-b border-dashed border-neutral-600 mt-6"></div>
		</div>
	);
}
