"use client";
import type { ReactNode } from "react";

import ReactMarkdown from "react-markdown";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import CodeBlock from "./CodeBlock";

interface MarkdownRendererProps {
	children: string;
}

interface TableProps {
	children: ReactNode;
}

const Table = ({ children }: TableProps) => (
	<div className="table-container">
		<table className="table w-full">{children}</table>
	</div>
);

const MDXComponent = ({ children }: MarkdownRendererProps) => {
	return (
		<>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[rehypeSlug, rehypeAutolinkHeadings]}
				components={{
					a: ({ node: _node, ...props }) => (
						<a
							className="cursor-pointer text-teal-500 hover:text-teal-400 hover:underline"
							{...props}
						>
							{props.children}
						</a>
					),
					p: ({ node: _node, ...props }) => <div {...props}>{props.children}</div>,
					h2: ({ node: _node, ...props }) => (
						<h2 className="text-xl font-medium dark:text-neutral-300" {...props}>
							{props.children}
						</h2>
					),
					h3: ({ node: _node, ...props }) => (
						<h3
							className="pt-4 text-[18px] font-medium leading-snug dark:text-neutral-300"
							{...props}
						>
							{props.children}
						</h3>
					),
					ul: ({ node: _node, ...props }) => (
						<ul className="list-disc space-y-3 pb-2 pl-10" {...props}>
							{props.children}
						</ul>
					),
					ol: ({ node: _node, ...props }) => (
						<ol className="list-decimal space-y-3 pb-2 pl-10" {...props}>
							{props.children}
						</ol>
					),
					code: ({ node: _node, ...props }) => (
						<CodeBlock {...props}>{props.children}</CodeBlock>
					),
					blockquote: ({ node: _node, ...props }) => (
						<blockquote
							className="rounded-br-2xl border-l-[5px] border-neutral-700 border-l-cyan-500 bg-neutral-200 py-3 pl-6  text-lg font-medium text-cyan-800 dark:bg-neutral-800 dark:text-cyan-200"
							{...props}
						>
							{props.children}
						</blockquote>
					),
					table: ({ node: _node, ...props }) => (
						<Table {...props}>{props.children}</Table>
					),
					th: ({ node: _node, ...props }) => (
						<th className="border px-3 py-1 text-left dark:border-neutral-600">
							{props.children}
						</th>
					),
					td: ({ node: _node, ...props }) => (
						<td className="border px-3  py-1 dark:border-neutral-600">
							{props.children}
						</td>
					),
				}}
			>
				{children}
			</ReactMarkdown>
		</>
	);
};

export default MDXComponent;
