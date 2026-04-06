import type { Metadata } from "next";

import type { ProjectItemProps } from "@/common/types/projects";

import Container from "@/common/components/elements/Container";
import PageHeading from "@/common/components/elements/PageHeading";
import { PROJECT_CONTENTS } from "@/common/constant/projects";
import Projects from "@/modules/projects";

// interface ProjectsPageProps {
// 	projects: ProjectItemProps[];
// }

const PAGE_TITLE = "Projects";
const PAGE_DESCRIPTION = "Several projects that I have worked on, both private and open source.";

export const metadata: Metadata = {
	title: PAGE_TITLE,
	description: PAGE_DESCRIPTION,
};

async function getProjects(): Promise<ProjectItemProps[]> {
	const response = PROJECT_CONTENTS.sort((a, b) => {
		if (a.is_featured && !b.is_featured) return -1;
		if (!a.is_featured && b.is_featured) return 1;
		return b.updated_at.getTime() - a.updated_at.getTime();
	});

	return JSON.parse(JSON.stringify(response));
}

export default async function ProjectsPage() {
	const projects = await getProjects();
	const filteredProjects = projects?.filter((project) => project?.is_show);

	return (
		<>
			<Container data-aos="fade-up">
				<PageHeading title={PAGE_TITLE} description={PAGE_DESCRIPTION} />
				<Projects projects={filteredProjects} />
			</Container>
		</>
	);
}
