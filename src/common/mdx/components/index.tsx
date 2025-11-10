import type { MDXComponents } from "next-mdx-remote-client/rsc";

import Admonition, { admonition } from "./Admonition";

export const components: MDXComponents = {
	wrapper: ({ children }) => <div className="prose prose-lg mx-auto">{children}</div>,
	admonition,
	Admonition,
};
