import { NextResponse } from "next/server";

import { getBlogComment } from "@/services/devto";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const post_id = searchParams.get("post_id");

		const response = await getBlogComment({
			post_id: post_id as string,
		});

		const nextResponse = NextResponse.json({
			status: true,
			data: response.data,
		});

		nextResponse.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");

		return nextResponse;
	} catch (error) {
		return NextResponse.json({ status: false, error });
	}
}
