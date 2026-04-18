#!/usr/bin/env bun
/**
 * GitHub OAuth 配置测试脚本
 * 验证环境变量和 Better Auth 配置
 */

export {};

console.log("🔍 开始测试 GitHub OAuth 配置...\n");

// 测试 1: 环境变量检查
console.log("📋 步骤 1: 检查环境变量");
const clientId = process.env.AUTH_GITHUB_CLIENT_ID;
const clientSecret = process.env.AUTH_GITHUB_CLIENT_SECRET;
const betterAuthUrl = process.env.BETTER_AUTH_URL;

if (clientId) {
	console.log(`✅ AUTH_GITHUB_CLIENT_ID: 已配置 (${clientId.substring(0, 10)}...)`);
} else {
	console.log(`❌ AUTH_GITHUB_CLIENT_ID: 缺失`);
}

if (clientSecret) {
	console.log(`✅ AUTH_GITHUB_CLIENT_SECRET: 已配置 (${clientSecret.substring(0, 10)}...)`);
} else {
	console.log(`❌ AUTH_GITHUB_CLIENT_SECRET: 缺失`);
}

if (betterAuthUrl) {
	console.log(`✅ BETTER_AUTH_URL: ${betterAuthUrl}`);
} else {
	console.log(`⚠️  BETTER_AUTH_URL: 未设置（可能影响回调 URL）`);
}

// 测试 2: Better Auth 配置验证
console.log("\n📋 步骤 2: 验证 OAuth 配置格式");

if (clientId && clientSecret) {
	const isOAuthEnabled = !!(
		clientId &&
		clientSecret &&
		clientId !== '""' &&
		clientSecret !== '""'
	);

	if (isOAuthEnabled) {
		console.log("✅ GitHub OAuth 已启用");
		console.log(
			`   Client ID 格式: ${clientId.startsWith("Ov") ? "✓ 正确" : "⚠️  可能不正确"}`,
		);
		console.log(`   Client Secret 长度: ${clientSecret.length} 字符`);
	} else {
		console.log("⚠️  GitHub OAuth 未正确配置（值为空字符串）");
	}
}

// 测试 3: 回调 URL 验证
console.log("\n📋 步骤 3: 验证回调 URL");
const baseUrl = betterAuthUrl || "http://localhost:3000";
const callbackUrl = `${baseUrl}/api/auth/callback/github`;
console.log(`   回调 URL: ${callbackUrl}`);
console.log(`   请确保在 GitHub OAuth App 中配置此回调 URL`);

// 测试 4: Better Auth 导入测试
console.log("\n📋 步骤 4: 测试 Better Auth 导入");
try {
	const { auth } = await import("../src/api/auth");
	console.log("✅ Better Auth 实例创建成功");
	console.log(`   数据库适配器: Drizzle (PostgreSQL)`);
	console.log(
		`   邮箱密码登录: ${auth.options?.emailAndPassword?.enabled ? "已启用" : "未启用"}`,
	);

	const socialProviders = auth.options?.socialProviders;
	if (socialProviders?.github) {
		console.log("✅ GitHub OAuth Provider: 已配置");
	} else {
		console.log("⚠️  GitHub OAuth Provider: 未配置（环境变量可能为空）");
	}
} catch (err) {
	console.error(`❌ Better Auth 导入失败:`, err);
}

console.log("\n✨ GitHub OAuth 配置测试完成！");
console.log("\n📝 下一步：");
console.log("1. 访问 http://localhost:3000/guestbook");
console.log("2. 点击「使用 GitHub 登录」按钮");
console.log("3. 应该跳转到 GitHub 授权页面");
console.log(`4. 授权后应该重定向回: ${callbackUrl}`);
