import { createClient } from "@supabase/supabase-js";

// 优先使用不带 NEXT_PUBLIC_ 前缀的变量（服务端专用）
// 如果不存在则 fallback 到 NEXT_PUBLIC_ 前缀的变量
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
	throw new Error("Missing Supabase service role key");
}

export const supabaseServerClient = createClient(supabaseUrl, supabaseServiceKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});
