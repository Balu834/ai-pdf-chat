-- =============================================================================
-- add-auth-error-logs.sql
--
-- Run once in Supabase → SQL Editor.
-- Safe to re-run: all operations are idempotent.
--
-- Creates the auth_error_logs table used by lib/auth-logger.js.
-- =============================================================================


-- ── Table ────────────────────────────────────────────────────────────────────

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

-- Index for time-range queries (threshold detection, dashboards)
create index if not exists auth_error_logs_created_at_idx
  on public.auth_error_logs (created_at desc);

-- Index for per-provider failure queries
create index if not exists auth_error_logs_provider_idx
  on public.auth_error_logs (provider, created_at desc);


-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Only service-role (used by server-side routes) can write.
-- No client-side reads — these are internal ops logs.

alter table public.auth_error_logs enable row level security;

-- Service-role bypasses RLS entirely, so no explicit INSERT policy needed.
-- Block all anon/authenticated reads and writes:
drop policy if exists "auth_error_logs_no_client_access" on public.auth_error_logs;
create policy "auth_error_logs_no_client_access"
  on public.auth_error_logs
  for all
  using (false);


-- ── Force schema reload ──────────────────────────────────────────────────────

notify pgrst, 'reload schema';


-- ── Verification ─────────────────────────────────────────────────────────────

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'auth_error_logs'
order by ordinal_position;
