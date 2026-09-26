import type { TocItem } from "remark-flexible-toc";

import matter from "gray-matter";
import fs from "node:fs";
import path from "node:path";
import { remark } from "remark";
import remarkFlexibleToc from "remark-flexible-toc";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";

interface MdxFileProps {
	slug: string;
	frontMatter: Record<string, unknown>;
	content: string;
}

export const loadMdxFiles = (slug: string): MdxFileProps[] => {
	const dirPath = path.join(process.cwd(), "src", "contents", slug);

	if (!fs.existsSync(dirPath)) {
		return [];
	}

	const files = fs.readdirSync(dirPath);

	const contents = files.map((file) => {
		const filePath = path.join(dirPath, file);
		const source = fs.readFileSync(filePath, "utf-8");
		const { content, data } = matter(source);

		const mdxCompiler = remark().use(remarkParse).use(remarkGfm).use(remarkMdx);
		const mdxContent = mdxCompiler.processSync(content).toString();

		return {
			slug: file.replace(".mdx", ""),
			frontMatter: data,
			content: mdxContent,
		};
	});

	return contents;
};

export const getMdxFileCount = (slug: string) => {
	const dirPath = path.join(process.cwd(), "src", "contents", slug);
	const files = fs.readdirSync(dirPath);
	const mdxFiles = files.filter((file) => file.endsWith(".mdx"));
	return mdxFiles.length;
};

/**
 * 从 markdown 源码抽取目录（TOC）。
 *
 * 必须在服务端调用。react-markdown 那侧是在浏览器里用 useEffect 产出 TOC 的，
 * 导致目录进不了静态 HTML；这里用与 ReactMarkdown 相同的解析链路（remark-parse + remark-gfm），
 * 锚点规则与正文的 rehype-slug 一致（两者都用 github-slugger，且按同一顺序遍历同一份标题文本）。
 */
export const extractToc = (markdown: string): TocItem[] => {
	const toc: TocItem[] = [];

	remark().use(remarkGfm).use(remarkFlexibleToc, { tocRef: toc }).processSync(markdown);

	return toc;
};
