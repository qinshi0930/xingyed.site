import type { FlexibleContainerOptions } from "remark-flexible-containers";
import type { PluggableList } from "unified";

import recmaMdxEscapeMissingComponents from "recma-mdx-escape-missing-components";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypeImageToolkit from "rehype-image-toolkit";
import rehypePrismPlus from "rehype-prism-plus";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive";
import remarkFlexibleContainers from "remark-flexible-containers";
import remarkFlexibleToc from "remark-flexible-toc";
import remarkGfm from "remark-gfm";

import { toTitleCase } from "@/common/libs/utils";

const remarkPlugins: PluggableList = [
	remarkGfm,
	remarkDirective,
	[
		remarkFlexibleContainers,
		{
			title: () => null,
			containerTagName: "admonition",
			containerProperties: (type: string, title: string) => {
				return {
					"data-type": type?.toLowerCase(),
					"data-title": title ?? toTitleCase(type),
				};
			},
		} as FlexibleContainerOptions,
	],
	remarkFlexibleToc,
];

const rehypePlugins: PluggableList = [
	[rehypePrismPlus, { showLineNumbers: true, ignoreMissing: true }],
	rehypeImageToolkit,
	rehypeSlug,
	rehypeAutolinkHeadings,
	rehypeExternalLinks,
];

const recmaPlugins: PluggableList = [recmaMdxEscapeMissingComponents];

export const plugins = {
	remarkPlugins,
	rehypePlugins,
	recmaPlugins,
};
