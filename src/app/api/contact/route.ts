import { NextResponse } from "next/server";

import { sendMessage } from "@/services/contact";

export async function POST(request: Request) {
	try {
		const { formData } = await request.json();

		// 验证必填字段
		if (!formData.name || !formData.email || !formData.message) {
			return NextResponse.json({ error: "请填写所有必填字段" }, { status: 400 });
		}

		// 发送邮件
		const response = await sendMessage(formData);

		if (response.status !== 200) {
			return NextResponse.json(
				{ error: response.message || "邮件发送失败" },
				{ status: response.status },
			);
		}

		return NextResponse.json({
			status: 200,
			message: response.data?.message || "消息发送成功",
		});
	} catch (error) {
		console.error("Contact API error:", error);
		return NextResponse.json({ error: "服务器错误，请稍后重试" }, { status: 500 });
	}
}
