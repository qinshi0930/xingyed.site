import { notFound } from "next/navigation";

import type { MdxFileContentProps } from "@/common/types/learn";

import BackButton from "@/common/components/elements/BackButton";
import Container from "@/common/components/elements/Container";
import PageHeading from "@/common/components/elements/PageHeading";
import { PROJECT_CONTENTS } from "@/common/constant/projects";
import { loadMdxFiles } from "@/common/libs/mdx";
import ProjectDetail from "@/modules/projects/components/ProjectDetail";

// interface ProjectsDetailPageProps {
// 	project: ProjectItemProps;
// }

export async function generateStaticParams() {
	const contentList = loadMdxFiles(`../projects`);
	return contentList.map((item) => ({ slug: item.slug }));
}

async function getProject(slug: string) {
	const contentList = loadMdxFiles("../projects");
	const contentData = contentList.find((item) => item.slug === slug);

	if (!contentData) {
		notFound();
	}

	const projectData = PROJECT_CONTENTS.find((item) => item.slug === slug);
	const { content } = contentData as unknown as MdxFileContentProps;

	const response = {
		...projectData,
		content,
	};

	return JSON.parse(JSON.stringify(response));
}

async function ProjectsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const project = await getProject(slug);
	const PAGE_TITLE = project?.title;
	const PAGE_DESCRIPTION = project?.description;

	return (
		<>
			<Container data-aos="fade-up">
				<BackButton url="/projects" />
				<PageHeading title={PAGE_TITLE} description={PAGE_DESCRIPTION} />
				<ProjectDetail {...project} />
			</Container>
		</>
	);
}
export default ProjectsDetailPage;
