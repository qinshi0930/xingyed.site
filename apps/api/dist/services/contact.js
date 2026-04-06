"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// 配置 163 邮箱 SMTP 传输器
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || "smtp.163.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true, // 使用 SSL
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const sendMessage = async (formData) => {
    try {
        // 发送邮件
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: process.env.SMTP_TO,
            subject: `新的联系表单消息 - 来自 ${formData.name}`,
            replyTo: formData.email,
            html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<style>
						body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
						.container { max-width: 600px; margin: 0 auto; padding: 20px; }
						.header { background: #4F46E5; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
						.content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
						.field { margin-bottom: 15px; }
						.label { font-weight: bold; color: #555; }
						.value { margin-top: 5px; padding: 10px; background: white; border-radius: 3px; }
						.footer { margin-top: 20px; padding: 10px; text-align: center; color: #888; font-size: 12px; }
					</style>
				</head>
				<body>
					<div class="container">
						<div class="header">
							<h2>📬 新的联系表单提交</h2>
						</div>
						<div class="content">
							<div class="field">
								<div class="label">👤 姓名：</div>
								<div class="value">${formData.name}</div>
							</div>
							<div class="field">
								<div class="label">📧 邮箱：</div>
								<div class="value">${formData.email}</div>
							</div>
							<div class="field">
								<div class="label">💬 留言内容：</div>
								<div class="value">${formData.message.replace(/\n/g, "<br>")}</div>
							</div>
						</div>
						<div class="footer">
							此邮件由个人博客联系表单自动发送
						</div>
					</div>
				</body>
				</html>
			`,
            text: `
姓名: ${formData.name}
邮箱: ${formData.email}
留言内容:
${formData.message}
			`,
        });
        return {
            status: 200,
            data: {
                messageId: info.messageId,
                message: "邮件发送成功",
            },
        };
    }
    catch (error) {
        console.error("邮件发送失败:", error);
        return {
            status: 500,
            message: error instanceof Error ? error.message : "邮件发送失败",
        };
    }
};
exports.sendMessage = sendMessage;
