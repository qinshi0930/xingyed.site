import type { EvaluateOptions } from "next-mdx-remote-client/rsc";

import { evaluate } from "next-mdx-remote-client/rsc";
import { notFound } from "next/navigation";

import { components } from "./components";
import { plugins } from "./plugins";

interface Frontmatter extends Record<string, unknown> {
	title: string;
	date: string;
}

// interface Props {
// 	error: Error | string;
// }
// function ErrorComponent({ error }: Props) {
// 	return (
// 		<div id="mdx-error">
// 			<pre style={{ color: "var(--error)" }}>
// 				<code>{typeof error === "string" ? error : error.message}</code>
// 			</pre>
// 		</div>
// 	);
// }

interface MdxEvaluateProps {
	source: string;
}

export default async function MdxEvaluate({ source }: MdxEvaluateProps) {
	const options: EvaluateOptions = {
		mdxOptions: {
			...plugins,
		},
		parseFrontmatter: true,
	};

	const { content, frontmatter, error } = await evaluate<Frontmatter>({
		source,
		options,
		components,
	});

	// if (!isNil(error)) notFound();
	if (error) {
		console.log("error: ", error);
		notFound();
	}

	return (
		<>
			<h1>{frontmatter.title}</h1>
			<p>Last Updated: {frontmatter.date}</p>
			{content}
		</>
	);
}
