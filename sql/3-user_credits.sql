CREATE TABLE IF NOT EXISTS public.user_credits (
  id               BIGSERIAL   PRIMARY KEY,
  user_id          UUID        UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance          INTEGER     NOT NULL DEFAULT 0,
  lifetime_earned  INTEGER     NOT NULL DEFAULT 0,
  lifetime_spent   INTEGER     NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
