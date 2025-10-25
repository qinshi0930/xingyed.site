import type { Metadata } from "next";

import { siGithub } from "simple-icons/icons";

import { Divider } from "@/app/_components/layout";

const _TITLE = "Dashboard";

export const metadata: Metadata = {
	title: `${_TITLE} - Personal Site`,
	description: "Adam 的个人博客网站",
};

export default function Dashboard() {
	return (
		<div className="page-container">
			<header>
				<h1>{_TITLE}</h1>
				<p className="graph-primary pt-2">
					This is my personal dashboard, built with Next.js API routes deployed as
					serverless functions.
				</p>
			</header>
			<Divider className="border-dashed mt-6" />
			<section className="flex flex-col gap-2">
				<div className="flex items-center gap-2">
					<div className="size-5">
						<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<title>GitHub</title>
							<path d={siGithub.path} fill="currentColor" />
						</svg>
					</div>
					<h2>Contributions</h2>
				</div>
				<div className="flex justify-between items-center">
					<p className="graph-primary text-lg">
						My contributions from last year on github.
					</p>
					<small>@qinshi1333</small>
				</div>
				<div>
					<p className="graph-primary text-lg">No Data</p>
				</div>
			</section>
		</div>
	);
}
