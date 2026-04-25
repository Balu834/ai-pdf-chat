-- ─── 004_referrals.sql ────────────────────────────────────────────────────────
-- Viral referral system: codes, tracking, fraud prevention, auto-rewards

-- ── Tables ────────────────────────────────────────────────────────────────────

-- One unique referral code per user
CREATE TABLE IF NOT EXISTS user_referrals (
  user_id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code  TEXT UNIQUE NOT NULL,
  total_invites  INTEGER NOT NULL DEFAULT 0,  -- successful signups count
  total_rewards  INTEGER NOT NULL DEFAULT 0,  -- total credits earned from referrals
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Every successful referral event
CREATE TABLE IF NOT EXISTS referrals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_given     BOOLEAN NOT NULL DEFAULT FALSE,
  inviter_credits  INTEGER NOT NULL DEFAULT 0,
  referred_credits INTEGER NOT NULL DEFAULT 0,
  ip_hash          TEXT,    -- SHA-256 of client IP for fraud detection
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id)      -- each account can only be referred once
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_user_referrals_code ON user_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_inviter   ON referrals(inviter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_ip        ON referrals(ip_hash, created_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_referrals_self" ON user_referrals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "referrals_inviter_read" ON referrals
  FOR SELECT USING (auth.uid() = inviter_id);

-- ── Helper: generate a unique, human-readable 8-char referral code ─────────────

CREATE OR REPLACE FUNCTION _gen_ref_code(p_user_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_code   TEXT;
  v_exists BOOLEAN;
  -- Exclude 0/O/1/I to avoid visual confusion
  v_chars  TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
BEGIN
  LOOP
    v_code := '';
    FOR i IN 1..8 LOOP
      v_code := v_code || substr(v_chars, (floor(random() * length(v_chars))::int) + 1, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM user_referrals WHERE referral_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

-- ── Trigger: auto-provision referral code on every new user signup ─────────────

CREATE OR REPLACE FUNCTION _provision_referral_on_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_referrals (user_id, referral_code)
  VALUES (NEW.id, _gen_ref_code(NEW.id))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_referral_code ON auth.users;
CREATE TRIGGER trg_user_referral_code
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION _provision_referral_on_signup();

-- ── RPC: backfill code for existing users who pre-date the trigger ─────────────

CREATE OR REPLACE FUNCTION get_or_create_referral_code(p_user_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_code TEXT;
BEGIN
  SELECT referral_code INTO v_code FROM user_referrals WHERE user_id = p_user_id;
  IF v_code IS NOT NULL THEN RETURN v_code; END IF;

  v_code := _gen_ref_code(p_user_id);
  INSERT INTO user_referrals (user_id, referral_code)
  VALUES (p_user_id, v_code)
  ON CONFLICT (user_id) DO UPDATE SET referral_code = EXCLUDED.referral_code
  RETURNING referral_code INTO v_code;
  RETURN v_code;
END;
$$;

-- ── RPC: claim_referral — atomic, fraud-safe, idempotent ──────────────────────
--
-- Returns JSONB:
--   { ok: true,  inviter_credits: N, referred_credits: N }  — success
--   { ok: false, reason: "invalid_code"|"self_referral"|"already_claimed"|"ip_limit" }

CREATE OR REPLACE FUNCTION claim_referral(
  p_referred_id UUID,
  p_ref_code    TEXT,
  p_ip_hash     TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_inviter_id      UUID;
  v_inviter_credits INTEGER := 50;
  v_referred_credits INTEGER := 20;
  v_ip_count        INTEGER := 0;
  v_inserted        BOOLEAN := FALSE;
BEGIN
  -- 1. Resolve inviter from code (case-insensitive)
  SELECT user_id INTO v_inviter_id
  FROM user_referrals
  WHERE referral_code = upper(trim(p_ref_code));

  IF v_inviter_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_code');
  END IF;

  -- 2. Block self-referral
  IF v_inviter_id = p_referred_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'self_referral');
  END IF;

  -- 3. Already claimed by this user?
  IF EXISTS(SELECT 1 FROM referrals WHERE referred_id = p_referred_id) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed');
  END IF;

  -- 4. IP rate limit: max 5 rewarded referrals from same IP in 24 h
  IF p_ip_hash IS NOT NULL THEN
    SELECT COUNT(*) INTO v_ip_count
    FROM referrals
    WHERE ip_hash    = p_ip_hash
      AND reward_given = TRUE
      AND created_at > NOW() - INTERVAL '24 hours';

    IF v_ip_count >= 5 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'ip_limit');
    END IF;
  END IF;

  -- 5. Atomic insert — unique constraint on referred_id handles race conditions
  BEGIN
    INSERT INTO referrals
      (inviter_id, referred_id, reward_given, inviter_credits, referred_credits, ip_hash)
    VALUES
      (v_inviter_id, p_referred_id, TRUE, v_inviter_credits, v_referred_credits, p_ip_hash);
    v_inserted := TRUE;
  EXCEPTION WHEN unique_violation THEN
    -- Lost the race — already claimed concurrently
    RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed');
  END;

  -- 6. Update inviter aggregate counts
  UPDATE user_referrals
  SET total_invites = total_invites + 1,
      total_rewards = total_rewards + v_inviter_credits
  WHERE user_id = v_inviter_id;

  -- 7. Grant credits to both parties (calls provision_credits from 003_credits.sql)
  PERFORM provision_credits(
    v_inviter_id, v_inviter_credits, 'bonus',
    'Referral reward — a friend joined using your link'
  );
  PERFORM provision_credits(
    p_referred_id, v_referred_credits, 'bonus',
    'Welcome bonus — joined via referral link'
  );

  RETURN jsonb_build_object(
    'ok',              TRUE,
    'inviter_id',      v_inviter_id,
    'inviter_credits', v_inviter_credits,
    'referred_credits', v_referred_credits
  );
END;
$$;
