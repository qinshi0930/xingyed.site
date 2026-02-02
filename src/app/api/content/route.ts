import { NextResponse } from "next/server";

import { loadMdxFiles } from "@/common/libs/mdx";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const category = searchParams.get("category");
	const contentList = await loadMdxFiles(`learn/${category}`);

	const data = contentList.map((item) => ({
		id: item?.frontMatter?.id,
		parent_slug: category || "",
		slug: item.slug || "",
		title: item.frontMatter.title || "",
	}));

	return NextResponse.json({ data });
}
