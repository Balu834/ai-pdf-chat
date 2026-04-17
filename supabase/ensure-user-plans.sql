-- =============================================================================
-- ensure-user-plans.sql
--
-- Run this in Supabase → SQL Editor to fix missing user_plans rows.
-- Safe to re-run: every statement is idempotent.
--
-- What it fixes:
--   1. Ensures all required columns exist on user_plans
--   2. Adds "trial" to the subscription_status CHECK constraint so startTrial()
--      can write it without a constraint violation
--   3. Installs (or re-installs) the on_auth_user_created trigger so every
--      future signup gets a free-plan row automatically
--   4. Backfills any existing auth users who are missing a user_plans row
--   5. Enables Realtime on user_plans (required for dashboard live sync)
--   6. Forces PostgREST schema cache reload
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1 — Ensure every column exists with correct defaults / constraints.
--
-- ADD COLUMN IF NOT EXISTS is idempotent — safe to run on a table that
-- already has these columns.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.user_plans
  add column if not exists pro_expires_at       timestamptz,
  add column if not exists next_billing_date    timestamptz,
  add column if not exists grace_until          timestamptz,
  add column if not exists is_trial             boolean      not null default false,
  add column if not exists trial_start          timestamptz,
  add column if not exists trial_end            timestamptz,
  add column if not exists razorpay_subscription_id text,
  add column if not exists razorpay_subscription_id text;

-- subscription_status: add the column (no-op if it already exists).
-- We handle the constraint separately below.
alter table public.user_plans
  add column if not exists subscription_status text default 'inactive';

-- subscription_status CHECK constraint.
--
-- WHY: The original constraint did not include "trial", so startTrial()
-- was silently failing with a constraint violation every time it tried
-- to write subscription_status = 'trial'.  We drop the old constraint
-- and recreate it with "trial" included.
--
-- Dropping by name is safe even if the constraint doesn't exist:
-- the DO block suppresses the "does not exist" error.
do $$
begin
  alter table public.user_plans
    drop constraint if exists user_plans_subscription_status_check;
exception when others then null;
end;
$$;

alter table public.user_plans
  add constraint user_plans_subscription_status_check
  check (subscription_status in (
    'active', 'cancelled', 'halted', 'completed', 'expired', 'inactive', 'trial'
  ));


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2 — RLS policies (idempotent).
--
-- user_plans has RLS enabled. Three policies are required:
--   SELECT — user reads their own row (used by fetchPlan / fetchUsage)
--   INSERT — user inserts their own row (fallback if trigger fails)
--   UPDATE — payment webhooks use service-role, but this covers client updates
--
-- Service-role bypasses RLS entirely, so the trigger and all server-side
-- upserts work regardless of these policies.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.user_plans enable row level security;

drop policy if exists "plans_select_own"  on public.user_plans;
create policy "plans_select_own" on public.user_plans
  for select using (auth.uid() = user_id);

drop policy if exists "plans_insert_own"  on public.user_plans;
create policy "plans_insert_own" on public.user_plans
  for insert with check (auth.uid() = user_id);

drop policy if exists "plans_update_own"  on public.user_plans;
create policy "plans_update_own" on public.user_plans
  for update using (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3 — Trigger: auto-provision user_plans on every new signup.
--
-- WHY this is the most important fix:
--   Without this trigger, a user_plans row is only created when the
--   application code runs (auth/callback → startTrial()). If that
--   code fails (network error, env var missing, exception), the user
--   has NO row and every subscription check defaults to free silently.
--
--   The trigger runs inside the same DB transaction as the auth.users
--   INSERT, so it is guaranteed to succeed or fail atomically.
--
-- The trigger creates a minimal free row. startTrial() (in lib/trial.js)
-- then upserts this row to pro+trial immediately after session exchange.
-- ON CONFLICT DO NOTHING means startTrial() upserts always win cleanly.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_plans (
    user_id,
    plan,
    subscription_status,
    is_trial,
    updated_at
  )
  values (
    new.id,
    'free',
    'inactive',
    false,
    now()
  )
  on conflict (user_id) do nothing;

  raise notice '[handle_new_user] provisioned free plan for %', new.id;
  return new;
end;
$$;

-- Drop and recreate the trigger so it always points to the latest function body
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4 — Backfill: give every existing auth user a user_plans row.
--
-- WHY: the trigger only fires for NEW signups. Users who signed up before
-- this trigger was deployed (or if the trigger failed) have no row.
-- ON CONFLICT DO NOTHING means existing rows are untouched.
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.user_plans (user_id, plan, subscription_status, is_trial, updated_at)
select
  id,
  'free',
  'inactive',
  false,
  now()
from auth.users
on conflict (user_id) do nothing;

-- How many rows were created:
select count(*) as total_user_plan_rows from public.user_plans;

-- Verify: any auth users still missing a row (should be 0)
select count(*) as users_without_plan
from auth.users u
where not exists (
  select 1 from public.user_plans up where up.user_id = u.id
);


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5 — Enable Realtime on user_plans.
--
-- Required for the dashboard's live Pro upgrade sync
-- (the useEffect in page.js that listens for postgres_changes on user_plans).
-- ─────────────────────────────────────────────────────────────────────────────

-- Wrap in DO block so it's a no-op if user_plans is already in the publication
do $$
begin
  alter publication supabase_realtime add table public.user_plans;
exception when duplicate_object then
  null; -- already a member, nothing to do
end;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 6 — Force PostgREST schema cache reload.
-- ─────────────────────────────────────────────────────────────────────────────

notify pgrst, 'reload schema';


-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES — run these individually to confirm the fix worked.
-- ─────────────────────────────────────────────────────────────────────────────

-- A) Confirm trigger exists on auth.users
select trigger_name, event_manipulation, action_timing, action_statement
from information_schema.triggers
where event_object_schema = 'auth'
  and event_object_table  = 'users'
  and trigger_name        = 'on_auth_user_created';

-- B) Every user's plan + doc count (the key health check)
select
  u.email,
  u.id                                                     as user_id,
  coalesce(up.plan, 'NO ROW')                              as plan,
  coalesce(up.subscription_status, '—')                   as status,
  up.is_trial,
  up.trial_end,
  up.pro_expires_at,
  count(d.id)                                              as doc_count
from      auth.users        u
left join public.user_plans up on up.user_id = u.id
left join public.documents  d  on d.user_id  = u.id
group by  u.email, u.id, up.plan, up.subscription_status,
          up.is_trial, up.trial_end, up.pro_expires_at
order by  u.email;

-- C) Confirm the subscription_status check constraint now includes "trial"
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.user_plans'::regclass
  and conname  = 'user_plans_subscription_status_check';
