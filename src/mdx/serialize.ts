"use server";

import type { SerializeOptions, SerializeResult } from "next-mdx-remote-client/serialize";

import { serialize } from "next-mdx-remote-client/serialize";

import { plugins } from "./plugins";

interface Scope extends Record<string, unknown> {
	readingTime: string;
}

interface Frontmatter extends Record<string, unknown> {
	title: string;
	date: string;
}

export type MdxSerializeResult = SerializeResult<Frontmatter, Scope>;

export const serializeMdx = async (source: string) => {
	const options: SerializeOptions<Scope> = {
		scope: {
			readingTime: "5min",
		},
		mdxOptions: {
			...plugins,
		},
	};

	return serialize<Frontmatter, Scope>({ source, options });
};
