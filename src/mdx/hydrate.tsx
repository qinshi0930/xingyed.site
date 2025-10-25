"use client";

import { isNil } from "lodash";
import { hydrate } from "next-mdx-remote-client/csr";
import { notFound } from "next/navigation";

import { components } from "@/mdx/components";

import type { MdxSerializeResult } from "./serialize";

export default function MdxHydrate(mdxSource: MdxSerializeResult) {
	if (isNil(mdxSource)) return notFound();
	if ("error" in mdxSource) return notFound();

	const { content } = hydrate({ ...mdxSource, components });

	return (
		<>
			<h1>{mdxSource.frontmatter.title}</h1>
			<small>{mdxSource.frontmatter.date}</small>
			{content}
		</>
	);
}
