-- =============================================================================
-- retention-system.sql
-- Run once in Supabase → SQL Editor. Safe to re-run (all idempotent).
--
-- 1. Add phone column to user_plans (optional — only used for WhatsApp)
-- 2. notification_log table — cooldown + audit trail for all messages sent
-- =============================================================================

-- 1. Phone number (optional — user must provide for WhatsApp to work)
alter table public.user_plans
  add column if not exists phone text;           -- e.g. "+919876543210"

-- 2. Email opt-out flag (respect unsubscribes)
alter table public.user_plans
  add column if not exists email_opt_out boolean not null default false;

-- 3. Notification log — one row per message sent
--    Used for: cooldown checks, audit, future analytics (open rate etc.)
create table if not exists public.notification_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  channel     text not null,   -- 'email' | 'whatsapp' | 'push'
  event_type  text not null,   -- e.g. 'inactive_reminder', 'limit_reached'
  sent_at     timestamptz default now(),
  meta        jsonb            -- optional: subject, phone, message_id, etc.
);

create index if not exists notification_log_user_event_idx
  on public.notification_log (user_id, event_type, sent_at desc);

create index if not exists notification_log_sent_at_idx
  on public.notification_log (sent_at desc);

alter table public.notification_log enable row level security;
-- Only service-role writes; users never read this directly

-- 4. Verify
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'user_plans'
  and column_name  in ('phone', 'email_opt_out');

select count(*) as notification_log_rows from public.notification_log;
