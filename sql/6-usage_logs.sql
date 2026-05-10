CREATE TABLE IF NOT EXISTS public.usage_logs (
  id                BIGSERIAL      PRIMARY KEY,
  user_id           UUID           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id       UUID,
  session_id        TEXT,
  prompt_tokens     INTEGER        NOT NULL DEFAULT 0,
  completion_tokens INTEGER        NOT NULL DEFAULT 0,
  total_tokens      INTEGER        NOT NULL DEFAULT 0,
  cost_usd          NUMERIC(10,8)  NOT NULL DEFAULT 0,
  credits_used      INTEGER        NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
