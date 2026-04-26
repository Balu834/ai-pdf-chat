-- ─── 007_appstore.sql ─────────────────────────────────────────────────────────
-- App Store: ranking, FTS, favorites, usage logs, recommendations

-- ── Extend marketplace tables ─────────────────────────────────────────────────

ALTER TABLE marketplace_agents
  ADD COLUMN IF NOT EXISTS is_featured          BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_promoted          BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_order       SMALLINT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags                 TEXT[]    NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recent_installs_24h  INTEGER   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS search_vector        tsvector;

ALTER TABLE marketplace_templates
  ADD COLUMN IF NOT EXISTS is_featured          BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_promoted          BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_order       SMALLINT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags                 TEXT[]    NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recent_installs_24h  INTEGER   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS search_vector        tsvector;

-- ── App Favorites ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('agent','template')),
  target_id   UUID NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

-- ── App Usage Logs ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_usage_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('agent','template')),
  target_id   UUID NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('install','view','run','favorite','unfavorite')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_agent_fts          ON marketplace_agents    USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_template_fts       ON marketplace_templates USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_agent_featured     ON marketplace_agents    (featured_order)            WHERE is_published AND is_featured;
CREATE INDEX IF NOT EXISTS idx_template_featured  ON marketplace_templates (featured_order)            WHERE is_published AND is_featured;
CREATE INDEX IF NOT EXISTS idx_agent_trending     ON marketplace_agents    (recent_installs_24h DESC)  WHERE is_published;
CREATE INDEX IF NOT EXISTS idx_template_trending  ON marketplace_templates (recent_installs_24h DESC)  WHERE is_published;
CREATE INDEX IF NOT EXISTS idx_favorites_user     ON app_favorites(user_id, target_type);
CREATE INDEX IF NOT EXISTS idx_usage_logs_target  ON app_usage_logs(target_type, target_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user    ON app_usage_logs(user_id, created_at DESC);

-- ── FTS triggers ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _update_agent_fts() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.role, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION _update_template_fts() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.template_type, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agent_fts    ON marketplace_agents;
DROP TRIGGER IF EXISTS trg_template_fts ON marketplace_templates;

CREATE TRIGGER trg_agent_fts
  BEFORE INSERT OR UPDATE OF name, description, role, tags
  ON marketplace_agents FOR EACH ROW EXECUTE FUNCTION _update_agent_fts();

CREATE TRIGGER trg_template_fts
  BEFORE INSERT OR UPDATE OF name, description, template_type, tags
  ON marketplace_templates FOR EACH ROW EXECUTE FUNCTION _update_template_fts();

-- Backfill FTS vectors for existing rows
UPDATE marketplace_agents    SET name = name    WHERE search_vector IS NULL;
UPDATE marketplace_templates SET name = name    WHERE search_vector IS NULL;

-- ── Unified App Store View (with ranking score) ───────────────────────────────
-- Ranking formula:
--   installs_component = LEAST(install_count, 1000) / 1000  × 0.4
--   rating_component   = avg_rating / 5                     × 0.3
--   recency_component  = EXP(-days_old / 90)                × 0.2
--   trending_component = LEAST(24h_installs, 100) / 100     × 0.1

CREATE OR REPLACE VIEW app_store_view AS
WITH score AS (
  SELECT id, 'agent'::TEXT AS type,
    name, description, category, tags, 0 AS price_paise,
    install_count, avg_rating, review_count, recent_installs_24h,
    is_featured, is_promoted, featured_order, creator_id, created_at, search_vector,
    (
      LEAST(install_count::FLOAT, 1000) / 1000.0 * 0.4 +
      (COALESCE(avg_rating,0)::FLOAT / 5.0)       * 0.3 +
      EXP(-EXTRACT(EPOCH FROM (NOW()-created_at)) / 86400.0 / 90.0) * 0.2 +
      LEAST(recent_installs_24h::FLOAT, 100) / 100.0 * 0.1
    ) AS ranking_score
  FROM marketplace_agents WHERE is_published = TRUE

  UNION ALL

  SELECT id, 'template'::TEXT AS type,
    name, description, category, tags, price_paise,
    install_count, avg_rating, review_count, recent_installs_24h,
    is_featured, is_promoted, featured_order, creator_id, created_at, search_vector,
    (
      LEAST(install_count::FLOAT, 1000) / 1000.0 * 0.4 +
      (COALESCE(avg_rating,0)::FLOAT / 5.0)       * 0.3 +
      EXP(-EXTRACT(EPOCH FROM (NOW()-created_at)) / 86400.0 / 90.0) * 0.2 +
      LEAST(recent_installs_24h::FLOAT, 100) / 100.0 * 0.1
    ) AS ranking_score
  FROM marketplace_templates WHERE is_published = TRUE
)
SELECT * FROM score;

-- ── Personalized Recommendation Function ─────────────────────────────────────

CREATE OR REPLACE FUNCTION get_app_recommendations(p_user_id UUID, p_limit INT DEFAULT 8)
RETURNS TABLE(
  id UUID, type TEXT, name TEXT, description TEXT, category TEXT,
  tags TEXT[], price_paise INTEGER, install_count INTEGER,
  avg_rating NUMERIC, review_count INTEGER, recent_installs_24h INTEGER,
  is_featured BOOLEAN, creator_id UUID, created_at TIMESTAMPTZ, ranking_score FLOAT8
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_categories TEXT[];
BEGIN
  -- Discover user's preferred categories from installed apps
  SELECT ARRAY(
    SELECT DISTINCT cat FROM (
      SELECT ma.category AS cat
        FROM agents a
        JOIN marketplace_agents ma ON a.source_marketplace_agent_id = ma.id
       WHERE a.user_id = p_user_id AND ma.category IS NOT NULL
      UNION ALL
      SELECT mt.category AS cat
        FROM workflows w
        JOIN marketplace_templates mt ON w.source_marketplace_template_id = mt.id
       WHERE w.user_id = p_user_id AND mt.category IS NOT NULL
      UNION ALL
      SELECT mt.category AS cat
        FROM app_usage_logs ul
        JOIN marketplace_templates mt ON ul.target_id = mt.id AND ul.target_type = 'template'
       WHERE ul.user_id = p_user_id AND ul.action IN ('view','run')
         AND ul.created_at > NOW() - INTERVAL '30 days'
         AND mt.category IS NOT NULL
    ) c WHERE cat IS NOT NULL
  ) INTO v_categories;

  -- Cold start → return globally top-ranked
  IF v_categories IS NULL OR array_length(v_categories, 1) IS NULL THEN
    RETURN QUERY
      SELECT asv.id, asv.type, asv.name, asv.description, asv.category, asv.tags,
             asv.price_paise, asv.install_count, asv.avg_rating, asv.review_count,
             asv.recent_installs_24h, asv.is_featured, asv.creator_id,
             asv.created_at, asv.ranking_score
        FROM app_store_view asv
       ORDER BY asv.ranking_score DESC
       LIMIT p_limit;
    RETURN;
  END IF;

  -- Category-affinity recommendations, excluding already-installed
  RETURN QUERY
    SELECT asv.id, asv.type, asv.name, asv.description, asv.category, asv.tags,
           asv.price_paise, asv.install_count, asv.avg_rating, asv.review_count,
           asv.recent_installs_24h, asv.is_featured, asv.creator_id,
           asv.created_at, asv.ranking_score
      FROM app_store_view asv
     WHERE asv.category = ANY(v_categories)
       AND NOT (asv.type = 'agent' AND asv.id IN (
             SELECT source_marketplace_agent_id FROM agents
              WHERE user_id = p_user_id AND source_marketplace_agent_id IS NOT NULL))
       AND NOT (asv.type = 'template' AND asv.id IN (
             SELECT source_marketplace_template_id FROM workflows
              WHERE user_id = p_user_id AND source_marketplace_template_id IS NOT NULL))
     ORDER BY
       -- Boost apps that are in categories the user actively uses
       (CASE WHEN asv.category = ANY(v_categories) THEN 0.15 ELSE 0 END) + asv.ranking_score DESC
     LIMIT p_limit;
END;
$$;

-- ── Trending refresh (called by cron every hour) ──────────────────────────────

CREATE OR REPLACE FUNCTION refresh_trending_counts()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE marketplace_agents ma
  SET recent_installs_24h = (
    SELECT COUNT(*)::INTEGER FROM app_usage_logs ul
     WHERE ul.target_type = 'agent'  AND ul.target_id = ma.id
       AND ul.action = 'install' AND ul.created_at > NOW() - INTERVAL '24 hours'
  );
  UPDATE marketplace_templates mt
  SET recent_installs_24h = (
    SELECT COUNT(*)::INTEGER FROM app_usage_logs ul
     WHERE ul.target_type = 'template' AND ul.target_id = mt.id
       AND ul.action = 'install' AND ul.created_at > NOW() - INTERVAL '24 hours'
  );
END;
$$;

-- ── Analytics: per-app stats for admin ───────────────────────────────────────

CREATE OR REPLACE FUNCTION get_appstore_analytics(p_days INT DEFAULT 30)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_since TIMESTAMPTZ := NOW() - (p_days || ' days')::INTERVAL;
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_agents',    (SELECT COUNT(*) FROM marketplace_agents    WHERE is_published),
    'total_templates', (SELECT COUNT(*) FROM marketplace_templates WHERE is_published),
    'total_installs',  (SELECT COALESCE(SUM(install_count),0) FROM marketplace_agents) +
                       (SELECT COALESCE(SUM(install_count),0) FROM marketplace_templates),
    'total_revenue_paise', (
      SELECT COALESCE(SUM(amount_paise),0) FROM template_purchases
       WHERE status = 'completed' AND created_at > v_since
    ),
    'installs_period', (
      SELECT COUNT(*) FROM app_usage_logs
       WHERE action = 'install' AND created_at > v_since
    ),
    'top_agents', (
      SELECT json_agg(r) FROM (
        SELECT id, name, install_count, avg_rating, recent_installs_24h
          FROM marketplace_agents WHERE is_published
         ORDER BY install_count DESC LIMIT 5
      ) r
    ),
    'top_templates', (
      SELECT json_agg(r) FROM (
        SELECT id, name, install_count, avg_rating, price_paise, recent_installs_24h
          FROM marketplace_templates WHERE is_published
         ORDER BY install_count DESC LIMIT 5
      ) r
    ),
    'category_breakdown', (
      SELECT json_agg(r) FROM (
        SELECT category, COUNT(*) AS count,
               SUM(install_count) AS total_installs
          FROM (
            SELECT category, install_count FROM marketplace_agents    WHERE is_published
            UNION ALL
            SELECT category, install_count FROM marketplace_templates WHERE is_published
          ) t GROUP BY category ORDER BY total_installs DESC
      ) r
    )
  ) INTO v_result;
  RETURN v_result;
END;
$$;

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE app_favorites  ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_own"  ON app_favorites  FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "usage_own"      ON app_usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usage_insert"   ON app_usage_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
