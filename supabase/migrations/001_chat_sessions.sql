-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 001: Chat Sessions + User Memory
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Chat sessions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID    REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id UUID    REFERENCES documents(id)  ON DELETE CASCADE NOT NULL,
  title       TEXT    NOT NULL DEFAULT 'New Chat',
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_doc
  ON chat_sessions(user_id, document_id);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_updated
  ON chat_sessions(user_id, updated_at DESC);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their chat sessions" ON chat_sessions;
CREATE POLICY "Users own their chat sessions"
  ON chat_sessions FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Add session FK to messages (nullable — existing rows keep working) ─────────
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS chat_session_id UUID
  REFERENCES chat_sessions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_messages_session
  ON messages(chat_session_id);

-- 3. User memory ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_memory (
  user_id     UUID    REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  preferences TEXT    DEFAULT '',
  topics      TEXT[]  DEFAULT '{}',
  summary     TEXT    DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their memory" ON user_memory;
CREATE POLICY "Users own their memory"
  ON user_memory FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
