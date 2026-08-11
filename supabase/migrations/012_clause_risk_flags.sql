-- Migration 012: Clause & Risk Flags cache table
-- Stores AI-generated clause/risk flag results per document to avoid re-running.

CREATE TABLE IF NOT EXISTS public.clause_risk_flags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  flags       jsonb NOT NULL DEFAULT '[]',
  generated_at timestamptz DEFAULT now(),
  UNIQUE(document_id)
);

ALTER TABLE public.clause_risk_flags ENABLE ROW LEVEL SECURITY;

-- Owners can read their own clause flags; writes go through service role
CREATE POLICY "clause_risk_flags_select_own"
  ON public.clause_risk_flags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = clause_risk_flags.document_id
        AND d.user_id = auth.uid()
    )
  );
