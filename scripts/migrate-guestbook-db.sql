-- Guestbook 模块数据库迁移脚本
-- 在 Supabase Dashboard SQL Editor 中运行此脚本

-- 创建 better-auth 相关表
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  image TEXT,
  username TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES "user"(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "account" (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES "user"(id),
  provider_id TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建 Guestbook 表
CREATE TABLE IF NOT EXISTS guestbook_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id),
  user_name TEXT NOT NULL,
  user_image TEXT,
  github_username TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_guestbook_created_at ON guestbook_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guestbook_user_id ON guestbook_messages(user_id);

-- 启用 RLS
ALTER TABLE guestbook_messages ENABLE ROW LEVEL SECURITY;

-- RLS 策略
DROP POLICY IF EXISTS "任何人都可以查看留言" ON guestbook_messages;
CREATE POLICY "任何人都可以查看留言"
ON guestbook_messages FOR SELECT
USING (true);

DROP POLICY IF EXISTS "认证用户可以创建留言" ON guestbook_messages;
CREATE POLICY "认证用户可以创建留言"
ON guestbook_messages FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "用户只能更新自己的留言" ON guestbook_messages;
CREATE POLICY "用户只能更新自己的留言"
ON guestbook_messages FOR UPDATE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "用户只能删除自己的留言" ON guestbook_messages;
CREATE POLICY "用户只能删除自己的留言"
ON guestbook_messages FOR DELETE
USING (user_id = auth.uid());

-- 启用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE guestbook_messages;
