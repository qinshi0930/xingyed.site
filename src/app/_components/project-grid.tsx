import { ArrowRight, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { ProjectSchema } from "@/lib/seed/generators/projects";

import { cn } from "@/app/_components/shadcn/utils";
import posts from "@/lib/seed/data/projects.json";

interface CardProps {
	post: ProjectSchema;
	className?: string;
}
function ProjectCard({ post, className }: CardProps) {
	return (
		<div>
			<Link href={`/projects/${post.slug}`}>
				<div
					className={cn(
						className,
						"bg-white dark:bg-neutral-800 rounded-xl transition-all duration-300 shadow-sm group relative border border-neutral-200 dark:border-neutral-900 lg:hover:scale-[102%] cursor-pointer",
					)}
				>
					<div className="flex items-center gap-1 absolute top-0 right-0 bg-lime-300 text-emerald-950 text-[13px] font-medium py-1 px-2 rounded-bl-xl rounded-tr-xl z-2">
						<Share2 />
						<span className="text-lg">Featured</span>
					</div>
					<div className="relative">
						<div className="overflow-hidden w-[400px] h-[200px]">
							<Image
								src={post.cover}
								alt={post.title}
								fill
								layout="lazy"
								className="rounded-t-xl"
							></Image>
						</div>
						<div className="absolute top-0 left-0 flex justify-center items-center gap-1 w-full h-full bg-black opacity-0 transition-opacity duration-300 group-hover:opacity-80 rounded-t-xl">
							<p>View Project</p>
							<ArrowRight />
						</div>
					</div>
					<div className="p-5 space-y-3">
						<h3>{post.title}</h3>
						<p className="text-sm">{post.abstract}</p>
						<div className="flex gap-2">
							{post.tags.length > 0 &&
								post.tags.map((tag) => (
									<span
										key={tag}
										className="bg-neutral-400/75 px-2 pb-0.5 rounded-xl"
									>
										{tag}
									</span>
								))}
						</div>
					</div>
				</div>
			</Link>
		</div>
	);
}

interface ProjectGridProps {
	className?: string;
}

export default function ProjectGrid({ className }: ProjectGridProps) {
	return (
		<div className={cn("grid grid-cols-2 gap-5 pt-2 px-1", className)}>
			{posts && posts.map((post) => <ProjectCard key={post.id} post={post} />)}
		</div>
	);
}
