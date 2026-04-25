-- ─── 003_credits.sql ──────────────────────────────────────────────────────────
-- Credits system: user balances, transaction ledger, AI usage logging

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_credits (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance         INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_spent  INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('bonus','purchase','spent','refund')),
  amount      INTEGER NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id       UUID REFERENCES documents(id) ON DELETE SET NULL,
  session_id        UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  prompt_tokens     INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens      INTEGER NOT NULL DEFAULT 0,
  cost_usd          NUMERIC(12, 8) NOT NULL DEFAULT 0,
  credits_used      INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_credit_txn_user   ON credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user   ON usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_date   ON usage_logs(created_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE user_credits       ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_credits_self"    ON user_credits       FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "credit_txn_self_read" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usage_logs_self_read" ON usage_logs         FOR SELECT USING (auth.uid() = user_id);

-- ── RPC: provision/top-up credits (upsert + log transaction) ─────────────────

CREATE OR REPLACE FUNCTION provision_credits(
  p_user_id    UUID,
  p_amount     INTEGER,
  p_type       TEXT,
  p_description TEXT
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_credits (user_id, balance, lifetime_earned, updated_at)
  VALUES (p_user_id, p_amount, p_amount, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET balance         = user_credits.balance + p_amount,
        lifetime_earned = user_credits.lifetime_earned + p_amount,
        updated_at      = NOW();

  INSERT INTO credit_transactions (user_id, type, amount, description)
  VALUES (p_user_id, p_type, p_amount, p_description);
END;
$$;

-- ── RPC: deduct 1 credit — returns TRUE if deducted, FALSE if insufficient ────

CREATE OR REPLACE FUNCTION deduct_one_credit(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT balance INTO v_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE user_credits
  SET balance        = balance - 1,
      lifetime_spent = lifetime_spent + 1,
      updated_at     = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'spent', 1, 'AI question');

  RETURN TRUE;
END;
$$;
