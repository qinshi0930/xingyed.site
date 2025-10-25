"use client";

import { Calendar } from "lucide-react";

import blogs from "@/lib/seed/data/blogs.json";

export default function RecentArticles() {
	return (
		<div className="flex flex-row p-1 gap-4 overflow-x-auto scrollbar-hide scroll-smooth">
			{blogs.length > 0 &&
				blogs.map((post) => (
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
											{new Date(post.publishDate).toLocaleDateString(
												"zh-CN",
												{
													year: "numeric",
													month: "long",
													day: "numeric",
												},
											)}
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
