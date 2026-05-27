-- ── Study Planner ────────────────────────────────────────────────────────
-- Run once in Supabase SQL Editor → Run
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists study_plans (
  id            uuid        primary key default uuid_generate_v4(),
  user_id       uuid        references auth.users(id) on delete cascade not null,
  title         text        not null,
  exam_date     date        not null,
  hours_per_day integer     not null default 2,
  subjects      jsonb       not null default '[]',
  -- schedule: [{week, label, days:[{date,subject,topic,hours,completed}]}]
  schedule      jsonb       not null default '[]',
  created_at    timestamptz not null default now()
);

create index if not exists study_plans_user_idx on study_plans(user_id);

alter table study_plans enable row level security;

create policy "Users manage own study plans"
  on study_plans for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
