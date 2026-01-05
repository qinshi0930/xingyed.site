import { notFound } from "next/navigation";

import type { MdxFileContentProps } from "@/common/types/learn";

import BackButton from "@/common/components/elements/BackButton";
import Container from "@/common/components/elements/Container";
import { LEARN_CONTENTS } from "@/common/constant/learn";
import { loadMdxFiles } from "@/common/libs/mdx";
import ContentDetail from "@/modules/learn/components/ContentDetail";
import ContentDetailHeader from "@/modules/learn/components/ContentDetailHeader";

interface LearnContentDetailProps {
	params: Promise<{ content: string; slug: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function getLearnContent({ content, slug }: { content: string; slug: string }) {
	const contentList = loadMdxFiles(content);
	return contentList.find((item) => item.slug === slug);
}

async function LearnContentDetailPage({ params }: LearnContentDetailProps) {
	const contentData = getLearnContent(await params);

	if (!contentData) {
		notFound();
	}

	const { content, frontMatter } = contentData as unknown as MdxFileContentProps;
	const parentSlug = (await params).content;
	const meta = frontMatter;

	return (
		<>
			<Container data-aos="fade-up" className="mb-10">
				<BackButton url={`/learn/${parentSlug}`} />
				<ContentDetailHeader {...meta} />
				<ContentDetail content={content} frontMatter={frontMatter} />
			</Container>
		</>
	);
}

export default LearnContentDetailPage;

export async function generateStaticParams() {
	const params = LEARN_CONTENTS.map((item) => {
		const content = item.slug;
		const contentList = loadMdxFiles(content);
		return contentList.map((item) => ({ content, slug: item.slug }));
	});
	return params.flat();
}

export async function generateMetadata({ params }: LearnContentDetailProps) {
	const { content: parentContent, slug } = await params;

	const contentList = loadMdxFiles(parentContent);
	const contentData = contentList.find((item) => item.slug === slug);

	if (!contentData) {
		notFound();
	}

	const meta = contentData.frontMatter;
	const PAGE_TITLE = meta?.title;
	const PAGE_DESCRIPTION = `Learn ${meta?.category} - ${PAGE_TITLE} with detailed explanations`;

	return {
		title: `Learn ${meta?.category} : ${PAGE_TITLE} - Adam`,
		description: PAGE_DESCRIPTION,
		openGraph: {
			type: "article",
			authors: ["Adam"],
			publishedTime: meta?.updated_at,
			modifiedTime: meta?.updated_at,
			images: [
				{
					url: meta?.cover_url as string,
				},
			],
			siteName: "Adam",
		},
	};
}
