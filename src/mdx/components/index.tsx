import type { MDXComponents } from "next-mdx-remote-client/rsc";
import type { PropsWithChildren } from "react";

import Admonition, { admonition } from "./Admonition";
interface PreProps {
	className?: string;
}
function Pre({ children }: PropsWithChildren<PreProps>) {
	return (
		<pre>
			<div className="top-0 left-0 h-10 bg-slate-800 rounded-t-sm border border-neutral-600"></div>
			<div className="px-4 py-2 bg-neutral-700 overflow-auto rounded-b-sm border border-neutral-600">
				<div className="p-2">{children}</div>
			</div>
		</pre>
	);
}

export const components: MDXComponents = {
	wrapper: ({ children }) => <div className="prose prose-lg mx-auto">{children}</div>,
	h1: ({ children }) => <h1 className="pt-5 pb-8">{children}</h1>,
	h2: ({ children }) => <h2 className="pt-4 pb-2">{children}</h2>,
	p: ({ children }) => <p className="py-2">{children}</p>,
	pre: ({ children }) => <Pre>{children}</Pre>,
	admonition,
	Admonition,
};
