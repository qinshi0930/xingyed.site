import { NextResponse } from "next/server";

// import prisma from "@/prisma/prisma";
import { getBlogList } from "@/services/blog";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const page = searchParams.get("page");
		const per_page = searchParams.get("per_page");
		const categories = searchParams.get("categories");
		const search = searchParams.get("search");

		const responseData = await getBlogList({
			page: Number(page) || 1,
			per_page: Number(per_page) || 9,
			categories: categories ? Number(categories) : undefined,
			search: search ? String(search) : undefined,
		});

		// const blogItemsWithViews = await Promise.all(
		// 	responseData?.data?.posts?.map(async (blogItem: BlogItemProps) => {
		// 		const { slug } = blogItem;

		// 		const contentMeta = await prisma.content_meta.findUnique({
		// 			where: { slug: slug as string },
		// 			select: { views: true },
		// 		});

		// 		const viewsCount = contentMeta?.views ?? 0;

		// 		return {
		// 			...blogItem,
		// 			total_views_count: viewsCount,
		// 		};
		// 	}),
		// );

		const response = NextResponse.json({
			status: true,
			data: {
				total_pages: responseData?.data?.total_pages,
				total_posts: responseData?.data?.total_posts,
				page: responseData?.data?.page,
				per_page: responseData?.data?.per_page,
				// posts: blogItemsWithViews,
				categories: responseData?.data?.categories,
			},
		});

		response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");

		return response;
	} catch (error) {
		return NextResponse.json({ status: false, error });
	}
}
