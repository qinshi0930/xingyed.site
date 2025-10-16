import { ArrowRight, Calendar } from "lucide-react";
import { useEffect, useState } from "react";

import type { BlogPost } from "@/lib/seed/faker-generator";

import { generateRandomBlogPosts } from "@/lib/seed/faker-generator";

export default function AppHomeContent() {
	const [posts, setPosts] = useState<BlogPost[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [count, setCount] = useState<number>(5); // 默认生成5篇

	// 模拟异步加载数据
	useEffect(() => {
		let isMounted = true;

		const loadPosts = () => {
			if (isMounted) {
				const generatedPosts = generateRandomBlogPosts(count);
				setPosts(generatedPosts);
			}
		};

		loadPosts();

		return () => {
			isMounted = false;
		};
	}, [count]); // 当 count 改变时重新生成

	return (
		<div className="mt-20 mb-10 lg:mt-0 p-8">
			<section>
				<div className="space-y-3">
					<div className="flex gap-2 text-2xl lg:text-3xl">
						<p className="text-3xl dark:text-white">Hi, I'm adam</p>
						<div className="ml-1 animate-waving-hand">👋</div>
					</div>
					<small className="text-[1rem]">
						<ul className="flex flex-col lg:flex-row gap-1 lg:gap-10 list-disc list-inside">
							<li>
								Based in [::1]:443 - China <span className="ml-1 text-xs">CN</span>
							</li>
							<li>Working remotely around them world</li>
						</ul>
					</small>
				</div>
				<p className="text-[1rem] leading-[1.8] md:leading-loose mt-6 text-neutral-800 dark:text-neutral-300">
					经验丰富的软件工程师，尤其是前段方面的软件工程师，热衷于创建像素完美的网络体验。我使用
					JavaScript
					并专注于万事万物网络，我热衷于团队合作，支付高效、可扩展且具有视觉吸引力的 Web
					应用程序。
				</p>
			</section>
			<div className="border-t dark:border-neutral-700 border-gray-300 my-4 mt-8 mb-7"></div>
			<section className="space-y-6">
				<div className="flex flex-row justify-between mb-4">
					<h2>Latest Articles</h2>
					<div className="flex flex-row items-center space-x-1">
						<button type="button">View all</button>
						<ArrowRight className="scale-75" />
					</div>
				</div>
				<div className="flex flex-row p-1 gap-4 overflow-x-auto scrollbar-hide scroll-smooth">
					{posts.length > 0 &&
						posts.map((post) => (
							<div
								key={post.id}
								className="rounded-xl bg-blue-700/70 shadow-xl border-1 p-4 h-100"
							>
								<div className="flex flex-col justify-between w-2xs h-full">
									<div className="flex flex-row space-x-2">
										{post.tags.map((tag) => (
											<span
												key={tag}
												className="bg-neutral-900/60 p-1 rounded-xl px-2 text-sm"
											>
												{`# ${tag}`}
											</span>
										))}
									</div>
									<div className="flex flex-col justify-end space-y-2">
										<div>
											<h2 className="line-clamp-2">{post.title}</h2>
											<div className="flex flex-row items-center space-x-1">
												<Calendar className="scale-75" />
												<div className="text-xs">
													{post.publishDate.toLocaleDateString("zh-CN", {
														year: "numeric",
														month: "long",
														day: "numeric",
													})}
												</div>
											</div>
											<div className="line-clamp-5 text-sm">
												{post.content}
											</div>
										</div>
										<div className="border-b-2 pb-2 mt-1"></div>
										<div className="py-2">
											<div className="size-8 rounded-full bg-neutral-800/60"></div>
										</div>
									</div>
								</div>
							</div>
						))}
				</div>
			</section>
			<div className="border-t dark:border-neutral-700 border-gray-300 my-4 mt-8 mb-7"></div>
			<section className="space-y-5">
				<div className="space-y-3">
					<h2>What I've Been Working On</h2>
					<p className="text-[1rem] leading-[1.8] md:leading-loose mt-6 text-neutral-800 dark:text-neutral-300">
						I assist brands, companies, institutions, and startups in createing
						exceptional digital experiences for their businesses through strategic
						development services.
					</p>
				</div>
				<div className="bg-neutral-800 p-8 rounded-xl shadow-sm border">
					<div className="space-y-3">
						<h2>Lets work together</h2>
						<p className="leading-[1.8] md:leading-loose text-neutral-800 dark:text-neutral-300 pl-2">
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
