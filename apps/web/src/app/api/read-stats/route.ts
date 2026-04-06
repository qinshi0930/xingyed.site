import { NextResponse } from "next/server";

import { getALLTimeSinceToday, getReadStats } from "@/services/wakatime";

export async function GET() {
	try {
		const readStatsResponse = await getReadStats();
		const allTimeSinceTodayResponse = await getALLTimeSinceToday();

		const data = {
			...readStatsResponse.data,
			all_time_since_today: allTimeSinceTodayResponse.data,
		};

		const response = NextResponse.json(data);
		response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");

		return response;
		// eslint-disable-next-line unused-imports/no-unused-vars
	} catch (error) {
		return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
	}
}
