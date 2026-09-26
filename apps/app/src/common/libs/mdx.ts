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

	// 只读内容文件；目录里出现杂项（如 .DS_Store、README）时不再拿去解析
	const files = fs.readdirSync(dirPath).filter((file) => file.endsWith(".mdx"));

	const contents = files.map((file) => {
		const filePath = path.join(dirPath, file);
		const source = fs.readFileSync(filePath, "utf-8");
		const { content, data } = matter(source);

		const mdxCompiler = remark().use(remarkParse).use(remarkGfm).use(remarkMdx);
		const mdxContent = mdxCompiler.processSync(content).toString();

		// 与 api/services/blog.ts 的 loadBlogFiles 保持同一规则：
		// frontmatter 的 slug 优先，否则回退到文件名（去掉扩展名）
		const frontMatterSlug = data.slug;

		return {
			slug:
				typeof frontMatterSlug === "string" && frontMatterSlug.length > 0
					? frontMatterSlug
					: file.replace(/\.mdx$/, ""),
			frontMatter: data,
			content: mdxContent,
		};
	});

	return contents;
};

export const getMdxFileCount = (slug: string) => {
	const dirPath = path.join(process.cwd(), "src", "contents", slug);

	// 目录不存在时返回 0，而不让 readdirSync 抛 ENOENT（路由层会变成 500）
	if (!fs.existsSync(dirPath)) {
		return 0;
	}

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
