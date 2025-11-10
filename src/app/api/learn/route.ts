import { NextResponse } from "next/server";

import { getMdxFileCount } from "@/common/libs/mdx";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const slug = searchParams.get("slug") as string;
	const count = await getMdxFileCount(slug);

	return NextResponse.json({ count });
}
