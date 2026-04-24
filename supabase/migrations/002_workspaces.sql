-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002: Workspaces, Invites, Share upgrades
-- Run this in your Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Workspaces ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspaces (
  id         UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT    NOT NULL,
  owner_id   UUID    REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  slug       TEXT    UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workspace members can read" ON workspaces;
CREATE POLICY "Workspace members can read" ON workspaces FOR SELECT
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = id AND wm.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Workspace owners can manage" ON workspaces;
CREATE POLICY "Workspace owners can manage" ON workspaces FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 2. Workspace members ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_members (
  id           UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID    REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID    REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role         TEXT    NOT NULL DEFAULT 'member', -- 'owner' | 'admin' | 'member'
  joined_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws   ON workspace_members(workspace_id);

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can read their workspace members" ON workspace_members;
CREATE POLICY "Members can read their workspace members" ON workspace_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm2
      WHERE wm2.workspace_id = workspace_id AND wm2.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Admins can manage members" ON workspace_members;
CREATE POLICY "Admins can manage members" ON workspace_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm2
      WHERE wm2.workspace_id = workspace_id
        AND wm2.user_id = auth.uid()
        AND wm2.role IN ('owner', 'admin')
    )
  );

-- 3. Workspace invites ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_invites (
  id           UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID    REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  email        TEXT,
  token        TEXT    UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  role         TEXT    NOT NULL DEFAULT 'member',
  invited_by   UUID    REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
  accepted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON workspace_invites(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_ws    ON workspace_invites(workspace_id);

ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read valid invites by token" ON workspace_invites;
CREATE POLICY "Anyone can read valid invites by token" ON workspace_invites FOR SELECT
  USING (accepted_at IS NULL AND expires_at > NOW());
DROP POLICY IF EXISTS "Admins manage invites" ON workspace_invites;
CREATE POLICY "Admins manage invites" ON workspace_invites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- 4. Upgrade shared_chats ──────────────────────────────────────────────────────
ALTER TABLE shared_chats ADD COLUMN IF NOT EXISTS chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE;
ALTER TABLE shared_chats ADD COLUMN IF NOT EXISTS view_count      INTEGER DEFAULT 0;
ALTER TABLE shared_chats ADD COLUMN IF NOT EXISTS allow_duplicate BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_shared_chats_session ON shared_chats(chat_session_id);

-- 5. RLS: allow anon to read messages via public shares (for realtime) ─────────
DROP POLICY IF EXISTS "Anon can read messages for public shares" ON messages;
CREATE POLICY "Anon can read messages for public shares" ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shared_chats sc
      WHERE sc.is_public = true
        AND (
          (sc.document_id    = messages.document_id    AND messages.chat_session_id IS NULL) OR
          (sc.chat_session_id = messages.chat_session_id)
        )
    )
  );

-- 6. Allow Realtime on shared messages ─────────────────────────────────────────
-- Run manually in Supabase dashboard → Database → Replication → enable messages table
-- Or add via SQL:
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
