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
