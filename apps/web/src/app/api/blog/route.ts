import { NextResponse } from "next/server";

import { getBlogs } from "@/common/libs/blog";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const page = Number(searchParams.get("page")) || 1;
		const per_page = Number(searchParams.get("per_page")) || 9;
		const search = searchParams.get("search") || "";
		const category = searchParams.get("category") || "";

		// 特殊处理 featured（categories=16 映射为 is_featured）
		const categories = searchParams.get("categories");
		const is_featured = categories === "16" ? true : undefined;

		const data = getBlogs({
			page,
			per_page,
			search,
			category,
			is_featured,
		});

		const response = NextResponse.json({
			status: true,
			data,
		});

		response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");

		return response;
	} catch (error) {
		return NextResponse.json({ status: false, error });
	}
}
