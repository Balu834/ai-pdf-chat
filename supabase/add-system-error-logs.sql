-- =============================================================================
-- add-system-error-logs.sql
--
-- Run once in Supabase → SQL Editor.
-- Safe to re-run: all operations are idempotent.
--
-- Creates system_error_logs — the central error store for lib/logger.js.
-- Also creates auth_error_logs if not already present (older migration).
-- =============================================================================


-- ── system_error_logs ─────────────────────────────────────────────────────────

create table if not exists public.system_error_logs (
  id          bigint        generated always as identity primary key,
  created_at  timestamptz   not null default now(),

  severity    text          not null default 'error'
              check (severity in ('info','warning','error','critical')),

  route       text,
  user_id     uuid          references auth.users(id) on delete set null,
  email       text,
  message     text,
  stack       text,
  metadata    jsonb,
  trace_id    text,
  is_critical boolean       not null default false,
  resolved    boolean       not null default false,
  resolved_at timestamptz,
  resolved_by uuid          references auth.users(id) on delete set null
);

-- Indexes for common queries
create index if not exists sel_created_at
  on public.system_error_logs (created_at desc);

create index if not exists sel_severity
  on public.system_error_logs (severity, created_at desc);

create index if not exists sel_is_critical
  on public.system_error_logs (is_critical, created_at desc)
  where is_critical = true;

create index if not exists sel_user_id
  on public.system_error_logs (user_id, created_at desc)
  where user_id is not null;

create index if not exists sel_route
  on public.system_error_logs (route, created_at desc)
  where route is not null;

create index if not exists sel_unresolved
  on public.system_error_logs (created_at desc)
  where resolved = false;


-- ── auth_error_logs (backward compat — may already exist) ─────────────────────

create table if not exists public.auth_error_logs (
  id          bigint        generated always as identity primary key,
  created_at  timestamptz   not null default now(),
  route       text,
  error_msg   text,
  provider    text,
  user_id     uuid          references auth.users(id) on delete set null,
  email       text,
  ip          text,
  user_agent  text,
  is_critical boolean       not null default false
);

create index if not exists ael_created_at
  on public.auth_error_logs (created_at desc);


-- ── RLS ───────────────────────────────────────────────────────────────────────
-- Service-role (used by all server routes) bypasses RLS automatically.
-- Regular authenticated users must NOT be able to read error logs.

alter table public.system_error_logs enable row level security;
alter table public.auth_error_logs    enable row level security;

-- Block all client access to both tables
drop policy if exists "sel_no_client" on public.system_error_logs;
create policy "sel_no_client"
  on public.system_error_logs for all using (false);

drop policy if exists "ael_no_client" on public.auth_error_logs;
create policy "ael_no_client"
  on public.auth_error_logs for all using (false);


-- ── Force PostgREST schema cache reload ──────────────────────────────────────

notify pgrst, 'reload schema';


-- ── Verification ─────────────────────────────────────────────────────────────

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'system_error_logs'
order by ordinal_position;
