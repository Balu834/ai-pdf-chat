-- =============================================================================
-- remove-free-trials.sql
--
-- Run once in Supabase → SQL Editor.
-- Downgrades trial users who NEVER paid to free plan.
--
-- SAFE CONDITION: only targets rows where ALL of:
--   1. is_trial = true                    → was granted via trial system
--   2. razorpay_subscription_id IS NULL   → no recurring subscription
--   3. NOT in payments table              → never made a real payment
--
-- This prevents downgrading legitimate one-time order payers who have
-- razorpay_subscription_id=NULL because they paid via order (not subscription).
-- =============================================================================

-- 1. Preview who will be affected — verify this list before running Step 2
select
  u.email,
  up.plan,
  up.subscription_status,
  up.is_trial,
  up.trial_end,
  up.pro_expires_at,
  up.razorpay_subscription_id,
  (select count(*) from public.payments p where p.user_id = up.user_id) as payment_count
from public.user_plans up
join auth.users u on u.id = up.user_id
where up.is_trial = true
  and up.razorpay_subscription_id is null
  and not exists (
    select 1 from public.payments p where p.user_id = up.user_id
  )
order by up.pro_expires_at desc;


-- 2. Downgrade ONLY non-paying trial users
--    Uncomment this block when ready — the payments check ensures
--    real payers are never touched even if their subscription_id is null.
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
  updated_at           = clock_timestamp()
where is_trial = true
  and razorpay_subscription_id is null
  and not exists (
    select 1 from public.payments p where p.user_id = user_plans.user_id
  );
*/


-- 3. Confirm no unpaid trial users remain (paid-trial users are fine to keep)
select count(*) as unpaid_trial_users_remaining
from public.user_plans up
where up.is_trial = true
  and up.razorpay_subscription_id is null
  and not exists (
    select 1 from public.payments p where p.user_id = up.user_id
  );
