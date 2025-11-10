import { notFound } from "next/navigation";

import BackButton from "@/common/components/elements/BackButton";
import Container from "@/common/components/elements/Container";
import PageHeading from "@/common/components/elements/PageHeading";
import ProjectDetail from "@/modules/projects/components/ProjectDetail";
import prisma from "@/prisma/prisma";

// interface ProjectsDetailPageProps {
// 	project: ProjectItemProps;
// }

export async function generateStaticParams() {
	const projects = await prisma.projects.findMany({
		select: {
			slug: true,
		},
	});

	return projects.map((project) => ({
		slug: project.slug,
	}));
}

async function getProject(slug: string) {
	const response = await prisma.projects.findUnique({
		where: {
			slug,
		},
	});

	if (!response) {
		notFound();
	}

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
