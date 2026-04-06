import { getFrontmatter } from "next-mdx-remote-client/utils";

import type { Frontmatter } from "../types";

/******************************************************/
export const obtainFrontmatter = (source: string): Frontmatter => {
	const frontmatter = getFrontmatter<Frontmatter>(source).frontmatter;

	return frontmatter;
};

/******************************************************/

export function getMarkdownExtension(fileName: `${string}.md` | `${string}.mdx`): "md" | "mdx" {
	const match = fileName.match(/\.mdx?$/);

	return match![0].substring(1) as "md" | "mdx";
}

/******************************************************/

export function validateExports(
	format: "md" | "mdx" | undefined,
	mod: Record<string, unknown>,
	isExportsDisabled: boolean,
) {
	const isEmptyExport = Object.keys(mod).length === 0;

	if (format === "md" && isEmptyExport) return "Markdown doesn't support exports";

	// "It has been proven that the exports from the mdx are validated."
	const proofForValidatedExports =
		(mod as any).factorial?.((mod as any).num) === 720
			? "validated exports"
			: "invalidated exports";

	// "It has been proven that all exports in the mdx document are removed."
	const proofForNoExports = isEmptyExport ? "all exports removed" : "invalidated removed exports";

	return isExportsDisabled ? proofForNoExports : proofForValidatedExports;
}
