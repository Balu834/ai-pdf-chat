-- Agent Platform: OAuth integrations, job queue with logs, reminders
-- Run in Supabase SQL Editor

-- ── OAuth integrations ────────────────────────────────────────────────────────
create table if not exists integrations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  provider         text not null,
  access_token     text not null,
  refresh_token    text,
  token_expires_at timestamptz,
  scopes           text,
  account_email    text,
  account_name     text,
  provider_uid     text,
  meta             jsonb default '{}',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  unique(user_id, provider)
);

-- ── Background job queue (with per-step tracking and retries) ─────────────────
create table if not exists platform_jobs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  name          text not null,
  type          text not null,
  status        text not null default 'pending',
  priority      int not null default 5,
  steps         jsonb not null default '[]',
  current_step  int not null default 0,
  payload       jsonb not null default '{}',
  result        jsonb,
  error         text,
  retries       int not null default 0,
  max_retries   int not null default 3,
  scheduled_for timestamptz not null default now(),
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz default now()
);

-- ── Job execution logs ─────────────────────────────────────────────────────────
create table if not exists job_logs (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid references platform_jobs(id) on delete cascade not null,
  step       int not null default 0,
  level      text not null default 'info',
  message    text not null,
  data       jsonb,
  created_at timestamptz default now()
);

-- ── Reminders ─────────────────────────────────────────────────────────────────
create table if not exists reminders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  job_id      uuid references platform_jobs(id) on delete set null,
  title       text not null,
  description text,
  remind_at   timestamptz not null,
  recurrence  text,
  status      text not null default 'active',
  created_at  timestamptz default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists idx_integrations_user_provider on integrations(user_id, provider);
create index if not exists idx_platform_jobs_user_status  on platform_jobs(user_id, status);
create index if not exists idx_platform_jobs_queue        on platform_jobs(status, scheduled_for, priority)
  where status in ('pending', 'confirmed');
create index if not exists idx_job_logs_job               on job_logs(job_id, created_at);
create index if not exists idx_reminders_active           on reminders(user_id, remind_at)
  where status = 'active';

-- ── RLS policies ──────────────────────────────────────────────────────────────
alter table integrations   enable row level security;
alter table platform_jobs  enable row level security;
alter table job_logs       enable row level security;
alter table reminders      enable row level security;

create policy "integrations_own"  on integrations  for all using (auth.uid() = user_id);
create policy "platform_jobs_own" on platform_jobs for all using (auth.uid() = user_id);
create policy "job_logs_own"      on job_logs      for select using (
  exists (select 1 from platform_jobs j where j.id = job_id and j.user_id = auth.uid())
);
create policy "reminders_own"     on reminders     for all using (auth.uid() = user_id);
