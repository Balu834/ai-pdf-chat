-- ============================================================================
-- FIX-THIS-IN-SUPABASE.sql
--
-- Paste this ENTIRE block into:
--   Supabase Dashboard → SQL Editor → New query → Run
--
-- Safe to run multiple times. Every statement is idempotent.
-- ============================================================================


-- ── 1. TABLES ──────────────────────────────────────────────────────────────

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
  amount       INTEGER     NOT NULL,
  type         TEXT        NOT NULL,
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


-- ── 2. ADD MISSING COLUMNS (safe if columns already exist) ─────────────────

ALTER TABLE public.user_plans
  ADD COLUMN IF NOT EXISTS pro_expires_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS grace_until              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_trial                 BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_start              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_end                TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT;


-- ── 3. FIX subscription_status CHECK CONSTRAINT to include 'trial' ─────────
--
-- If an old constraint exists that excludes 'trial', startTrial() silently
-- fails with a constraint violation every time. Drop and recreate it.

DO $$
BEGIN
  ALTER TABLE public.user_plans
    DROP CONSTRAINT IF EXISTS user_plans_subscription_status_check;
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

ALTER TABLE public.user_plans
  ADD CONSTRAINT user_plans_subscription_status_check
  CHECK (subscription_status IN (
    'active', 'inactive', 'cancelled', 'halted',
    'completed', 'expired', 'past_due', 'trial'
  ));


-- ── 4. TRIGGER FUNCTION ─────────────────────────────────────────────────────
--
-- CREATE OR REPLACE overwrites ANY existing version, including old ones that
-- lacked the EXCEPTION block. The EXCEPTION block is the critical safety net:
-- even if any INSERT fails (table missing, column mismatch, etc.), the
-- function still returns NEW so auth.users INSERT always succeeds.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_plans (user_id, plan, subscription_status, is_trial, updated_at)
  VALUES (NEW.id, 'free', 'inactive', FALSE, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_credits (user_id, balance, lifetime_earned, lifetime_spent, updated_at)
  VALUES (NEW.id, 10, 10, 0, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_stats (user_id, total_questions, total_pdfs, updated_at)
  VALUES (NEW.id, 0, 0, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but NEVER block user creation.
    RAISE WARNING '[handle_new_user] non-fatal error for user=% err=% state=%',
      NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;

END;
$$;


-- ── 5. TRIGGER ──────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ── 6. ROW LEVEL SECURITY ───────────────────────────────────────────────────

ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs          ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- user_plans
DROP POLICY IF EXISTS "user_plans_select_own"  ON public.user_plans;
DROP POLICY IF EXISTS "user_plans_insert_own"  ON public.user_plans;
DROP POLICY IF EXISTS "user_plans_update_own"  ON public.user_plans;
DROP POLICY IF EXISTS "plans_select_own"       ON public.user_plans;
DROP POLICY IF EXISTS "plans_insert_own"       ON public.user_plans;
DROP POLICY IF EXISTS "plans_update_own"       ON public.user_plans;
CREATE POLICY "user_plans_select_own" ON public.user_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_plans_insert_own" ON public.user_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_plans_update_own" ON public.user_plans FOR UPDATE USING (auth.uid() = user_id);

-- user_credits
DROP POLICY IF EXISTS "user_credits_select_own" ON public.user_credits;
CREATE POLICY "user_credits_select_own" ON public.user_credits FOR SELECT USING (auth.uid() = user_id);

-- user_stats
DROP POLICY IF EXISTS "user_stats_select_own" ON public.user_stats;
CREATE POLICY "user_stats_select_own" ON public.user_stats FOR SELECT USING (auth.uid() = user_id);

-- credit_transactions
DROP POLICY IF EXISTS "credit_txns_select_own" ON public.credit_transactions;
CREATE POLICY "credit_txns_select_own" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- usage_logs
DROP POLICY IF EXISTS "usage_logs_select_own" ON public.usage_logs;
CREATE POLICY "usage_logs_select_own" ON public.usage_logs FOR SELECT USING (auth.uid() = user_id);


-- ── 7. BACKFILL existing auth users who have no profile rows ────────────────
--
-- New trigger only fires for NEW signups. Users who signed up before this
-- fix will have missing rows. This backfills them all.

INSERT INTO public.profiles (id, email, full_name, created_at)
SELECT
  u.id,
  COALESCE(u.email, ''),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name',
           split_part(COALESCE(u.email, ''), '@', 1)),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

INSERT INTO public.user_plans (user_id, plan, subscription_status, is_trial, updated_at)
SELECT u.id, 'free', 'inactive', FALSE, NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_plans p WHERE p.user_id = u.id);

INSERT INTO public.user_credits (user_id, balance, lifetime_earned, lifetime_spent, updated_at)
SELECT u.id, 10, 10, 0, NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_credits c WHERE c.user_id = u.id);

INSERT INTO public.user_stats (user_id, total_questions, total_pdfs, updated_at)
SELECT u.id, 0, 0, NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_stats s WHERE s.user_id = u.id);


-- ── 8. VERIFY ───────────────────────────────────────────────────────────────
--
-- After running, both queries should return 1 row each.
-- If either returns 0 rows, re-run this file.

-- Confirm trigger exists on auth.users
SELECT t.tgname AS trigger_name, p.proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'auth' AND c.relname = 'users'
  AND t.tgname = 'on_auth_user_created';

-- Confirm function exists
SELECT routine_name AS function_name
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'handle_new_user';
