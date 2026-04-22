-- 启用 RLS
ALTER TABLE guestbook_messages ENABLE ROW LEVEL SECURITY;

-- RLS 策略
-- SELECT：允许所有人查看（前端直接查询列表需要）
DROP POLICY IF EXISTS "任何人都可以查看留言" ON guestbook_messages;
CREATE POLICY "任何人都可以查看留言"
ON guestbook_messages FOR SELECT
USING (true);

-- INSERT/UPDATE/DELETE：禁止前端直接操作（强制走 Hono API）
-- 项目使用 better-auth 而非 Supabase Auth，auth.uid() 不可用
-- API 层使用 service_role key 绕过 RLS，不受此策略影响
DROP POLICY IF EXISTS "认证用户可以创建留言" ON guestbook_messages;
DROP POLICY IF EXISTS "用户只能更新自己的留言" ON guestbook_messages;
DROP POLICY IF EXISTS "用户只能删除自己的留言" ON guestbook_messages;
DROP POLICY IF EXISTS "禁止前端直接写入" ON guestbook_messages;
CREATE POLICY "禁止前端直接写入"
ON guestbook_messages FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 启用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE guestbook_messages;
