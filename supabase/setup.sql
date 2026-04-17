-- ─────────────────────────────────────────────
-- 0. Extensions
-- ─────────────────────────────────────────────
create extension if not exists vector;
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- 1. Core tables
-- ─────────────────────────────────────────────

-- documents: one row per uploaded PDF
create table if not exists documents (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  file_name  text not null,
  file_url   text not null,
  file_size  bigint,
  created_at timestamptz default now() not null
);

-- Ensure columns exist even if table was created without them
alter table documents add column if not exists user_id    uuid references auth.users(id) on delete cascade;
alter table documents add column if not exists file_url   text;
alter table documents add column if not exists file_name  text;
alter table documents add column if not exists file_size  bigint;

-- document_chunks: chunked text + embeddings for RAG
create table if not exists document_chunks (
  id          bigint primary key generated always as identity,
  document_id uuid references documents(id) on delete cascade not null,
  content     text not null,
  embedding   vector(1536)
);

create index if not exists document_chunks_embedding_idx
  on document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- question_usage: track daily question count per user
create table if not exists question_usage (
  id         bigint primary key generated always as identity,
  user_id    uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null
);

create index if not exists question_usage_user_created_idx
  on question_usage (user_id, created_at);

-- user_plans: free / pro subscription state
create table if not exists user_plans (
  user_id                    uuid primary key references auth.users(id) on delete cascade,
  plan                       text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id         text unique,
  stripe_subscription_id     text,
  razorpay_subscription_id   text unique,
  updated_at                 timestamptz default now()
);

-- Migration: add razorpay column if table already exists
alter table user_plans add column if not exists razorpay_subscription_id text unique;

-- messages: persisted chat history per document
create table if not exists messages (
  id          uuid primary key default uuid_generate_v4(),
  document_id uuid references documents(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  role        text not null check (role in ('user', 'assistant')),
  message     text not null,
  created_at  timestamptz default now() not null
);

create index if not exists messages_doc_user_idx on messages (document_id, user_id, created_at);

-- insights: AI-generated summary + key points per document (cached)
create table if not exists insights (
  id                  bigint primary key generated always as identity,
  document_id         uuid references documents(id) on delete cascade not null unique,
  summary             text,
  key_points          jsonb default '[]'::jsonb,
  suggested_questions jsonb default '[]'::jsonb,
  created_at          timestamptz default now()
);

create index if not exists insights_document_idx on insights (document_id);

-- jobs: tracks background agent work per document
create table if not exists jobs (
  id          bigint primary key generated always as identity,
  user_id     uuid references auth.users(id) on delete cascade not null,
  document_id uuid references documents(id) on delete cascade not null,
  type        text not null check (type in ('summary', 'extraction', 'insights')),
  status      text not null default 'pending' check (status in ('pending', 'running', 'done', 'failed')),
  result      jsonb,
  created_at  timestamptz default now()
);

create index if not exists jobs_doc_idx on jobs (document_id);
create index if not exists jobs_user_idx on jobs (user_id, created_at desc);

-- ai_jobs: cross-document agent analysis (user-level, not per-document)
create table if not exists ai_jobs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  status      text not null default 'pending' check (status in ('pending', 'running', 'done', 'failed')),
  doc_count   int default 0,
  result      jsonb,
  error       text,
  created_at  timestamptz default now(),
  completed_at timestamptz
);

create index if not exists ai_jobs_user_idx on ai_jobs (user_id, created_at desc);

alter table ai_jobs enable row level security;

drop policy if exists "ai_jobs_select_own" on ai_jobs;
create policy "ai_jobs_select_own" on ai_jobs
  for select using (auth.uid() = user_id);

drop policy if exists "ai_jobs_insert_own" on ai_jobs;
create policy "ai_jobs_insert_own" on ai_jobs
  for insert with check (auth.uid() = user_id);

drop policy if exists "ai_jobs_update_own" on ai_jobs;
create policy "ai_jobs_update_own" on ai_jobs
  for update using (auth.uid() = user_id);

-- ai_insights: periodic scheduled analysis snapshots per user
create table if not exists ai_insights (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  summary     text,
  data        jsonb,                     -- full structured result from GPT
  doc_count   int default 0,
  created_at  timestamptz default now()
);

create index if not exists ai_insights_user_idx on ai_insights (user_id, created_at desc);

