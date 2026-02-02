import { NextResponse } from "next/server";

import { PROJECT_CONTENTS } from "@/common/constant/projects";

export async function GET() {
	try {
		const response = PROJECT_CONTENTS.filter((p) => p.is_show);
		return NextResponse.json({ status: true, data: response });
	} catch (error) {
		return NextResponse.json({ status: false, error });
	}
}
