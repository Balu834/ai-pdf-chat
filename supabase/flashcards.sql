-- ── Flashcards with SM-2 spaced repetition ──────────────────────────────
-- Run this once in Supabase SQL Editor → Run
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists flashcards (
  id            uuid        primary key default uuid_generate_v4(),
  user_id       uuid        references auth.users(id) on delete cascade not null,
  document_id   uuid        references documents(id) on delete cascade,
  doc_name      text,
  front         text        not null,
  back          text        not null,
  -- SM-2 fields
  next_review   timestamptz not null default now(),
  interval_days integer     not null default 1,
  ease_factor   float       not null default 2.5,
  reps          integer     not null default 0,
  created_at    timestamptz not null default now()
);

-- Index for fetching due cards fast
create index if not exists flashcards_user_review_idx
  on flashcards (user_id, next_review);

create index if not exists flashcards_user_doc_idx
  on flashcards (user_id, document_id);

-- Row-level security
alter table flashcards enable row level security;

create policy "Users can manage their own flashcards"
  on flashcards for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
