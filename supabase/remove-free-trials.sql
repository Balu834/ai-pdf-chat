-- =============================================================================
-- remove-free-trials.sql
--
-- Run once in Supabase → SQL Editor.
-- Downgrades all trial users (who never paid) to free plan.
-- Users who paid and then had is_trial reset to false are NOT affected.
--
-- Safe to re-run — only targets rows where is_trial = true AND no
-- razorpay_subscription_id exists (confirmed non-paying trial users).
-- =============================================================================

-- 1. Preview who will be affected BEFORE you run the update below
select
  u.email,
  up.plan,
  up.subscription_status,
  up.is_trial,
  up.trial_end,
  up.pro_expires_at,
  up.razorpay_subscription_id
from public.user_plans up
join auth.users u on u.id = up.user_id
where up.is_trial = true
  and up.razorpay_subscription_id is null
order by up.pro_expires_at desc;

-- 2. Downgrade trial-only users to free
--    (comment out the SELECT above and uncomment this block when ready)
/*
update public.user_plans
set
  plan                 = 'free',
  is_trial             = false,
  subscription_status  = 'inactive',
  pro_expires_at       = null,
  trial_start          = null,
  trial_end            = null,
  grace_until          = null,
  updated_at           = now()
where is_trial = true
  and razorpay_subscription_id is null;

-- How many rows were downgraded:
select count(*) as downgraded from public.user_plans
where plan = 'free' and is_trial = false and subscription_status = 'inactive';
*/

-- 3. After the migration: confirm no trial users remain
select count(*) as remaining_trial_users
from public.user_plans
where is_trial = true;
