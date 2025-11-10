import type { MdxFileContentProps } from "@/common/types/learn";

import BackButton from "@/common/components/elements/BackButton";
import Container from "@/common/components/elements/Container";
import { loadMdxFiles } from "@/common/libs/mdx";
import ContentDetail from "@/modules/learn/components/ContentDetail";
import ContentDetailHeader from "@/modules/learn/components/ContentDetailHeader";

function LearnContentDetailPage({
	data,
	params,
}: {
	data: MdxFileContentProps;
	params: { content: string; slug: string };
}) {
	const { content, frontMatter } = data;
	const parentSlug = params.content;
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

export async function generateMetadata({ params }: { params: { content: string; slug: string } }) {
	const parentContent = params.content;
	const slug = params.slug;

	const contentList = await loadMdxFiles(parentContent);
	const contentData = contentList.find((item) => item.slug === slug);

	if (!contentData) {
		return {
			title: "404 - Page Not Found",
		};
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
