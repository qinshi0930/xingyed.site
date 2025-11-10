import fs from "node:fs";
import path from "node:path";

import { getSource } from "@/common/libs/utils/file";

import { getMarkdownExtension } from ".";

export const RE = /\.mdx?$/; // Only .md(x) files

/**
 * get the markdown file list
 */
export const getMarkdownFiles = (): string[] => {
	return fs
		.readdirSync(path.join(process.cwd(), "data"))
		.filter((filePath: string) => RE.test(filePath));
};

/**
 * get the source and format from a slug !
 */
export const getMarkdownFromSlug = async (
	slug: string,
): Promise<
	| {
			source: string;
			format: "md" | "mdx";
	  }
	| undefined
> => {
	if (!/-mdx?$/.test(slug)) return;

	// replace the last dash with dot in the slug for filename
	const filename = slug.replace(/-(?=[^-]*$)/, ".") as `${string}.md` | `${string}.mdx`;

	const fullPath = path.join(process.cwd(), "data", filename);

	if (fs.existsSync(fullPath)) {
		const source = await getSource(filename);

		if (!source) return;

		return {
			source,
			format: getMarkdownExtension(filename),
		};
	}
};

/**
 * get the frontmatter and slug of a file
 */
// export const getPostInformation = (filename: string): Post | undefined => {
// 	const source = getSourceSync(filename);

// 	if (!source) return;

// 	const frontmatter = getFrontmatter<Frontmatter>(source).frontmatter;

// 	const post: Post = {
// 		...frontmatter,
// 		// replace the last dot with dash in the filename for slug
// 		slug: filename.replace(/\.(?=[^.]*$)/, "-"),
// 	};

// 	return post;
// };
