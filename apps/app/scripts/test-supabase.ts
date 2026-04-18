#!/usr/bin/env bun
/**
 * Supabase 连接测试脚本
 * 验证数据库连接和 Guestbook 表是否可访问
 */

import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

console.log("🔍 开始测试 Supabase 连接...\n");

// 测试 1: 环境变量检查
console.log("📋 步骤 1: 检查环境变量");
const requiredVars = [
	"NEXT_PUBLIC_SUPABASE_URL",
	"NEXT_PUBLIC_SUPABASE_ANON_KEY",
	"SUPABASE_SERVICE_ROLE_KEY",
	"DATABASE_URL",
];

let allVarsPresent = true;
for (const envVar of requiredVars) {
	const value = process.env[envVar];
	if (value) {
		console.log(`✅ ${envVar}: 已配置`);
	} else {
		console.log(`❌ ${envVar}: 缺失`);
		allVarsPresent = false;
	}
}

if (!allVarsPresent) {
	console.error("\n❌ 缺少必要的环境变量，请检查 .env.local 文件");
	process.exit(1);
}

// 测试 2: Supabase Client 连接（使用 Service Role Key）
console.log("\n📋 步骤 2: 测试 Supabase Client 连接...");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});

try {
	const { data, error } = await supabase.from("guestbook_messages").select("count", {
		count: "exact",
		head: true,
	});

	if (error) {
		console.error(`❌ Supabase Client 连接失败: ${error.message}`);
		console.error(`   错误详情:`, error);
	} else {
		console.log(`✅ Supabase Client 连接成功`);
		console.log(`   Guestbook 表记录数: ${data}`);
	}
} catch (err) {
	console.error(`❌ Supabase Client 连接异常:`, err);
}

// 测试 3: Drizzle ORM 连接（直接 PostgreSQL 连接）
console.log("\n📋 步骤 3: 测试 Drizzle ORM 连接...");
const connectionString = process.env.DATABASE_URL!;

try {
	const client = postgres(connectionString);

	// 执行简单查询测试连接
	const result = await client`SELECT NOW() as current_time`;
	console.log(`✅ Drizzle ORM 连接成功`);
	console.log(`   数据库时间: ${result[0].current_time}`);

	// 测试 guestbook_messages 表
	const tableCheck = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'guestbook_messages'
    ) as table_exists
  `;

	if (tableCheck[0].table_exists) {
		console.log(`✅ guestbook_messages 表存在`);

		// 获取记录数
		const countResult = await client`SELECT COUNT(*) as count FROM guestbook_messages`;
		console.log(`   表记录数: ${countResult[0].count}`);
	} else {
		console.log(`⚠️  guestbook_messages 表不存在，需要运行数据库迁移`);
	}

	await client.end();
} catch (err) {
	console.error(`❌ Drizzle ORM 连接失败:`, err);
}

console.log("\n✨ Supabase 连接测试完成！");
