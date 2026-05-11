-- STEP 1 of 2 — Run this first, check for errors, then run step 2
-- Creates tables. If a table already exists it is skipped (safe to re-run).

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_plans (
  id                        BIGSERIAL   PRIMARY KEY,
  user_id                   UUID        UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                      TEXT        NOT NULL DEFAULT 'free',
  subscription_status       TEXT        NOT NULL DEFAULT 'inactive',
  pro_expires_at            TIMESTAMPTZ,
  grace_until               TIMESTAMPTZ,
  is_trial                  BOOLEAN     NOT NULL DEFAULT FALSE,
  trial_start               TIMESTAMPTZ,
  trial_end                 TIMESTAMPTZ,
  razorpay_subscription_id  TEXT,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_credits (
  id               BIGSERIAL   PRIMARY KEY,
  user_id          UUID        UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance          INTEGER     NOT NULL DEFAULT 0,
  lifetime_earned  INTEGER     NOT NULL DEFAULT 0,
  lifetime_spent   INTEGER     NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_questions  INTEGER     NOT NULL DEFAULT 0,
  total_pdfs       INTEGER     NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id           BIGSERIAL   PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL,
  amount       INTEGER     NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- Confirm what was created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
