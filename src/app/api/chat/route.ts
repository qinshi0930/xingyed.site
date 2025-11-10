import { NextResponse } from "next/server";

import { postChatPrompt } from "@/services/chatgpt";

export async function POST(request: Request) {
	try {
		const { prompt } = await request.json();

		const response = await postChatPrompt(prompt);

		if (response?.status >= 400) {
			return NextResponse.json({ error: response?.message }, { status: response?.status });
		} else {
			const reply = response?.data?.choices[0]?.text;
			return NextResponse.json({ reply });
		}
	} catch (error) {
		return NextResponse.json({ error }, { status: 500 });
	}
}
