-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 011: Team plan support
--
-- Fixes extend_pro_subscription so subscription renewals preserve the
-- subscriber's actual plan tier instead of hardcoding 'pro'.
--
-- BUG FIXED: the previous function hardcoded `plan = 'pro'` on every renewal,
-- which would silently downgrade Team subscribers back to Pro after 30 days.
--
-- Run in Supabase SQL editor after 002_workspaces.sql is applied.
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop the old 2-arg overload first.
-- Without this, CREATE OR REPLACE creates a new overload (since arg types differ)
-- instead of replacing the existing one, leaving the buggy hardcoded version callable.
DROP FUNCTION IF EXISTS public.extend_pro_subscription(uuid, timestamptz);

CREATE OR REPLACE FUNCTION public.extend_pro_subscription(
  p_user_id      uuid,
  p_next_billing timestamptz DEFAULT NULL,
  p_plan         text        DEFAULT 'pro'  -- 'pro' | 'team'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_expiry timestamptz;
  v_new_expiry     timestamptz;
BEGIN
  SELECT pro_expires_at INTO v_current_expiry
  FROM public.user_plans
  WHERE user_id = p_user_id;

  -- Extend from current expiry (not now) so overlapping renewals don't shorten access
  v_new_expiry := GREATEST(
    COALESCE(v_current_expiry, NOW()),
    NOW()
  ) + INTERVAL '30 days';

  UPDATE public.user_plans
  SET
    plan                = p_plan,
    subscription_status = 'active',
    is_trial            = false,
    pro_expires_at      = v_new_expiry,
    next_billing_date   = p_next_billing,
    updated_at          = NOW()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    -- Row doesn't exist — insert defensively
    INSERT INTO public.user_plans
      (user_id, plan, subscription_status, is_trial, pro_expires_at, next_billing_date, updated_at)
    VALUES
      (p_user_id, p_plan, 'active', false, v_new_expiry, p_next_billing, NOW());
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.extend_pro_subscription(uuid, timestamptz, text) TO service_role;
