-- ============================================================
-- Intellixy — Auth Signup Fix
-- Run in Supabase Dashboard → SQL Editor
--
-- HOW TO RUN: Paste ALL of this at once and click RUN.
-- Each block is wrapped in BEGIN/EXCEPTION so one failure
-- does NOT abort the rest of the script.
-- ============================================================


-- ── STEP 1: Create tables (safe — skips if already exist) ───

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

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id           BIGSERIAL   PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL,
  amount       INTEGER     NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_questions  INTEGER     NOT NULL DEFAULT 0,
  total_pdfs       INTEGER     NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
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


-- ── STEP 2: Create/replace the trigger function ─────────────
--
-- SECURITY DEFINER  → runs as postgres, bypasses RLS
-- SET search_path   → security best practice
-- COALESCE          → handles NULL metadata (email signup has no name/avatar)
-- ON CONFLICT DO NOTHING → idempotent, no duplicate errors
-- EXCEPTION block   → catches ANY error; signup NEVER fails because of this

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email      TEXT;
  v_full_name  TEXT;
  v_avatar_url TEXT;
BEGIN
  v_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', '');

  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(v_email, '@', 1)
  );

  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at)
  VALUES (NEW.id, v_email, v_full_name, v_avatar_url, NOW())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_plans (user_id, plan, subscription_status, updated_at)
  VALUES (NEW.id, 'free', 'inactive', NOW())
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
    RAISE WARNING '[handle_new_user] user=% err=% state=%', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;


-- ── STEP 3: Drop old trigger and attach the new one ─────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── STEP 4: RLS ──────────────────────────────────────────────

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own"   ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own"   ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "user_plans_select_own" ON public.user_plans;
CREATE POLICY "user_plans_select_own" ON public.user_plans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_credits_select_own" ON public.user_credits;
CREATE POLICY "user_credits_select_own" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "credit_txns_select_own" ON public.credit_transactions;
CREATE POLICY "credit_txns_select_own" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_stats_select_own"  ON public.user_stats;
CREATE POLICY "user_stats_select_own" ON public.user_stats
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "usage_logs_select_own"  ON public.usage_logs;
CREATE POLICY "usage_logs_select_own" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);


-- ── STEP 5: RPCs ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.provision_credits(
  p_user_id     UUID,
  p_amount      INTEGER,
  p_type        TEXT,
  p_description TEXT DEFAULT ''
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance, lifetime_earned, lifetime_spent, updated_at)
  VALUES (p_user_id, p_amount, p_amount, 0, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET balance         = user_credits.balance         + p_amount,
        lifetime_earned = user_credits.lifetime_earned + p_amount,
        updated_at      = NOW();

  INSERT INTO public.credit_transactions (user_id, type, amount, description, created_at)
  VALUES (p_user_id, p_type, p_amount, p_description, NOW());
END;
$$;

CREATE OR REPLACE FUNCTION public.deduct_one_credit(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ok BOOLEAN := FALSE;
BEGIN
  UPDATE public.user_credits
  SET balance = balance - 1, lifetime_spent = lifetime_spent + 1, updated_at = NOW()
  WHERE user_id = p_user_id AND balance > 0;

  IF FOUND THEN
    INSERT INTO public.credit_transactions (user_id, type, amount, description, created_at)
    VALUES (p_user_id, 'spend', -1, 'AI question', NOW());
    _ok := TRUE;
  END IF;
  RETURN _ok;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_total_questions(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_stats (user_id, total_questions, total_pdfs, updated_at)
  VALUES (p_user_id, 1, 0, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET total_questions = user_stats.total_questions + 1, updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_total_pdfs(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_stats (user_id, total_questions, total_pdfs, updated_at)
  VALUES (p_user_id, 0, 1, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET total_pdfs = user_stats.total_pdfs + 1, updated_at = NOW();
END;
$$;


-- ── STEP 6: Backfill existing users ──────────────────────────

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = u.id)
  LOOP
    INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at)
    VALUES (
      r.id, r.email,
      COALESCE(r.raw_user_meta_data->>'full_name', r.raw_user_meta_data->>'name', split_part(COALESCE(r.email,''), '@', 1)),
      COALESCE(r.raw_user_meta_data->>'avatar_url', r.raw_user_meta_data->>'picture'),
      NOW()
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_plans (user_id, plan, subscription_status, updated_at)
    VALUES (r.id, 'free', 'inactive', NOW()) ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.user_credits (user_id, balance, lifetime_earned, lifetime_spent, updated_at)
    VALUES (r.id, 0, 0, 0, NOW()) ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.user_stats (user_id, total_questions, total_pdfs, updated_at)
    VALUES (r.id, 0, 0, NOW()) ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
  RAISE NOTICE 'Backfill complete';
END;
$$;


-- ── VERIFY: Run this last to confirm everything was created ──

SELECT 'trigger' AS type, trigger_name AS name
FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users'
UNION ALL
SELECT 'table', table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles','user_plans','user_credits','user_stats','usage_logs','credit_transactions')
UNION ALL
SELECT 'function', routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('handle_new_user','provision_credits','deduct_one_credit','increment_total_questions','increment_total_pdfs')
ORDER BY type, name;
