import type { ProjectItemProps } from "@/common/types/projects";

import Container from "@/common/components/elements/Container";
import EmptyState from "@/common/components/elements/EmptyState";
import PageHeading from "@/common/components/elements/PageHeading";
import Projects from "@/modules/projects";
import prisma from "@/prisma/prisma";

// interface ProjectsPageProps {
// 	projects: ProjectItemProps[];
// }

const PAGE_TITLE = "Projects";
const PAGE_DESCRIPTION = "Several projects that I have worked on, both private and open source.";

async function getProjects(): Promise<ProjectItemProps[]> {
	const response = await prisma.projects.findMany({
		orderBy: [
			{
				is_featured: "desc",
			},
			{
				updated_at: "desc",
			},
		],
	});

	return JSON.parse(JSON.stringify(response));
}

export default async function ProjectsPage() {
	const projects = await getProjects();
	const filteredProjects = projects?.filter((project) => project?.is_show);
	// const [visibleProjects, setVisibleProjects] = useState(6);

	// const loadMore = () => setVisibleProjects((prev) => prev + 2);
	// const hasMore = visibleProjects < projects.length;

	if (filteredProjects?.length === 0) {
		return <EmptyState message="No Data" />;
	}

	return (
		<>
			<Container data-aos="fade-up">
				<PageHeading title={PAGE_TITLE} description={PAGE_DESCRIPTION} />
				<Projects projects={filteredProjects} />
			</Container>
		</>
	);
}
