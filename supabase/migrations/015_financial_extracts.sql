-- Migration 015: Financial extracts cache table
-- Stores AI-extracted financial data per document.

CREATE TABLE IF NOT EXISTS public.financial_extracts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  data        jsonb NOT NULL DEFAULT '{}',
  generated_at timestamptz DEFAULT now(),
  UNIQUE(document_id)
);

ALTER TABLE public.financial_extracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financial_extracts_select_own"
  ON public.financial_extracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = financial_extracts.document_id
        AND d.user_id = auth.uid()
    )
  );

-- Visible to workspace members for shared docs
CREATE POLICY "financial_extracts_shared_workspace"
  ON public.financial_extracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = financial_extracts.document_id
        AND d.shared_with_workspace_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.workspace_members wm
          WHERE wm.workspace_id = d.shared_with_workspace_id
            AND wm.user_id = auth.uid()
        )
    )
  );
