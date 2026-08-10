-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 010: Workspace Audit Log
-- Run in Supabase SQL editor after 002_workspaces.sql has been applied
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspace_audit_log (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID        REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  actor_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  action       TEXT        NOT NULL,
  -- Possible values:
  -- 'workspace_created' | 'workspace_rename'
  -- 'member_join' | 'member_remove' | 'role_change'
  -- 'invite_sent' | 'invite_revoked' | 'invite_accepted'
  target_id    UUID,                      -- affected user_id (when applicable)
  meta         JSONB       DEFAULT '{}',  -- e.g. { old_role: 'member', new_role: 'admin' }
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ws_audit_log_workspace
  ON workspace_audit_log(workspace_id, created_at DESC);

ALTER TABLE workspace_audit_log ENABLE ROW LEVEL SECURITY;

-- Workspace members can read their workspace's audit log
DROP POLICY IF EXISTS "Members can read workspace audit log" ON workspace_audit_log;
CREATE POLICY "Members can read workspace audit log" ON workspace_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_audit_log.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- All writes go through the service-role admin client (no client INSERT policy)
