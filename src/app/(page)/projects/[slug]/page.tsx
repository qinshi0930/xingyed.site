import { isNil } from "lodash";
import { notFound } from "next/navigation";

import type { ProjectSchema } from "@/lib/seed/generators/projects";

import projects from "@/lib/seed/data/projects.json";
import MDXRenderer from "@/mdx/mdxRenderer";

function getProjectBySlug(slug: string): ProjectSchema | undefined {
	return projects.find((value) => value.slug === slug);
}

export async function generateStaticParams() {
	const slugs = projects.map((post) => ({
		slug: post.slug,
	}));
	return slugs;
}

function MDXContet({ content }: { content: string }) {
	return <MDXRenderer source={content} />;
}

// export default async function ProjectDetail(props: PageProps<"/projects/[slug]">) {
export default async function ProjectDetail({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const post = getProjectBySlug(slug);

	return (
		<div className="page-container">
			<div className="text-wrap overflow-hidden">
				{isNil(post) ? notFound() : <MDXContet content={post.content} />}
			</div>
		</div>
	);
}
