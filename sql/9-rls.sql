ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs          ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own"      ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"      ON public.profiles;
DROP POLICY IF EXISTS "user_plans_select_own"    ON public.user_plans;
DROP POLICY IF EXISTS "user_credits_select_own"  ON public.user_credits;
DROP POLICY IF EXISTS "user_stats_select_own"    ON public.user_stats;
DROP POLICY IF EXISTS "credit_txns_select_own"   ON public.credit_transactions;
DROP POLICY IF EXISTS "usage_logs_select_own"    ON public.usage_logs;

CREATE POLICY "profiles_select_own"     ON public.profiles            FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"     ON public.profiles            FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "user_plans_select_own"   ON public.user_plans          FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_credits_select_own" ON public.user_credits        FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_stats_select_own"   ON public.user_stats          FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "credit_txns_select_own"  ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usage_logs_select_own"   ON public.usage_logs          FOR SELECT USING (auth.uid() = user_id);
