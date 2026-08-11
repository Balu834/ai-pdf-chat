-- Migration 013: Fix user_plans.plan CHECK constraint to allow 'team'
--
-- URGENT: The original schema has CHECK (plan IN ('free', 'pro')) which
-- blocks every Team plan purchase at the database level.
--
-- This drops that constraint and replaces it with one that includes 'team'.

DO $$
DECLARE
  constraint_name text;
BEGIN
  -- Find any CHECK constraint on user_plans.plan containing 'free' and 'pro'
  SELECT c.conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE t.relname = 'user_plans'
    AND n.nspname = 'public'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%pro%'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.user_plans DROP CONSTRAINT %I', constraint_name);
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  END IF;
END;
$$;

-- Add updated constraint that includes 'team' and 'premium'
ALTER TABLE public.user_plans
  DROP CONSTRAINT IF EXISTS user_plans_plan_check;

ALTER TABLE public.user_plans
  ADD CONSTRAINT user_plans_plan_check
  CHECK (plan IN ('free', 'pro', 'team', 'premium'));
