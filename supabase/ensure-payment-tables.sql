-- =============================================================================
-- ensure-payment-tables.sql
--
-- Run this in Supabase → SQL Editor.
-- Safe to re-run: all statements are idempotent.
--
-- What it ensures:
--   1. payments table exists with correct columns + constraints
--   2. webhook_events table exists for idempotency
--   3. user_plans has razorpay_subscription_id column (no Stripe columns)
--   4. extend_pro_subscription RPC exists
--   5. RLS policies are correct
--   6. Forces schema cache reload
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1 — payments table
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  payment_id      text not null,
  order_id        text,
  subscription_id text,
  amount          int not null,
  original_amount int not null default 29900,
  currency        text not null default 'INR',
  status          text not null default 'captured',
  coupon_code     text,
  discount_amount int not null default 0,
  created_at      timestamptz default now()
);

-- Ensure unique constraint on payment_id (idempotency key)
do $$
begin
  alter table public.payments add constraint payments_payment_id_key unique (payment_id);
exception when duplicate_table then null;
         when duplicate_object then null;
end;
$$;

create index if not exists payments_user_idx    on public.payments (user_id, created_at desc);
create index if not exists payments_created_idx on public.payments (created_at desc);

alter table public.payments enable row level security;

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments
  for select using (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2 — webhook_events table (idempotency for Razorpay webhook deliveries)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.webhook_events (
  event_id     text primary key,
  event_type   text not null,
  processed_at timestamptz default now()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3 — user_plans: ensure razorpay column, remove stripe columns if present
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.user_plans
  add column if not exists razorpay_subscription_id text;

-- Drop Stripe columns if they still exist (idempotent)
alter table public.user_plans
  drop column if exists stripe_customer_id,
  drop column if exists stripe_subscription_id;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4 — extend_pro_subscription RPC
--
-- Called by webhook subscription.charged to extend pro_expires_at.
-- Also ensures the row is Pro and stores the subscription ID.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.extend_pro_subscription(
  p_user_id      uuid,
  p_next_billing timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_expiry timestamptz;
  v_new_expiry     timestamptz;
begin
  select pro_expires_at into v_current_expiry
  from public.user_plans
  where user_id = p_user_id;

  -- Extend from current expiry (not now) so overlapping renewals don't shorten access
  v_new_expiry := greatest(
    coalesce(v_current_expiry, now()),
    now()
  ) + interval '30 days';

  update public.user_plans
  set
    plan                 = 'pro',
    subscription_status  = 'active',
    is_trial             = false,
    pro_expires_at       = v_new_expiry,
    next_billing_date    = p_next_billing,
    updated_at           = now()
  where user_id = p_user_id;

  if not found then
    -- Row doesn't exist — create it (defensive)
    insert into public.user_plans (user_id, plan, subscription_status, is_trial, pro_expires_at, next_billing_date, updated_at)
    values (p_user_id, 'pro', 'active', false, v_new_expiry, p_next_billing, now());
  end if;
end;
$$;

grant execute on function public.extend_pro_subscription(uuid, timestamptz) to service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5 — increment_coupon_used RPC (called by verify-payment)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.increment_coupon_used(p_coupon_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.coupons
  set used_count = coalesce(used_count, 0) + 1
  where id = p_coupon_id;
end;
$$;

grant execute on function public.increment_coupon_used(uuid) to service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 6 — insert_document_if_under_limit (authoritative upload gate)
--
-- This is the single source of truth for the PDF upload limit.
-- It reads the user's plan directly from user_plans using the same three-signal
-- Pro check as lib/subscription.ts and lib/user-plan.js:
--   1. subscription_status = 'active' OR 'trial'
--   2. pro_expires_at > now()
--   3. grace_until > now()
-- Pro users get limit=100000 (effectively unlimited).
-- Free users get limit=3.
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop all old overloads so PostgREST doesn't get confused by overload ambiguity
drop function if exists public.insert_document_if_under_limit(uuid, text, text, bigint, int);
drop function if exists public.insert_document_if_under_limit(uuid, text, text, int, int);
drop function if exists public.insert_document_if_under_limit(uuid, text, text, int);
drop function if exists public.insert_document_if_under_limit(text, int, text, uuid);
drop function if exists public.insert_document_if_under_limit(text, text, text, uuid);

create or replace function public.insert_document_if_under_limit(
  p_user_id   uuid,
  p_file_name text,
  p_file_url  text,
  p_file_size int
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan    text        := 'free';
  v_status  text        := 'inactive';
  v_expires timestamptz;
  v_grace   timestamptz;
  v_is_pro  boolean     := false;
  v_limit   int;
  v_count   int;
  v_id      uuid;
begin
  if p_user_id is null then
    raise exception 'NULL_USER_ID'
      using hint   = 'p_user_id cannot be null',
            detail = 'insert_document_if_under_limit received a null p_user_id';
  end if;

  -- Per-user advisory lock — prevents race-condition double-inserts
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- Look up the user's plan
  select plan, subscription_status, pro_expires_at, grace_until
  into   v_plan, v_status, v_expires, v_grace
  from   public.user_plans
  where  user_id = p_user_id;

  if not found then
    -- Auto-provision a free row if trigger missed at signup
    insert into public.user_plans (user_id, plan, subscription_status, updated_at)
    values (p_user_id, 'free', 'inactive', now())
    on conflict (user_id) do nothing;
    v_plan   := 'free';
    v_status := 'inactive';
  end if;

  -- Three-signal Pro check:
  --   1. subscription_status is 'active' or 'trial'  (live subscription or active trial)
  --   2. pro_expires_at > now()                       (paid period still running)
  --   3. grace_until > now()                          (payment failed, 3-day grace)
  v_is_pro := (v_plan = 'pro') and (
    v_status in ('active', 'trial')
    or (v_expires is not null and v_expires > now())
    or (v_grace   is not null and v_grace   > now())
  );

  v_limit := case when v_is_pro then 100000 else 3 end;

  raise notice '[upload_gate] user=% plan=% status=% is_pro=% limit=%',
    p_user_id, v_plan, v_status, v_is_pro, v_limit;

  -- Count existing documents
  select count(*) into v_count
  from   public.documents
  where  user_id = p_user_id;

  if v_count >= v_limit then
    raise exception 'LIMIT_EXCEEDED'
      using hint   = 'pdf_limit',
            detail = format(
              'user=%s doc_count=%s limit=%s plan=%s is_pro=%s',
              p_user_id, v_count, v_limit, v_plan, v_is_pro
            );
  end if;

  insert into public.documents (user_id, file_name, file_url, file_size)
  values (p_user_id, p_file_name, p_file_url, p_file_size)
  returning id into v_id;

  raise notice '[upload_gate] SUCCESS doc_id=% user=%', v_id, p_user_id;
  return v_id;
end;
$$;

grant execute on function public.insert_document_if_under_limit(uuid, text, text, int)
  to service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 7 — Force PostgREST schema cache reload
-- ─────────────────────────────────────────────────────────────────────────────

notify pgrst, 'reload schema';


-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES
-- ─────────────────────────────────────────────────────────────────────────────

-- A) Show all users with their current plan
select
  u.email,
  up.plan,
  up.subscription_status,
  up.is_trial,
  up.pro_expires_at,
  up.razorpay_subscription_id is not null as has_razorpay_sub
from auth.users u
left join public.user_plans up on up.user_id = u.id
order by u.created_at desc;

-- B) Recent payments
select user_id, payment_id, amount, status, created_at
from public.payments
order by created_at desc
limit 20;

-- C) Recent webhook events
select event_id, event_type, processed_at
from public.webhook_events
order by processed_at desc
limit 20;
