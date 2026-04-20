-- push_subscriptions table — stores Web Push endpoint + keys per user per device
create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  endpoint     text not null,
  p256dh       text not null,   -- browser public key
  auth         text not null,   -- auth secret
  created_at   timestamptz default now(),
  last_used_at timestamptz default now(),
  constraint push_subscriptions_endpoint_key unique (endpoint)
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- Users can only read/delete their own subscriptions
drop policy if exists "push_select_own" on public.push_subscriptions;
create policy "push_select_own" on public.push_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "push_delete_own" on public.push_subscriptions;
create policy "push_delete_own" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- Inserts always go through service-role (API route) — no RLS needed for insert
