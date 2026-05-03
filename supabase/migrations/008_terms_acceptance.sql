-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 008: Terms Acceptance
-- Run in Supabase → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Core table ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_terms (
  user_id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Individual acceptance flags — TRUE once accepted, never rolled back
  terms_of_service      BOOLEAN NOT NULL DEFAULT FALSE,
  privacy_policy        BOOLEAN NOT NULL DEFAULT FALSE,
  ai_processing_consent BOOLEAN NOT NULL DEFAULT FALSE,
  content_policy        BOOLEAN NOT NULL DEFAULT FALSE,

  -- Set to NOW() the moment every flag above becomes TRUE
  all_accepted_at       TIMESTAMPTZ,

  created_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_terms_user_id
  ON user_terms(user_id);

CREATE INDEX IF NOT EXISTS idx_user_terms_all_accepted
  ON user_terms(all_accepted_at)
  WHERE all_accepted_at IS NOT NULL;

-- 2. Row-Level Security ────────────────────────────────────────────────────────
ALTER TABLE user_terms ENABLE ROW LEVEL SECURITY;

-- Users can read and update only their own row; inserts come from the API
-- (service-role key bypasses RLS for backend writes)
DROP POLICY IF EXISTS "Users can read own terms"   ON user_terms;
DROP POLICY IF EXISTS "Users can update own terms"  ON user_terms;

CREATE POLICY "Users can read own terms"
  ON user_terms FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update (service role handles inserts)
CREATE POLICY "Users can update own terms"
  ON user_terms FOR UPDATE
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Auto-update updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_user_terms_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_terms_updated_at ON user_terms;
CREATE TRIGGER trg_user_terms_updated_at
  BEFORE UPDATE ON user_terms
  FOR EACH ROW EXECUTE FUNCTION update_user_terms_timestamp();
