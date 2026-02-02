import type { Metadata } from "next";

import { notFound } from "next/navigation";

import type { MdxFileContentProps } from "@/common/types/learn";

import BackButton from "@/common/components/elements/BackButton";
import Container from "@/common/components/elements/Container";
import PageHeading from "@/common/components/elements/PageHeading";
import { LEARN_CONTENTS } from "@/common/constant/learn";
import { loadMdxFiles } from "@/common/libs/mdx";
import ContentList from "@/modules/learn/components/ContentList";

interface ContentPageProps {
	params: Promise<{ content: string }>;
}

export async function generateStaticParams() {
	return LEARN_CONTENTS.map((content) => ({
		content: content.slug,
	}));
}

export async function generateMetadata({ params }: ContentPageProps): Promise<Metadata> {
	const content = LEARN_CONTENTS.find(async (item) => item?.slug === (await params).content);

	if (!content) {
		return {
			title: "Not Found",
		};
	}

	const canonicalUrl = `https://localhost:8080/learn/${content.slug}`;

	return {
		title: `Learn ${content.title} - Adam`,
		description: content.description,
		alternates: {
			canonical: canonicalUrl,
		},
		openGraph: {
			url: canonicalUrl,
			images: [
				{
					url: content.image,
				},
			],
			siteName: "Adam",
		},
	};
}

export default async function LearnContentPage({ params }: ContentPageProps) {
	const slug = (await params).content;
	const content = LEARN_CONTENTS.find((item) => item?.slug === slug);

	if (!content) {
		notFound();
	}

	const subContentList = loadMdxFiles(`learn/${content.slug}`) as unknown as MdxFileContentProps[];
	const sortedSubContents = subContentList.sort((a, b) => a.frontMatter.id - b.frontMatter.id);

	return (
		<Container data-aos="fade-up">
			<BackButton url="/learn" />
			<PageHeading title={content.title} description={content.description} />
			<ContentList
				sortedSubContents={sortedSubContents}
				content={content}
				title={content.title}
			/>
		</Container>
	);
}
