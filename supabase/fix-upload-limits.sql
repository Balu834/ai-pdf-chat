-- =============================================================================
-- fix-upload-limits.sql
--
-- Run this ENTIRE file in Supabase → SQL Editor to fix the upload system.
-- Safe to re-run: all operations are idempotent.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1 — Backfill: ensure every existing auth user has a user_plans row.
--
-- WHY: the trigger on_auth_user_created only fires for NEW signups. Users who
-- signed up before the trigger was deployed (or if the trigger failed) have no
-- row. When getSubscription() can't find a row it tries to auto-provision, but
-- if that upsert races with a concurrent request it can throw, causing a 500
-- that looks like an upload failure to the user.
--
-- This one-time insert gives everyone a baseline row so the trigger is the
-- only codepath that matters for future signups.
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.user_plans (user_id, plan, subscription_status, updated_at)
select id, 'free', 'inactive', now()
from   auth.users
on conflict (user_id) do nothing;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2 — Clean orphaned + corrupted document rows.
--
-- Rows with user_id IS NULL are left from a bug where storage uploads
-- succeeded but the auth cookie wasn't sent, so the DB insert received no
-- user_id. They block no-one (COUNT(*) WHERE user_id = $1 ignores NULLs)
-- but they waste space and make audit queries confusing.
-- ─────────────────────────────────────────────────────────────────────────────

-- Rows with NULL user_id (unauthenticated ghost uploads)
delete from public.documents where user_id is null;

-- Rows whose user no longer exists in auth.users (deleted accounts)
delete from public.documents d
where not exists (
  select 1 from auth.users u where u.id = d.user_id
);


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3 — Drop every known overload of the old function.
--
-- WHY: PostgREST matches RPCs by name + parameter types. If any old overload
-- with a different signature (e.g. bigint vs int, or 5 params vs 4 params)
-- remains in the schema cache, calls will fail with "could not find function".
-- Dropping first guarantees a clean slate.
-- ─────────────────────────────────────────────────────────────────────────────

drop function if exists public.insert_document_if_under_limit(uuid, text, text, bigint, int);
drop function if exists public.insert_document_if_under_limit(uuid, text, text, int, int);
drop function if exists public.insert_document_if_under_limit(uuid, text, text, int);
drop function if exists public.insert_document_if_under_limit(text, int, text, uuid);
drop function if exists public.insert_document_if_under_limit(text, text, text, uuid);


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4 — New upload gate function.
--
-- Key design changes from the old version:
--   • NO p_limit parameter — plan logic lives here, not in the API layer.
--     The server can never pass the wrong limit for a pro user.
--   • Mirrors the exact three-signal isPro check in lib/subscription.ts:
--       signal 1: subscription_status = 'active'
--       signal 2: pro_expires_at > now()
--       signal 3: grace_until > now()
--     Any one signal grants unlimited uploads.
--   • Auto-provisions a free user_plans row if none exists (belt-and-suspenders
--     on top of the trigger + server-side upsert).
--   • RAISE NOTICE on every branch so Supabase logs show exactly what happened.
--   • Advisory lock per user prevents race-condition double-inserts.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.insert_document_if_under_limit(
  p_user_id   uuid,
  p_file_name text,
  p_file_url  text,
  p_file_size int        -- int safely covers files up to ~2 GB
)
returns uuid
language plpgsql
security definer           -- runs as the function owner, bypasses RLS
set search_path = public   -- prevent search_path injection
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

  -- ── Guard: null user ───────────────────────────────────────────────────────
  if p_user_id is null then
    raise exception 'NULL_USER_ID'
      using hint   = 'p_user_id cannot be null — check that the auth session is valid',
            detail = 'insert_document_if_under_limit received a null p_user_id';
  end if;

  -- ── Per-user advisory lock ─────────────────────────────────────────────────
  -- Two concurrent uploads from the same account both read count=N before
  -- either inserts, so both slip under the limit. The lock serialises them.
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- ── Look up user plan ──────────────────────────────────────────────────────
  select plan, subscription_status, pro_expires_at, grace_until
  into   v_plan, v_status, v_expires, v_grace
  from   public.user_plans
  where  user_id = p_user_id;

  if not found then
    -- No row: trigger should have created one at signup. Auto-provision now
    -- so this upload succeeds and future calls are also covered.
    raise notice '[upload_gate] No user_plans row for % — auto-provisioning free plan', p_user_id;

    insert into public.user_plans (user_id, plan, subscription_status, updated_at)
    values (p_user_id, 'free', 'inactive', now())
    on conflict (user_id) do nothing;

    v_plan   := 'free';
    v_status := 'inactive';
  end if;

  -- ── Determine Pro status (three-signal, identical to lib/subscription.ts) ──
  --   Signal 1: subscription_status = 'active'   (webhook set this, subscription is live)
  --   Signal 2: pro_expires_at > now()            (paid period still running)
  --   Signal 3: grace_until > now()               (payment failed, grace window active)
  v_is_pro := (v_plan = 'pro') and (
    v_status = 'active'
    or (v_expires is not null and v_expires > now())
    or (v_grace   is not null and v_grace   > now())
  );

  v_limit := case when v_is_pro then 100000 else 3 end;

  raise notice '[upload_gate] user=% plan=% status=% expires=% grace=% is_pro=% limit=%',
    p_user_id, v_plan, coalesce(v_status,'null'),
    coalesce(v_expires::text,'null'), coalesce(v_grace::text,'null'),
    v_is_pro, v_limit;

  -- ── Count existing documents ───────────────────────────────────────────────
  select count(*) into v_count
  from   public.documents
  where  user_id = p_user_id;

  raise notice '[upload_gate] user=% doc_count=% limit=%', p_user_id, v_count, v_limit;

  if v_count >= v_limit then
    raise exception 'LIMIT_EXCEEDED'
      using hint   = 'pdf_limit',
            detail = format(
              'user=%s doc_count=%s limit=%s plan=%s subscription_status=%s is_pro=%s',
              p_user_id, v_count, v_limit, v_plan, v_status, v_is_pro
            );
  end if;

  -- ── Insert document ────────────────────────────────────────────────────────
  insert into public.documents (user_id, file_name, file_url, file_size)
  values (p_user_id, p_file_name, p_file_url, p_file_size)
  returning id into v_id;

  raise notice '[upload_gate] SUCCESS doc_id=% user=%', v_id, p_user_id;

  return v_id;

