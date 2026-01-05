"use client";
import type { TocItem } from "remark-flexible-toc";

import clsx from "clsx";
import { isEqual } from "lodash";
import { useCallback, useState } from "react";
import useSWR from "swr";

import type { BlogDetailProps } from "@/common/types/blog";

import Breakline from "@/common/components/elements/Breakline";
import MDXComponent from "@/common/components/elements/MDXComponent";
import Toc from "@/common/components/elements/Toc";
import { calculateReadingTime } from "@/common/helpers";
import useIsMobile from "@/common/hooks/useIsMobile";
import { fetcher } from "@/services/fetcher";

import BlogHeader from "./BlogHeader";

const BlogDetail = ({ id, title, date, slug, content, tags_list }: BlogDetailProps) => {
	const { data: viewsData } = useSWR(`/api/views?slug=${slug}&id=${id}`, fetcher);
	const isMobile = useIsMobile();

	const viewsCount = viewsData?.views || 0;
	const tagList = tags_list || [];

	const readingTimeMinutes = calculateReadingTime(content?.markdown) ?? 0;

	const [tocData, setTocData] = useState<TocItem[] | undefined>(undefined);

	const handleTocChanged = useCallback((newToc: TocItem[]) => {
		if (!isEqual(tocData, newToc)) {
			setTocData(newToc);
		}
	}, []);

	// const formatTagName = (name: string) => {
	// 	if (!name) return "";
	// 	return name.charAt(0).toUpperCase() + name.slice(1);
	// };

	return (
		<section className={clsx(!isMobile && "flex gap-6")}>
			<div className={clsx(!isMobile && "w-3/4")}>
				<BlogHeader
					title={title?.rendered}
					comments_count={0}
					reading_time_minutes={readingTimeMinutes}
					published_at={date}
					page_views_count={viewsCount}
				/>
				<div className="space-y-6 leading-[1.8] dark:text-neutral-300 ">
					{content?.rendered && (
						<MDXComponent onTocChanged={handleTocChanged}>
							{content?.markdown}
						</MDXComponent>
					)}
				</div>
				{tagList?.length >= 1 && (
					<div className="my-10 space-y-2">
						<h6 className="text-lg font-medium">Tags:</h6>
						<div className="flex flex-wrap gap-2 pt-2">
							{tagList?.map((tag) => (
								<div
									key={tag?.term_id}
									className="rounded-full bg-neutral-200 px-4 py-1 text-[14px] font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-200"
								>
									<span className="mr-1 font-semibold">#</span>
									{tag?.name.charAt(0).toUpperCase() + tag?.name.slice(1)}
								</div>
							))}
						</div>
					</div>
				)}
				<Breakline className="!my-10" />
			</div>
			{tocData && (
				<div className={clsx(!isMobile && "w-1/4")}>
					<div className="sticky top-10">
						<Toc toc={tocData} />
					</div>
				</div>
			)}
		</section>
	);
};

export default BlogDetail;
