-- ─── 006_marketplace.sql ──────────────────────────────────────────────────────
-- AI Agent Marketplace + Workflow Template Store + Creator Economy

-- ── Extend existing tables ────────────────────────────────────────────────────
-- Track marketplace origin so we can detect "already installed"
ALTER TABLE agents    ADD COLUMN IF NOT EXISTS source_marketplace_agent_id    UUID;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS source_marketplace_template_id UUID;

-- ── Creator Profiles ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS creator_profiles (
  user_id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name         TEXT NOT NULL DEFAULT '',
  bio                  TEXT NOT NULL DEFAULT '',
  total_earnings_paise BIGINT NOT NULL DEFAULT 0,
  pending_payout_paise BIGINT NOT NULL DEFAULT 0,
  paid_out_paise       BIGINT NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── Marketplace Agents ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marketplace_agents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL DEFAULT 'Productivity'
                    CHECK (category IN ('Productivity','Finance','Legal','Education','Other')),
  role            TEXT NOT NULL DEFAULT 'General Assistant',
  instructions    TEXT NOT NULL DEFAULT '',
  tools           TEXT[] NOT NULL DEFAULT '{}',
  is_published    BOOLEAN NOT NULL DEFAULT TRUE,
  install_count   INTEGER NOT NULL DEFAULT 0,
  avg_rating      NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count    INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Marketplace Templates ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marketplace_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL DEFAULT 'Productivity'
                    CHECK (category IN ('Productivity','Finance','Legal','Education','Other')),
  template_type   TEXT NOT NULL DEFAULT 'custom'
                    CHECK (template_type IN ('pdf_summarizer','invoice_extractor','contract_checker','custom')),
  steps           JSONB NOT NULL DEFAULT '[]',
  price_paise     INTEGER NOT NULL DEFAULT 0,  -- 0 = free
  is_published    BOOLEAN NOT NULL DEFAULT TRUE,
  install_count   INTEGER NOT NULL DEFAULT 0,
  avg_rating      NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count    INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Template Purchases ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS template_purchases (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id          UUID NOT NULL REFERENCES marketplace_templates(id) ON DELETE CASCADE,
  razorpay_order_id    TEXT,
  razorpay_payment_id  TEXT UNIQUE,
  amount_paise         INTEGER NOT NULL DEFAULT 0,
  platform_fee_paise   INTEGER NOT NULL DEFAULT 0,
  creator_paise        INTEGER NOT NULL DEFAULT 0,
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','completed','failed')),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);

-- ── Reviews (shared for agents + templates) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('agent','template')),
  target_id   UUID NOT NULL,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_mkt_agents_published  ON marketplace_agents(install_count DESC, created_at DESC) WHERE is_published;
CREATE INDEX IF NOT EXISTS idx_mkt_agents_category   ON marketplace_agents(category, created_at DESC)           WHERE is_published;
CREATE INDEX IF NOT EXISTS idx_mkt_agents_rating     ON marketplace_agents(avg_rating DESC)                     WHERE is_published;
CREATE INDEX IF NOT EXISTS idx_mkt_agents_creator    ON marketplace_agents(creator_id);

CREATE INDEX IF NOT EXISTS idx_mkt_tmpl_published    ON marketplace_templates(install_count DESC, created_at DESC) WHERE is_published;
CREATE INDEX IF NOT EXISTS idx_mkt_tmpl_category     ON marketplace_templates(category, created_at DESC)           WHERE is_published;
CREATE INDEX IF NOT EXISTS idx_mkt_tmpl_rating       ON marketplace_templates(avg_rating DESC)                     WHERE is_published;
CREATE INDEX IF NOT EXISTS idx_mkt_tmpl_price        ON marketplace_templates(price_paise)                        WHERE is_published;
CREATE INDEX IF NOT EXISTS idx_mkt_tmpl_creator      ON marketplace_templates(creator_id);

CREATE INDEX IF NOT EXISTS idx_purchases_user        ON template_purchases(user_id, template_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status      ON template_purchases(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_target        ON marketplace_reviews(target_type, target_id, created_at DESC);

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE marketplace_agents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_purchases    ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews   ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles      ENABLE ROW LEVEL SECURITY;

-- Published items visible to all; creators can manage their own
CREATE POLICY "mkt_agents_read"     ON marketplace_agents    FOR SELECT USING (is_published = TRUE OR creator_id = auth.uid());
CREATE POLICY "mkt_agents_own"      ON marketplace_agents    FOR ALL    USING (creator_id = auth.uid());

CREATE POLICY "mkt_templates_read"  ON marketplace_templates FOR SELECT USING (is_published = TRUE OR creator_id = auth.uid());
CREATE POLICY "mkt_templates_own"   ON marketplace_templates FOR ALL    USING (creator_id = auth.uid());

-- Users see only their own purchases
CREATE POLICY "purchases_self"      ON template_purchases    FOR ALL    USING (auth.uid() = user_id);

-- Reviews: anyone can read, only author can write
CREATE POLICY "reviews_read"        ON marketplace_reviews   FOR SELECT USING (TRUE);
CREATE POLICY "reviews_own"         ON marketplace_reviews   FOR ALL    USING (auth.uid() = user_id);

-- Creator profile: owner only
CREATE POLICY "creator_profile_own" ON creator_profiles      FOR ALL    USING (auth.uid() = user_id);

-- ── Trigger: keep avg_rating + review_count in sync ──────────────────────────

CREATE OR REPLACE FUNCTION _update_rating_cache()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_target_type TEXT := COALESCE(NEW.target_type, OLD.target_type);
  v_target_id   UUID := COALESCE(NEW.target_id,   OLD.target_id);
  v_avg         NUMERIC(3,2);
  v_cnt         INTEGER;
BEGIN
  SELECT COALESCE(AVG(rating)::NUMERIC(3,2), 0), COUNT(*)::INTEGER
    INTO v_avg, v_cnt
    FROM marketplace_reviews
   WHERE target_type = v_target_type AND target_id = v_target_id;

  IF v_target_type = 'agent' THEN
    UPDATE marketplace_agents
       SET avg_rating = v_avg, review_count = v_cnt, updated_at = NOW()
     WHERE id = v_target_id;
  ELSE
    UPDATE marketplace_templates
       SET avg_rating = v_avg, review_count = v_cnt, updated_at = NOW()
     WHERE id = v_target_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_rating_cache
  AFTER INSERT OR UPDATE OR DELETE ON marketplace_reviews
  FOR EACH ROW EXECUTE FUNCTION _update_rating_cache();

-- ── RPC: add creator earnings atomically ─────────────────────────────────────

CREATE OR REPLACE FUNCTION add_creator_earnings(p_creator_id UUID, p_amount_paise BIGINT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO creator_profiles (user_id, total_earnings_paise, pending_payout_paise)
    VALUES (p_creator_id, p_amount_paise, p_amount_paise)
  ON CONFLICT (user_id) DO UPDATE
    SET total_earnings_paise = creator_profiles.total_earnings_paise + p_amount_paise,
        pending_payout_paise = creator_profiles.pending_payout_paise + p_amount_paise,
        updated_at           = NOW();
END;
$$;

-- ── RPC: atomic install increment ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_install_count(p_type TEXT, p_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_type = 'agent' THEN
    UPDATE marketplace_agents SET install_count = install_count + 1, updated_at = NOW() WHERE id = p_id;
  ELSE
    UPDATE marketplace_templates SET install_count = install_count + 1, updated_at = NOW() WHERE id = p_id;
  END IF;
END;
$$;
