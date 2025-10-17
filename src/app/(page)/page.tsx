import { ArrowRight } from "lucide-react";

import RecentArticles from "@/app/_components/home/recent-articles";
import { Divider } from "@/app/_components/layout";

export default function Home() {
	return (
		<div className="page-container">
			<section>
				<div className="space-y-3">
					<div className="flex gap-2 text-2xl lg:text-3xl">
						<h1 className="text-3xl dark:text-white">Hi, I'm adam</h1>
						<div className="ml-1 animate-waving-hand">👋</div>
					</div>
					<ul className="flex flex-col lg:flex-row gap-1 lg:gap-10 list-disc list-inside">
						<li>
							<small>
								Based in [::1]:443 - China <span className="ml-1 text-xs">CN</span>
							</small>
						</li>
						<li>
							<small>Working remotely around them world</small>
						</li>
					</ul>
				</div>
				<p className="graph-primary mt-6">
					经验丰富的软件工程师，尤其是前段方面的软件工程师，热衷于创建像素完美的网络体验。我使用
					JavaScript
					并专注于万事万物网络，我热衷于团队合作，支付高效、可扩展且具有视觉吸引力的 Web
					应用程序。
				</p>
			</section>
			<Divider className="mt-8 mb-7" />
			<section className="space-y-6">
				<div className="flex flex-row justify-between mb-4">
					<h2>Latest Articles</h2>
					<div className="flex flex-row items-center space-x-1">
						<button type="button">View all</button>
						<ArrowRight className="scale-75" />
					</div>
				</div>
				<RecentArticles />
			</section>
			<Divider className="mt-8 mb-7" />
			<section className="space-y-5">
				<div className="space-y-3">
					<h2>What I've Been Working On</h2>
					<p className="graph-primary mt-6">
						I assist brands, companies, institutions, and startups in createing
						exceptional digital experiences for their businesses through strategic
						development services.
					</p>
				</div>
				<div className="bg-neutral-800 p-8 rounded-xl shadow-sm border">
					<div className="space-y-3">
						<h2>Lets work together</h2>
						<p className="graph-primary mt-6 pl-2">
							I'm open for freelance projects, feel free to email me see how can we
							collaborate.
						</p>
						<button type="button" className="py-2 px-3 bg-zinc-700 rounded-md">
							Contact me
						</button>
					</div>
				</div>
			</section>
		</div>
	);
}
