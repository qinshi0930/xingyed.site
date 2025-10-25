import type { Metadata } from "next";

import { Divider } from "@/app/_components/layout";
import ProjectGrid from "@/app/_components/project-grid";

const _TITLE = "Projects";

export const metadata: Metadata = {
	title: `${_TITLE} - Personal Site`,
	description: "Adam 的个人博客网站",
};

export default function Projects() {
	return (
		<div className="page-container">
			<header>
				<h1>{_TITLE}</h1>
				<p className="graph-primary pt-2">
					Several projects that I have worked on, both private and open source.
				</p>
			</header>
			<Divider className="mt-6" />
			<section>
				<ProjectGrid />
			</section>
		</div>
	);
}