-- alerts: in-app notifications created by the cron agent
create table if not exists alerts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  message     text not null,
  type        text not null default 'info' check (type in ('info', 'warning', 'success')),
  read        boolean not null default false,
  created_at  timestamptz default now()
);

create index if not exists alerts_user_unread_idx on alerts (user_id, read, created_at desc);

-- shared_chats: viral share links (anyone can view, read-only)
create table if not exists shared_chats (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  title       text,                          -- optional display title
  is_public   boolean not null default true,
  created_at  timestamptz default now()
);

create index if not exists shared_chats_doc_idx on shared_chats (document_id);
create index if not exists shared_chats_user_idx on shared_chats (user_id);

alter table ai_insights enable row level security;
alter table alerts       enable row level security;

drop policy if exists "ai_insights_select_own" on ai_insights;
create policy "ai_insights_select_own" on ai_insights
  for select using (auth.uid() = user_id);

drop policy if exists "ai_insights_insert_own" on ai_insights;
create policy "ai_insights_insert_own" on ai_insights
  for insert with check (auth.uid() = user_id);

drop policy if exists "alerts_select_own" on alerts;
create policy "alerts_select_own" on alerts
  for select using (auth.uid() = user_id);

drop policy if exists "alerts_insert_own" on alerts;
create policy "alerts_insert_own" on alerts
  for insert with check (auth.uid() = user_id);

drop policy if exists "alerts_update_own" on alerts;
create policy "alerts_update_own" on alerts
  for update using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 2. RLS – Row Level Security
-- ─────────────────────────────────────────────

alter table documents       enable row level security;
alter table messages        enable row level security;

drop policy if exists "messages_select_own" on messages;
create policy "messages_select_own" on messages
  for select using (auth.uid() = user_id);

-- Allow anonymous read of messages that belong to a publicly shared document
drop policy if exists "messages_select_public_share" on messages;
create policy "messages_select_public_share" on messages
  for select using (
    exists (
      select 1 from shared_chats sc
      where sc.document_id = document_id
        and sc.is_public = true
    )
  );

drop policy if exists "messages_insert_own" on messages;
create policy "messages_insert_own" on messages
  for insert with check (auth.uid() = user_id);
alter table document_chunks enable row level security;
alter table question_usage  enable row level security;
alter table user_plans      enable row level security;

-- documents: users see/insert/delete only their own rows
drop policy if exists "documents_select_own" on documents;
create policy "documents_select_own" on documents
  for select using (auth.uid() = user_id);

drop policy if exists "documents_insert_own" on documents;
create policy "documents_insert_own" on documents
  for insert with check (auth.uid() = user_id);

drop policy if exists "documents_delete_own" on documents;
create policy "documents_delete_own" on documents
  for delete using (auth.uid() = user_id);

