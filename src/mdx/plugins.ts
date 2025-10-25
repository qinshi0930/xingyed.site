import type { FlexibleContainerOptions } from "remark-flexible-containers";
import type { PluggableList } from "unified";

import remarkFlexibleContainers from "remark-flexible-containers";
import remarkGfm from "remark-gfm";

import { toTitleCase } from "@/lib/utils";

const remarkPlugins: PluggableList = [
	remarkGfm,
	[
		remarkFlexibleContainers,
		{
			title: () => null,
			containerTagName: "admonition",
			containerProperties: (type, title) => {
				return {
					"data-type": type?.toLowerCase(),
					"data-title": title ?? toTitleCase(type),
				};
			},
		} as FlexibleContainerOptions,
	],
];

const rehypePlugins: PluggableList = [];

const recmaPlugins: PluggableList = [];

export const plugins = {
	remarkPlugins,
	rehypePlugins,
	recmaPlugins,
};
