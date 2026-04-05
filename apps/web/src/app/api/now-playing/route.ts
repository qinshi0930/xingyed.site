import { NextResponse } from "next/server";

import { getNowPlaying } from "@/services/spotify";

export async function GET() {
	const response = await getNowPlaying();

	const nextResponse = NextResponse.json(response?.data);
	nextResponse.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");

	return nextResponse;
}