-- document_chunks: inherit access via parent document
drop policy if exists "chunks_select_own" on document_chunks;
create policy "chunks_select_own" on document_chunks
  for select using (
    exists (
      select 1 from documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

drop policy if exists "chunks_insert_own" on document_chunks;
create policy "chunks_insert_own" on document_chunks
  for insert with check (
    exists (
      select 1 from documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

-- question_usage: own rows only
drop policy if exists "usage_select_own" on question_usage;
create policy "usage_select_own" on question_usage
  for select using (auth.uid() = user_id);

drop policy if exists "usage_insert_own" on question_usage;
create policy "usage_insert_own" on question_usage
  for insert with check (auth.uid() = user_id);

-- insights: inherit access via parent document
alter table insights enable row level security;

drop policy if exists "insights_select_own" on insights;
create policy "insights_select_own" on insights
  for select using (
    exists (select 1 from documents d where d.id = document_id and d.user_id = auth.uid())
  );

drop policy if exists "insights_insert_own" on insights;
create policy "insights_insert_own" on insights
  for insert with check (
    exists (select 1 from documents d where d.id = document_id and d.user_id = auth.uid())
  );

drop policy if exists "insights_update_own" on insights;
create policy "insights_update_own" on insights
  for update using (
    exists (select 1 from documents d where d.id = document_id and d.user_id = auth.uid())
  );

-- user_plans: full CRUD for own row
drop policy if exists "plans_select_own" on user_plans;
create policy "plans_select_own" on user_plans
  for select using (auth.uid() = user_id);

drop policy if exists "plans_insert_own" on user_plans;
create policy "plans_insert_own" on user_plans
  for insert with check (auth.uid() = user_id);

drop policy if exists "plans_update_own" on user_plans;
create policy "plans_update_own" on user_plans
  for update using (auth.uid() = user_id);

-- shared_chats: owner can manage, anyone can read public chats
alter table shared_chats enable row level security;

drop policy if exists "shared_chats_select_public" on shared_chats;
create policy "shared_chats_select_public" on shared_chats
  for select using (is_public = true or auth.uid() = user_id);

drop policy if exists "shared_chats_insert_own" on shared_chats;
create policy "shared_chats_insert_own" on shared_chats
  for insert with check (auth.uid() = user_id);

drop policy if exists "shared_chats_delete_own" on shared_chats;
create policy "shared_chats_delete_own" on shared_chats
  for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 3. Storage bucket + policies
-- Run these manually in Supabase SQL editor:
-- ─────────────────────────────────────────────

-- Create the pdfs bucket (public)
insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', true)
on conflict (id) do update set public = true;

-- Storage RLS: authenticated users can upload to their own folder
drop policy if exists "storage_upload_own" on storage.objects;
create policy "storage_upload_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: authenticated users can read their own files
drop policy if exists "storage_select_own" on storage.objects;
create policy "storage_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: public read for serving PDFs via public URL
drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read" on storage.objects
  for select to anon
  using (bucket_id = 'pdfs');

-- Storage RLS: users can delete their own files
drop policy if exists "storage_delete_own" on storage.objects;
create policy "storage_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─────────────────────────────────────────────
-- 4. RPC: similarity search for RAG
-- ─────────────────────────────────────────────
-- ─────────────────────────────────────────────
-- 5. user_stats: lifetime usage counters
-- ─────────────────────────────────────────────

create table if not exists user_stats (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  total_pdfs       int not null default 0,
  total_questions  int not null default 0,
  updated_at       timestamptz default now()
);

alter table user_stats enable row level security;

drop policy if exists "stats_select_own" on user_stats;
create policy "stats_select_own" on user_stats
  for select using (auth.uid() = user_id);

drop policy if exists "stats_insert_own" on user_stats;
create policy "stats_insert_own" on user_stats
  for insert with check (auth.uid() = user_id);

drop policy if exists "stats_update_own" on user_stats;
create policy "stats_update_own" on user_stats
  for update using (auth.uid() = user_id);

-- Atomic increment for total_questions (called server-side via service role)
create or replace function increment_total_questions(p_user_id uuid)
returns void language sql security definer as $$
  insert into user_stats (user_id, total_pdfs, total_questions, updated_at)
  values (p_user_id, 0, 1, now())
  on conflict (user_id) do update
    set total_questions = user_stats.total_questions + 1,
        updated_at      = now();
$$;

-- Atomic increment for total_pdfs (called server-side via service role)
create or replace function increment_total_pdfs(p_user_id uuid)
returns void language sql security definer as $$
  insert into user_stats (user_id, total_pdfs, total_questions, updated_at)
  values (p_user_id, 1, 0, now())
  on conflict (user_id) do update
    set total_pdfs  = user_stats.total_pdfs + 1,
        updated_at  = now();
$$;

-- ─────────────────────────────────────────────
-- 6. Subscription expiry — add columns to user_plans
--    Run this block in the Supabase SQL editor.
-- ─────────────────────────────────────────────

-- pro_expires_at: when the current Pro period ends (null = no expiry / legacy)
-- next_billing_date: set from the Razorpay webhook payload
alter table user_plans
  add column if not exists pro_expires_at       timestamptz,
  add column if not exists next_billing_date    timestamptz,
  add column if not exists subscription_status  text
    default 'inactive'
    check (subscription_status in ('active', 'cancelled', 'halted', 'completed', 'expired', 'inactive'));

-- ─────────────────────────────────────────────────────────────────────────────
-- webhook_events: idempotency guard — prevents double-processing the same event
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists webhook_events (
  event_id    text primary key,   -- Razorpay event_id (globally unique per event)
  event_type  text not null,
  processed_at timestamptz default now()
);

-- Helper: atomically extend (or set) pro_expires_at by 30 days on renewal.
-- p_next_billing: pass the next charge timestamp from Razorpay webhook (or null).
-- Called by the webhook when subscription.charged fires.
create or replace function extend_pro_subscription(
  p_user_id       uuid,
  p_next_billing  timestamptz default null
)
returns void language sql security definer as $$
  update user_plans
  set
    plan                 = 'pro',
    subscription_status  = 'active',
    -- Extend from current expiry if it's in the future, otherwise from now
    pro_expires_at       = greatest(coalesce(pro_expires_at, now()), now())
                           + interval '30 days',
    next_billing_date    = coalesce(p_next_billing, next_billing_date),
    -- Payment succeeded — clear any grace period from a prior failure
    grace_until          = null,
    updated_at           = now()
  where user_id = p_user_id;
$$;

-- ─────────────────────────────────────────────
-- 7. RPC: similarity search for RAG
-- ─────────────────────────────────────────────

create or replace function match_document_chunks(
  query_embedding    vector(1536),
  match_document_id  uuid,
  match_count        int default 5
)
returns table (
  id          bigint,
  content     text,
  similarity  float
)
language sql stable
as $$
  select
    dc.id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  where dc.document_id = match_document_id
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

-- ─────────────────────────────────────────────
-- 8. Trigger: auto-provision user_plans on signup
--
-- WHY: if user_plans has no row for a user, every subscription
-- check returns DEFAULT_PLAN (free) silently, causing paid users
-- to see "limit reached" immediately after signup.
--
-- This trigger fires AFTER every auth.users INSERT and guarantees
-- every account has a row. The lazy upsert in getUserPlan() is a
-- belt-and-suspenders fallback for users who signed up before this
-- trigger existed.
-- ─────────────────────────────────────────────

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_plans (user_id, plan, subscription_status, updated_at)
  values (new.id, 'free', 'inactive', now())
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- One-time backfill: create free-plan rows for every existing user who has none.
-- Safe to run multiple times (ON CONFLICT DO NOTHING).
insert into public.user_plans (user_id, plan, subscription_status, updated_at)
select id, 'free', 'inactive', now()
from   auth.users
on conflict (user_id) do nothing;

-- ─────────────────────────────────────────────
-- 8a. Enable Realtime on user_plans
--     Required for the dashboard's real-time Pro sync.
--     Run once in Supabase SQL editor.
-- ─────────────────────────────────────────────

alter publication supabase_realtime add table user_plans;

-- ─────────────────────────────────────────────
-- 8b. Grace period column on user_plans
--     Set when a payment fails (subscription.halted / past_due).
--     User stays Pro until grace_until; cron downgrades after.
-- ─────────────────────────────────────────────

alter table user_plans
  add column if not exists grace_until timestamptz;

-- ─────────────────────────────────────────────
-- 8. Free trial columns on user_plans
-- ─────────────────────────────────────────────

alter table user_plans
  add column if not exists is_trial    boolean not null default false,
  add column if not exists trial_start timestamptz,
  add column if not exists trial_end   timestamptz;

-- ─────────────────────────────────────────────
-- 9. Coupons + coupon usage tracking
-- ─────────────────────────────────────────────

create table if not exists coupons (
  id             bigint primary key generated always as identity,
  code           text not null unique,
  discount_type  text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10,2) not null,   -- e.g. 50 = 50% or ₹50
  expiry_date    timestamptz,              -- null = never expires
  usage_limit    int,                      -- null = unlimited
  used_count     int not null default 0,
  active         boolean not null default true,
  created_at     timestamptz default now()
);

-- coupon_uses: one record per user+coupon combination (prevents abuse)
create table if not exists coupon_uses (
  id         bigint primary key generated always as identity,
  coupon_id  bigint references coupons(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  used_at    timestamptz default now(),
  unique (coupon_id, user_id)              -- each user can use a coupon only once
);

create index if not exists coupon_uses_user_idx on coupon_uses (user_id);

alter table coupons     enable row level security;
alter table coupon_uses enable row level security;

-- Admins (service role) manage coupons; users cannot see them
drop policy if exists "coupons_no_public_read" on coupons;
create policy "coupons_no_public_read" on coupons for select using (false);

drop policy if exists "coupon_uses_select_own" on coupon_uses;
create policy "coupon_uses_select_own" on coupon_uses
  for select using (auth.uid() = user_id);

-- Atomically increment coupon used_count (called from verify-payment)
create or replace function increment_coupon_used(p_coupon_id bigint)
returns void language sql security definer as $$
  update coupons set used_count = used_count + 1 where id = p_coupon_id;
$$;

-- ─────────────────────────────────────────────
-- 10. Payments ledger
-- ─────────────────────────────────────────────

create table if not exists payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  payment_id      text not null unique,  -- Razorpay payment_id
  order_id        text,                 -- Razorpay order_id (one-time)
  subscription_id text,                 -- Razorpay subscription_id (recurring)
  amount          int not null,         -- actual charged amount in paise
  original_amount int not null,         -- pre-discount amount in paise
  currency        text not null default 'INR',
  status          text not null default 'captured',
  coupon_code     text,
  discount_amount int not null default 0,
  created_at      timestamptz default now()
);

create index if not exists payments_user_idx    on payments (user_id, created_at desc);
create index if not exists payments_created_idx on payments (created_at desc);

alter table payments enable row level security;

drop policy if exists "payments_select_own" on payments;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. Atomic upload gate
--
-- Atomically checks whether the user is under the free PDF limit and inserts
-- the document row in ONE transaction, preventing the race condition where two
-- simultaneous requests both read count=N and both get allowed past the limit.
--
-- Returns: the new document UUID on success.
-- Raises:  'LIMIT_EXCEEDED' exception when count >= p_limit (→ caller returns 403).
--
-- FIX NOTES (schema-cache error resolution):
--   • Drop old signatures before recreating — avoids PostgREST overload ambiguity.
--   • p_file_size is int (not bigint) — JSON integers from JS map cleanly to int;
--     bigint causes "could not find function" in some PostgREST versions because
--     PostgREST won't auto-coerce a JSON number to bigint without an explicit cast.
--   • NOTIFY at the end forces PostgREST to reload its schema cache immediately
--     without needing a manual restart.
--
-- Run this block in Supabase → SQL Editor to apply the fix.
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop ALL known overloads (old 5-param and 4-param variants) so PostgREST
-- never gets confused by an ambiguous match in the schema cache.
drop function if exists public.insert_document_if_under_limit(uuid, text, text, bigint, int);
drop function if exists public.insert_document_if_under_limit(uuid, text, text, int, int);
drop function if exists public.insert_document_if_under_limit(uuid, text, text, int);
drop function if exists public.insert_document_if_under_limit(text, int, text, uuid);
drop function if exists public.insert_document_if_under_limit(text, text, text, uuid);

-- 4-parameter version — NO p_limit.  The function reads the user's plan from
-- user_plans itself, so the server can never pass the wrong limit.
create or replace function public.insert_document_if_under_limit(
  p_user_id   uuid,
  p_file_name text,
  p_file_url  text,
  p_file_size int        -- int covers files up to ~2 GB
)
returns uuid
language plpgsql
security definer           -- runs as function owner, bypasses RLS
set search_path = public   -- prevent search_path injection
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

  -- Guard: null user
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
    -- Auto-provision a free row (trigger should have done this at signup)
    insert into public.user_plans (user_id, plan, subscription_status, updated_at)
    values (p_user_id, 'free', 'inactive', now())
    on conflict (user_id) do nothing;
    v_plan   := 'free';
    v_status := 'inactive';
  end if;

  -- Three-signal Pro check (mirrors lib/subscription.ts exactly):
  --   1. subscription_status = 'active'
  --   2. pro_expires_at > now()
  --   3. grace_until > now()
  v_is_pro := (v_plan = 'pro') and (
    v_status = 'active'
    or (v_expires is not null and v_expires > now())
    or (v_grace   is not null and v_grace   > now())
  );

  v_limit := case when v_is_pro then 100000 else 3 end;

  raise notice '[upload_gate] user=% plan=% is_pro=% limit=%',
    p_user_id, v_plan, v_is_pro, v_limit;

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

  -- Insert the document
  insert into public.documents (user_id, file_name, file_url, file_size)
  values (p_user_id, p_file_name, p_file_url, p_file_size)
  returning id into v_id;

  raise notice '[upload_gate] SUCCESS doc_id=% user=%', v_id, p_user_id;
  return v_id;

end;
$$;

-- Grant execute to the service role used by the API
grant execute on function public.insert_document_if_under_limit(uuid, text, text, int)
  to service_role;

-- Force PostgREST to reload its schema cache immediately.
-- Without this, the new function won't be visible until the next auto-reload.
notify pgrst, 'reload schema';
create policy "payments_select_own" on payments
  for select using (auth.uid() = user_id);
