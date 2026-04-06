/* eslint-disable unused-imports/no-unused-vars */
import type { EvaluateOptions } from "next-mdx-remote-client/rsc";

import { isNil } from "lodash";
import { evaluate } from "next-mdx-remote-client/rsc";
import { notFound } from "next/navigation";

import type { Frontmatter, Scope } from "./types";

import { components } from "./components";
import { plugins } from "./plugins";

interface MdxEvaluateProps {
	source: string;
}

export default async function MdxEvaluate({ source }: MdxEvaluateProps) {
	const options: EvaluateOptions<Scope> = {
		scope: {
			readingTime: "5min",
		},
		disableExports: true,
		disableImports: true,
		parseFrontmatter: true,
		vfileDataIntoScope: ["toc"],
		mdxOptions: {
			...plugins,
		},
	};

	const { content, frontmatter, error } = await evaluate<Frontmatter>({
		source,
		options,
		components,
	});

	if (!isNil(error)) {
		console.error(error);
		notFound();
	}

	return <>{content}</>;
}
