import type { Metadata } from "next";

import axios from "axios";
// import dynamic from "next/dynamic";
import { notFound, redirect } from "next/navigation";

import BackButton from "@/common/components/elements/BackButton";
import Container from "@/common/components/elements/Container";
import { formatExcerpt } from "@/common/helpers";
import BlogDetail from "@/modules/blog/components/BlogDetail";
import { getBlogDetail } from "@/services/blog";

// const GiscusComment = dynamic(() => import("@/modules/blog/components/GiscusComment"));

interface BlogDetailPageProps {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ [key: string]: string }>;
}

async function incrementViews(slug: string) {
	if (process.env.NODE_ENV === "production") {
		await axios.post(`/api/views?&slug=${slug}`);
	}
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

	const response = await getBlogDetail(Number.parseInt(id));

	if (response?.status === 404) {
		return {};
	}

	const blogData = response?.data || {};
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
		redirect("/");
	}

	const response = await getBlogDetail(Number.parseInt(id));

	if (response?.status === 404) {
		notFound();
	}

	const blogData = response?.data || {};

	await incrementViews(blogData?.slug);

	return (
		<Container data-aos="fade-up">
			<BackButton url="/blog" />
			<BlogDetail {...blogData} />
			<section id="comments">{/* <GiscusComment isEnableReaction={false} /> */}</section>
		</Container>
	);
}
