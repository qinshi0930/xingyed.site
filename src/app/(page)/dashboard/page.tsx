import type { Metadata } from "next";

import { Divider } from "@/app/_components/layout";

const _TITLE = "Dashboard";

export const metadata: Metadata = {
	title: `${_TITLE} - Personal Site`,
	description: "Adam 的个人博客网站",
};

export default function Dashboard() {
	return (
		<div className="page-container">
			<h2>{_TITLE}</h2>
			<p className="graph-primary pt-2">
				This is my personal dashboard, built with Next.js API routes deployed as serverless
				functions.
			</p>
			<Divider className="border-dashed mt-6" />
			{/* <div className="border-b border-dashed border-neutral-600 mt-6"></div> */}
		</div>
	);
}
