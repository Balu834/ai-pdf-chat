-- ─── 005_agents.sql ───────────────────────────────────────────────────────────
-- AI Agents + Automation Workflows platform

-- ── AI Agents ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'General Assistant',
  instructions TEXT NOT NULL DEFAULT '',
  tools        TEXT[] NOT NULL DEFAULT '{}',  -- e.g. '{summarize_pdf,extract_fields}'
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  runs_count   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Per-agent execution log (one row per run)
CREATE TABLE IF NOT EXISTS agent_runs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input        JSONB NOT NULL DEFAULT '{}',
  output       JSONB,
  tool_calls   JSONB[] NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','failed')),
  error        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Workflows ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workflows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  trigger     TEXT NOT NULL DEFAULT 'manual' CHECK (trigger IN ('manual','pdf_upload','scheduled')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  runs_count  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Ordered steps within a workflow
CREATE TABLE IF NOT EXISTS workflow_steps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  position    SMALLINT NOT NULL DEFAULT 0,
  type        TEXT NOT NULL CHECK (type IN (
    'extract_fields','summarize','condition',
    'send_email','call_webhook','run_agent'
  )),
  config      JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Every workflow run: inputs, outputs, per-step logs
CREATE TABLE IF NOT EXISTS workflow_executions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  input       JSONB NOT NULL DEFAULT '{}',
  output      JSONB,
  step_logs   JSONB[] NOT NULL DEFAULT '{}',
  error       TEXT,
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Postgres-backed async job queue ──────────────────────────────────────────
-- Vercel cron at /api/cron/process-jobs polls this table every minute (Pro plan)
-- or daily (Hobby plan). Immediate sync execution also supported via ?sync=true.

CREATE TABLE IF NOT EXISTS job_queue (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type         TEXT NOT NULL CHECK (type IN ('workflow_run','agent_run')),
  payload      JSONB NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','done','failed')),
  attempts     SMALLINT NOT NULL DEFAULT 0,
  max_attempts SMALLINT NOT NULL DEFAULT 3,
  error        TEXT,
  result       JSONB,
  run_after    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_agents_user         ON agents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent    ON agent_runs(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_user      ON workflows(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_wf   ON workflow_steps(workflow_id, position);
CREATE INDEX IF NOT EXISTS idx_wf_executions_wf    ON workflow_executions(workflow_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wf_executions_user  ON workflow_executions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_queue_pending   ON job_queue(status, run_after) WHERE status = 'pending';

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE agents              ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows           ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps      ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_queue           ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agents_self"       ON agents              FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "agent_runs_self"   ON agent_runs          FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "workflows_self"    ON workflows           FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "wf_steps_via_wf"   ON workflow_steps      FOR ALL    USING (
  workflow_id IN (SELECT id FROM workflows WHERE user_id = auth.uid())
);
CREATE POLICY "wf_exec_self"      ON workflow_executions FOR SELECT USING (auth.uid() = user_id);
-- job_queue is service-role only (no client direct access)

-- ── RPC: claim next pending job atomically (skip-locked) ─────────────────────

CREATE OR REPLACE FUNCTION claim_next_job()
RETURNS SETOF job_queue LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
    UPDATE job_queue
    SET status     = 'running',
        attempts   = attempts + 1,
        updated_at = NOW()
    WHERE id = (
      SELECT id FROM job_queue
      WHERE status     = 'pending'
        AND run_after <= NOW()
        AND attempts   < max_attempts
      ORDER BY created_at
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *;
END;
$$;
