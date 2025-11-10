"use client";

import { motion } from "motion/react";
import { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

import type { ProjectsProps } from "@/common/types/projects";

import EmptyState from "@/common/components/elements/EmptyState";

import ProjectCard from "./ProjectCard";

interface ProjectsComponentProps {
	projects: ProjectsProps["projects"];
	// loadMore: () => void;
	// hasMore: boolean;
}

const Projects = ({ projects }: ProjectsComponentProps) => {
	const [visibleProjects, setVisibleProjects] = useState(6);

	// const filteredProjects = projects.filter((project) => project?.is_show);

	if (projects?.length === 0) {
		return <EmptyState message="No Data" />;
	}

	const dataLength = projects ? projects.length : 0;
	const loadMore = () => setVisibleProjects((prev) => prev + 2);
	const hasMore = projects ? visibleProjects < projects.length : false;

	return (
		<InfiniteScroll
			dataLength={dataLength}
			next={loadMore}
			hasMore={hasMore}
			loader={<h4>Loading...</h4>}
			style={{ overflow: "hidden" }}
		>
			<div className="grid gap-5 px-1 pt-2 sm:grid-cols-2">
				{projects?.map((project, index) => (
					<motion.div
						key={project.slug}
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.3, delay: index * 0.1 }}
					>
						<ProjectCard {...project} />
					</motion.div>
				))}
			</div>
		</InfiniteScroll>
	);
};

export default Projects;
