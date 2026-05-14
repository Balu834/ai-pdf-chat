-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: ensure insert_document_if_under_limit has exactly 4 params
--
-- Run this in the Supabase SQL editor if you get:
--   "Could not find the function public.insert_document_if_under_limit(...)"
--
-- Root cause: a previous version of upload/route.js called the function with
-- a 5th argument (p_limit) that does not exist in the DB schema.  PostgREST
-- cannot resolve the overload → "function not found" 503/500 errors.
--
-- This migration drops every stale overload and recreates the canonical 4-param
-- version.  It is idempotent (safe to run multiple times).
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop all known overloads (stale signatures from prior deployments)
drop function if exists public.insert_document_if_under_limit(uuid, text, text, bigint, int);
drop function if exists public.insert_document_if_under_limit(uuid, text, text, int,    int);
drop function if exists public.insert_document_if_under_limit(uuid, text, text, bigint);
drop function if exists public.insert_document_if_under_limit(uuid, text, text, int);
drop function if exists public.insert_document_if_under_limit(text, int,  text, uuid);
drop function if exists public.insert_document_if_under_limit(text, text, text, uuid);

-- ─────────────────────────────────────────────────────────────────────────────
-- Canonical 4-parameter version
-- p_limit intentionally absent — the function reads the plan from user_plans
-- so the application layer can never pass a wrong limit value.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.insert_document_if_under_limit(
  p_user_id   uuid,
  p_file_name text,
  p_file_url  text,
  p_file_size int        -- int4 covers files up to ~2 GB
)
returns uuid
language plpgsql
security definer
set search_path = public
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

  -- Per-user advisory lock to prevent race-condition double-inserts
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- Look up the user's plan
  select plan, subscription_status, pro_expires_at, grace_until
  into   v_plan, v_status, v_expires, v_grace
  from   public.user_plans
  where  user_id = p_user_id;

  if not found then
    insert into public.user_plans (user_id, plan, subscription_status, updated_at)
    values (p_user_id, 'free', 'inactive', now())
    on conflict (user_id) do nothing;
    v_plan   := 'free';
    v_status := 'inactive';
  end if;

  -- Pro check (three signals, mirrors lib/subscription.ts)
  v_is_pro := (v_plan = 'pro') and (
    v_status = 'active'
    or (v_expires is not null and v_expires > now())
    or (v_grace  is not null and v_grace  > now())
  );

  -- Determine limit
  v_limit := case when v_is_pro then 2147483647 else 3 end;

  -- Count existing documents
  select count(*) into v_count
  from   public.documents
  where  user_id = p_user_id;

  if v_count >= v_limit then
    raise exception 'LIMIT_EXCEEDED'
      using hint   = 'User has reached their document upload limit',
            detail = format('user=%s plan=%s count=%s limit=%s', p_user_id, v_plan, v_count, v_limit);
  end if;

  -- Insert the document record
  insert into public.documents (user_id, file_name, file_url, file_size, created_at)
  values (p_user_id, p_file_name, p_file_url, p_file_size, now())
  returning id into v_id;

  return v_id;
end;
$$;

-- Grant execute to authenticated and service roles
grant execute on function public.insert_document_if_under_limit(uuid, text, text, int)
  to authenticated, service_role;

-- Force PostgREST to reload its schema cache
notify pgrst, 'reload schema';
