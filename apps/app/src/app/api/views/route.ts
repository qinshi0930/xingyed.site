import { NextResponse } from "next/server";

import redis from "@/common/libs/redis";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const slug = searchParams.get("slug");

	if (!slug) {
		return NextResponse.json({ error: "slug parameter is required" }, { status: 400 });
	}

	try {
		const views = await redis.get(`views:${slug}`);
		const viewsCount = views ? Number.parseInt(views, 10) : 0;

		return NextResponse.json({ views: viewsCount });
	} catch (error) {
		console.error("Failed to fetch views:", error);
		return NextResponse.json({ error: "Failed to fetch content meta" }, { status: 500 });
	}
}

export async function POST(request: Request) {
	const { searchParams } = new URL(request.url);
	const slug = searchParams.get("slug");

	if (!slug) {
		return NextResponse.json({ error: "slug parameter is required" }, { status: 400 });
	}

	try {
		const views = await redis.incr(`views:${slug}`);
		return NextResponse.json({ views });
	} catch (error) {
		console.error("Failed to update views:", error);
		return NextResponse.json({ error: "Failed to update views count" }, { status: 500 });
	}
}