end;
$$;

-- Grant execute to the service role (used by the API)
grant execute on function public.insert_document_if_under_limit(uuid, text, text, int)
  to service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5 — Rebuild the signup trigger (idempotent).
--
-- Ensures every new auth.users row gets a free user_plans row immediately.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_plans (user_id, plan, subscription_status, updated_at)
  values (new.id, 'free', 'inactive', now())
  on conflict (user_id) do nothing;

  raise notice '[handle_new_user] provisioned free plan for new user %', new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 6 — Force PostgREST schema cache reload.
--
-- Without this the new function signature won't be visible for several minutes.
-- ─────────────────────────────────────────────────────────────────────────────

notify pgrst, 'reload schema';


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 7 — Verification + debugging queries.
--
-- Run these individually to inspect the current state.
-- ─────────────────────────────────────────────────────────────────────────────

-- A) Every user's plan + doc count (the key health check)
select
  u.email,
  u.id                                              as user_id,
  coalesce(up.plan, 'NO ROW')                       as plan,
  coalesce(up.subscription_status, '—')             as sub_status,
  up.pro_expires_at,
  up.grace_until,
  count(d.id)                                       as doc_count,
  case
    when up.subscription_status = 'active'                               then 'PRO (active)'
    when up.pro_expires_at is not null and up.pro_expires_at > now()     then 'PRO (period)'
    when up.grace_until    is not null and up.grace_until    > now()     then 'PRO (grace)'
    else                                                                       'FREE'
  end                                               as effective_plan,
  case
    when up.plan = 'pro' and (
      up.subscription_status = 'active'
      or (up.pro_expires_at is not null and up.pro_expires_at > now())
      or (up.grace_until    is not null and up.grace_until    > now())
    ) then 100000
    else 3
  end                                               as upload_limit
from      auth.users       u
left join public.user_plans up on up.user_id = u.id
left join public.documents  d  on d.user_id  = u.id
group by  u.email, u.id, up.plan, up.subscription_status,
          up.pro_expires_at, up.grace_until
order by  u.email;

-- B) NULL user_id documents still remaining (should be 0 after Step 2)
select count(*) as null_user_docs from public.documents where user_id is null;

-- C) Confirm the function exists with the new 4-param signature
select
  p.proname                              as function_name,
  pg_get_function_arguments(p.oid)       as arguments,
  pg_get_function_result(p.oid)          as returns
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'insert_document_if_under_limit';

-- D) Quick check: is the trigger installed on auth.users?
select trigger_name, event_manipulation, action_timing
from information_schema.triggers
where event_object_table = 'users'
  and trigger_name = 'on_auth_user_created';
