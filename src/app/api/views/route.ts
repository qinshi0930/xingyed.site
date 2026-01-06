/* eslint-disable unused-imports/no-unused-vars */
import { NextResponse } from "next/server";

// import prisma from "@/prisma/prisma";

interface ResponseData {
	views: number;
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const slug = searchParams.get("slug");

	try {
		// const contentMeta = await prisma.content_meta.findUnique({
		// 	where: { slug: slug as string },
		// 	select: { views: true },
		// });

		// const contentViewsCount = contentMeta?.views ?? 0;
		const contentViewsCount = 0;

		const response: ResponseData = {
			views: contentViewsCount,
		};

		return NextResponse.json(response);
	} catch (error) {
		return NextResponse.json({ error: "Failed to fetch content meta" }, { status: 500 });
	}
}

export async function POST(request: Request) {
	const { searchParams } = new URL(request.url);
	const slug = searchParams.get("slug");

	try {
		// const contentMeta = await prisma.content_meta.update({
		// 	where: { slug: slug as string },
		// 	data: {
		// 		views: {
		// 			increment: 1,
		// 		},
		// 	},
		// 	select: { views: true },
		// });
		const contentMeta = { views: 0 };
		return NextResponse.json(contentMeta);
	} catch (error) {
		return NextResponse.json({ error: "Failed to update views count" }, { status: 500 });
	}
}
