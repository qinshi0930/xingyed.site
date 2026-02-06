import type { Metadata } from "next";

// import dynamic from "next/dynamic";
import { notFound, redirect } from "next/navigation";

import BackButton from "@/common/components/elements/BackButton";
import Container from "@/common/components/elements/Container";
import { formatExcerpt } from "@/common/helpers";
import { getBlogById, loadBlogFiles } from "@/common/libs/blog";
import redis from "@/common/libs/redis";
import BlogDetail from "@/modules/blog/components/BlogDetail";

// const GiscusComment = dynamic(() => import("@/modules/blog/components/GiscusComment"));

interface BlogDetailPageProps {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ [key: string]: string }>;
}

async function incrementViews(slug: string) {
	if (process.env.NODE_ENV === "production") {
		try {
			// 直接调用 Redis，避免 SSR 期间的 HTTP 自我调用
			await redis.incr(`views:${slug}`);
		} catch (error) {
			console.error("Failed to increment views:", error);
		}
	}
}

export async function generateStaticParams() {
	const blogs = loadBlogFiles();
	return blogs.map((blog) => ({ slug: blog.slug }));
}

export async function generateMetadata({
	// params,
	searchParams,
}: BlogDetailPageProps): Promise<Metadata> {
	// const { slug } = await params;
	const { id } = await searchParams;

	if (!id) {
		return {};
	}

	const blogData = getBlogById(Number.parseInt(id));

	if (!blogData) {
		return {};
	}

	const description = formatExcerpt(blogData?.excerpt?.rendered);
	const blogSlug = `blog/${blogData?.slug}?id=${blogData?.id}`;
	const canonicalUrl = `https://Adam.id/${blogSlug}`;

	return {
		title: `${blogData?.title?.rendered} - Blog Adam`,
		description,
		alternates: {
			canonical: canonicalUrl,
		},
		openGraph: {
			type: "article",
			title: `${blogData?.title?.rendered} - Blog Adam`,
			description,
			url: canonicalUrl,
			siteName: "Adam blog",
			images: blogData?.featured_image_url
				? [
						{
							url: blogData.featured_image_url,
						},
					]
				: [],
			publishedTime: blogData?.date,
			modifiedTime: blogData?.date,
			authors: ["Adam", "Adam"],
		},
	};
}

export default async function BlogDetailPage({ searchParams }: BlogDetailPageProps) {
	const { id } = await searchParams;

	if (!id) {
		redirect("/blog");
	}

	const blogData = getBlogById(Number.parseInt(id));

	if (!blogData) {
		notFound();
	}

	await incrementViews(blogData?.slug);

	return (
		<Container data-aos="fade-up">
			<BackButton url="/blog" />
			<BlogDetail {...blogData} />
			<section id="comments">{/* <GiscusComment isEnableReaction={false} /> */}</section>
		</Container>
	);
}
