import { NextResponse } from "next/server";

import { getGithubUser } from "@/services/github";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const type = searchParams.get("type") || "";

	const response = await getGithubUser(type);

	const nextResponse = NextResponse.json(response.data, { status: response.status });
	nextResponse.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");

	return nextResponse;
}
