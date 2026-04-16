import type { Metadata } from "next";

// import dynamic from "next/dynamic";
import { notFound, redirect } from "next/navigation";

import { getBlogs } from "@/api/services/blog";
import BackButton from "@/common/components/elements/BackButton";
import Container from "@/common/components/elements/Container";
import TrackView from "@/common/components/elements/TrackView";
import { formatExcerpt } from "@/common/helpers";
import BlogDetail from "@/modules/blog/components/BlogDetail";

// const GiscusComment = dynamic(() => import("@/modules/blog/components/GiscusComment"));

interface BlogDetailPageProps {
	params: Promise<{ slug: string }>;
}

// ISR 配置：增量静态再生
// 构建时不生成页面，首次访问时运行时渲染，之后缓存 1 小时
export const dynamic = "force-static";
export const revalidate = 3600; // 1 小时重新验证

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
	const { slug } = await params;

	if (!slug) {
		return {};
	}

	// 直接调用服务层函数，避免自引用 fetch
	const apiResponse = await getBlogs({ slug });

	if (!apiResponse || !apiResponse.posts || apiResponse.posts.length === 0) {
		return {};
	}

	const blog = apiResponse.posts[0];
	const description = formatExcerpt(blog?.excerpt?.rendered);
	const canonicalUrl = `https://xingyed.xyz/blog/${blog?.slug}`;

	return {
		title: `${blog?.title?.rendered} - Blog Adam`,
		description,
		alternates: {
			canonical: canonicalUrl,
		},
		openGraph: {
			type: "article",
			title: `${blog?.title?.rendered} - Blog Adam`,
			description,
			url: canonicalUrl,
			siteName: "Adam blog",
			images: blog?.featured_image_url
				? [
						{
							url: blog.featured_image_url,
						},
					]
				: [],
			publishedTime: blog?.date,
			modifiedTime: blog?.date,
			authors: ["Adam", "Adam"],
		},
	};
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
	const { slug } = await params;

	if (!slug) {
		redirect("/blog");
	}

	// 直接调用服务层函数，避免自引用 fetch
	const apiResponse = await getBlogs({ slug });

	if (!apiResponse || !apiResponse.posts || apiResponse.posts.length === 0) {
		notFound();
	}

	const blogData = apiResponse.posts[0];

	return (
		<Container data-aos="fade-up">
			<BackButton url="/blog" />
			<BlogDetail {...blogData} />
			{/* 客户端组件：页面加载后发送浏览量统计请求 */}
			<TrackView slug={blogData.slug} />
			<section id="comments">{/* <GiscusComment isEnableReaction={false} /> */}</section>
		</Container>
	);
}
