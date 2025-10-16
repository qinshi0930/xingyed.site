"use client";

import { Calendar } from "lucide-react";
import { useEffect, useState } from "react";

import type { BlogPost } from "@/lib/seed/faker-generator";

import { generateRandomBlogPosts } from "@/lib/seed/faker-generator";

export default function RecentArticles() {
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
									<div className="line-clamp-5 text-sm">{post.content}</div>
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
	);
}
