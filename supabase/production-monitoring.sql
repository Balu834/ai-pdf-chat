-- =============================================================================
-- production-monitoring.sql
--
-- Complete production error monitoring schema for Intellixy.
-- Run once in Supabase → SQL Editor. All operations are idempotent.
--
-- Tables created:
--   production_error_logs       — every captured error, with full context
--   production_error_rate_limits — per-route/message error frequency tracking
--
-- Also creates:
--   increment_error_rate_limit() — atomic counter increment with window reset
-- =============================================================================


-- ── production_error_logs ─────────────────────────────────────────────────────

create table if not exists public.production_error_logs (
  id           bigint       generated always as identity primary key,
  created_at   timestamptz  not null default now(),

  -- Severity: check constraint keeps data clean
  severity     text         not null default 'error'
               check (severity in ('info', 'warning', 'error', 'critical')),

  -- Request tracing
  trace_id     text,
  environment  text         not null default 'production',

  -- Error details
  route        text,
  message      text,
  stack        text,

  -- User context
  user_id      uuid         references auth.users(id) on delete set null,
  email        text,
  ip           text,
  user_agent   text,
  provider     text,         -- e.g. "google", "email", "razorpay", "meta_ads"

  -- Flexible extra data (request headers, metadata, etc.)
  metadata     jsonb,

  -- Escalation state
  is_escalated boolean      not null default false,

  -- Resolution tracking (for ops dashboards)
  resolved     boolean      not null default false,
  resolved_at  timestamptz,
  resolved_by  uuid         references auth.users(id) on delete set null
);

-- Core time-range query (most common: "show errors from last 24h")
create index if not exists pel_created_at
  on public.production_error_logs (created_at desc);

-- Severity filter (e.g. "show all critical errors")
create index if not exists pel_severity
  on public.production_error_logs (severity, created_at desc);

-- Critical escalation view
create index if not exists pel_escalated
  on public.production_error_logs (is_escalated, created_at desc)
  where is_escalated = true;

-- Per-user error history
create index if not exists pel_user_id
  on public.production_error_logs (user_id, created_at desc)
  where user_id is not null;

-- Per-route error trends
create index if not exists pel_route
  on public.production_error_logs (route, created_at desc)
  where route is not null;

-- Unresolved errors dashboard
create index if not exists pel_unresolved
  on public.production_error_logs (created_at desc)
  where resolved = false;

-- Trace ID lookup (for correlated log drilling)
create index if not exists pel_trace_id
  on public.production_error_logs (trace_id)
  where trace_id is not null;


-- ── production_error_rate_limits ─────────────────────────────────────────────

create table if not exists public.production_error_rate_limits (
  id           bigint       generated always as identity primary key,
  created_at   timestamptz  not null default now(),
  updated_at   timestamptz  not null default now(),

  -- Unique key: hash of route + first 80 chars of message
  error_key    text         not null unique,
  route        text,

  -- Sliding window counter
  count        integer      not null default 1,
  window_start timestamptz  not null default now(),
  last_seen_at timestamptz  not null default now(),

  -- Whether this key has been escalated to CRITICAL
  is_escalated boolean      not null default false
);

create index if not exists perl_error_key
  on public.production_error_rate_limits (error_key);

create index if not exists perl_route
  on public.production_error_rate_limits (route)
  where route is not null;

create index if not exists perl_last_seen
  on public.production_error_rate_limits (last_seen_at desc);


-- ── increment_error_rate_limit() ─────────────────────────────────────────────
-- Atomically increments the counter for an error_key.
-- If the current window is older than 10 minutes, resets it.
-- Called by lib/logger/log-system-error.ts (non-blocking, fire-and-forget).

create or replace function public.increment_error_rate_limit(
  p_error_key   text,
  p_route       text,
  p_is_escalated boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.production_error_rate_limits
    (error_key, route, count, window_start, last_seen_at, is_escalated, updated_at)
  values
    (p_error_key, p_route, 1, now(), now(), p_is_escalated, now())
  on conflict (error_key) do update set
    count = case
      -- Reset window if the last window started more than 10 minutes ago
      when production_error_rate_limits.window_start < now() - interval '10 minutes'
        then 1
      else production_error_rate_limits.count + 1
    end,
    window_start = case
      when production_error_rate_limits.window_start < now() - interval '10 minutes'
        then now()
      else production_error_rate_limits.window_start
    end,
    last_seen_at  = now(),
    is_escalated  = p_is_escalated,
    updated_at    = now();
end;
$$;

grant execute on function public.increment_error_rate_limit(text, text, boolean)
  to service_role;


-- ── RLS ───────────────────────────────────────────────────────────────────────
-- Service-role (all server-side routes) bypasses RLS automatically.
-- Block all direct client access — logs are internal ops data only.

alter table public.production_error_logs       enable row level security;
alter table public.production_error_rate_limits enable row level security;

drop policy if exists "pel_no_client"  on public.production_error_logs;
create policy "pel_no_client"
  on public.production_error_logs for all using (false);

drop policy if exists "perl_no_client" on public.production_error_rate_limits;
create policy "perl_no_client"
  on public.production_error_rate_limits for all using (false);


-- ── Retention cleanup (run via cron or manually) ─────────────────────────────
-- Keeps 90 days of logs. Call manually or schedule:
--   delete from public.production_error_logs
--   where created_at < now() - interval '90 days';

comment on table public.production_error_logs is
  'Production error log. Retention: 90 days. Service-role write only.';

comment on table public.production_error_rate_limits is
  'Per-error-key sliding window counter for escalation detection.';


-- ── Schema reload ─────────────────────────────────────────────────────────────

notify pgrst, 'reload schema';


-- ── Verification ─────────────────────────────────────────────────────────────

select
  table_name,
  (select count(*) from information_schema.columns c
   where c.table_schema = t.table_schema and c.table_name = t.table_name) as column_count
from information_schema.tables t
where table_schema = 'public'
  and table_name in ('production_error_logs', 'production_error_rate_limits')
order by table_name;
