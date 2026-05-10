CREATE TABLE IF NOT EXISTS public.user_plans (
  id                        BIGSERIAL   PRIMARY KEY,
  user_id                   UUID        UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                      TEXT        NOT NULL DEFAULT 'free',
  subscription_status       TEXT        NOT NULL DEFAULT 'inactive',
  pro_expires_at            TIMESTAMPTZ,
  grace_until               TIMESTAMPTZ,
  is_trial                  BOOLEAN     NOT NULL DEFAULT FALSE,
  trial_start               TIMESTAMPTZ,
  trial_end                 TIMESTAMPTZ,
  razorpay_subscription_id  TEXT,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
