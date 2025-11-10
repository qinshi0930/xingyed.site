"use server";

import type { SerializeOptions, SerializeResult } from "next-mdx-remote-client/serialize";

import { serialize } from "next-mdx-remote-client/serialize";

import type { Frontmatter, Scope } from "./types";

import { plugins } from "./plugins";

export type MdxSerializeResult = SerializeResult<Frontmatter, Scope>;

export const serializeMdx = async (source: string) => {
	const options: SerializeOptions<Scope> = {
		scope: {
			readingTime: "5min",
		},
		vfileDataIntoScope: ["toc"],
		mdxOptions: {
			...plugins,
		},
	};

	return serialize<Frontmatter, Scope>({ source, options });
};
