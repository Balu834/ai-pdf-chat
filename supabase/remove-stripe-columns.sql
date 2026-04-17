-- =============================================================================
-- remove-stripe-columns.sql
--
-- Run this in Supabase → SQL Editor to remove Stripe columns from user_plans
-- and keep only the Razorpay column.
--
-- Safe to re-run: DROP COLUMN IF EXISTS is idempotent.
-- =============================================================================

-- Drop Stripe columns
alter table public.user_plans
  drop column if exists stripe_customer_id,
  drop column if exists stripe_subscription_id;

-- Ensure razorpay_subscription_id exists (no-op if already present)
alter table public.user_plans
  add column if not exists razorpay_subscription_id text;

-- Force PostgREST schema cache reload
notify pgrst, 'reload schema';

-- Verify: confirm columns after migration
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'user_plans'
order by ordinal_position;
