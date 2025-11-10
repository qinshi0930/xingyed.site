/* eslint-disable unused-imports/no-unused-vars */
import { NextResponse } from "next/server";

import { sendMessage } from "@/services/contact";

const FORM_API_KEY = process.env.CONTACT_FORM_API_KEY as string;

export async function POST(request: Request) {
	try {
		const { formData } = await request.json();

		const updatedFormData = new FormData();
		updatedFormData.append("access_key", FORM_API_KEY);

		for (const key in formData) {
			updatedFormData.append(key, formData[key]);
		}

		const response = await sendMessage(updatedFormData);

		return NextResponse.json({
			status: 200,
			message: response?.data?.message,
		});
	} catch (error) {
		return NextResponse.json({ error: "Something went wrong!" }, { status: 500 });
	}
}
