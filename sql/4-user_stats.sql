CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_questions  INTEGER     NOT NULL DEFAULT 0,
  total_pdfs       INTEGER     NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
