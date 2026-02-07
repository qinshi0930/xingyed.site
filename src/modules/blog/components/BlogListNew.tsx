"use client";
import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { useDebounceValue } from "usehooks-ts";

import type { BlogItemProps } from "@/common/types/blog";

import EmptyState from "@/common/components/elements/EmptyState";
import Pagination from "@/common/components/elements/Pagination";
import SearchBar from "@/common/components/elements/SearchBar";
import BlogCardNewSkeleton from "@/common/components/skeleton/BlogCardNewSkeleton";
import { fetcher } from "@/services/fetcher";

import BlogCardNew from "./BlogCardNew";
import BlogFeaturedSection from "./BlogFeaturedSection";

const BlogListNew = () => {
	const router = useRouter();
	const searchParams = useSearchParams();

	// 从 URL 读取状态，作为单一数据源
	const page = Number(searchParams.get("page")) || 1;
	const urlSearchTerm = searchParams.get("search") || "";

	// 使用本地状态处理搜索输入，避免每次输入都触发路由变化
	const [searchTerm, setSearchTerm] = useState<string>(urlSearchTerm);
	const [debouncedValue] = useDebounceValue(searchTerm, 500);

	const { data, error, isValidating } = useSWR(
		`/api/blog?page=${page}&per_page=6&search=${debouncedValue}`,
		fetcher,
		{
			revalidateOnFocus: false,
			refreshInterval: 0,
		},
	);

	const { posts: blogData = [], total_pages: totalPages = 1, total_posts = 0 } = data?.data || {};

	const handlePageChange = (newPage: number) => {
		const params = new URLSearchParams(searchParams);
		params.set("page", newPage.toString());
		router.push(`/blog?${params.toString()}`);
	};

	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		const searchValue = event?.target?.value;
		setSearchTerm(searchValue);

		const params = new URLSearchParams();
		params.set("page", "1");
		if (searchValue) {
			params.set("search", searchValue);
		}
		router.push(`/blog?${params.toString()}`);
	};

	const handleClearSearch = () => {
		setSearchTerm("");
		router.push("/blog?page=1");
	};

	const renderEmptyState = () =>
		!isValidating &&
		(!data?.status || blogData.length === 0) && (
			<EmptyState message={error ? "Error loading posts" : "No Post Found."} />
		);

	return (
		<div className="space-y-10">
			<BlogFeaturedSection />

			<div className="space-y-5">
				<div className="mb-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
					<div className="flex items-center gap-2 px-1  text-xl font-medium">
						{searchTerm ? (
							<div>
								<span className="mr-2 text-neutral-600 dark:text-neutral-400">
									Search:
								</span>
								<span className="italic">{searchTerm}</span>
							</div>
						) : (
							<h4 className="text-neutral-800 dark:text-neutral-200">
								Latest Articles
							</h4>
						)}
						<span className="rounded-full bg-neutral-300 px-2 py-1  text-xs text-neutral-900 dark:bg-neutral-700 dark:text-neutral-50">
							{total_posts}
						</span>
					</div>
					<SearchBar
						searchTerm={searchTerm}
						onSearchChange={handleSearch}
						onClearSearch={handleClearSearch}
					/>
				</div>

				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
					{!isValidating ? (
						<>
							{blogData.map((item: BlogItemProps, index: number) => (
								<motion.div
									key={item.id}
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ duration: 0.3, delay: index * 0.1 }}
								>
									<BlogCardNew {...item} />
								</motion.div>
							))}
						</>
					) : (
						<>
							{Array.from({ length: 3 })
								.fill(0)
								.map((_, index) => (
									// eslint-disable-next-line react/no-array-index-key
									<BlogCardNewSkeleton key={`skeleton-${index}`} />
								))}
						</>
					)}
				</div>

				{!isValidating && data?.status && (
					<Pagination
						totalPages={totalPages}
						currentPage={page}
						onPageChange={handlePageChange}
					/>
				)}

				{renderEmptyState()}
			</div>
		</div>
	);
};

export default BlogListNew;
