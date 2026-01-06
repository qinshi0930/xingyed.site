import { NextResponse } from "next/server";

// import prisma from "@/prisma/prisma";

export async function GET() {
	try {
		// const response = await prisma.projects.findMany();
		const response = null;
		return NextResponse.json({ status: true, data: response });
	} catch (error) {
		return NextResponse.json({ status: false, error });
	}
}
