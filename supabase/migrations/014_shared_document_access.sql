-- Migration 014: Shared document access for workspace members
--
-- Adds a nullable workspace FK to documents so a document owner can
-- share it with their workspace. Members of that workspace can then
-- read the document and its chunks via RLS.

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS shared_with_workspace_id uuid
    REFERENCES public.workspaces(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS documents_shared_workspace_idx
  ON public.documents(shared_with_workspace_id)
  WHERE shared_with_workspace_id IS NOT NULL;

-- Allow workspace members to SELECT shared documents
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'documents'
      AND policyname = 'documents_shared_workspace_select'
  ) THEN
    CREATE POLICY "documents_shared_workspace_select"
      ON public.documents FOR SELECT
      USING (
        shared_with_workspace_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.workspace_members wm
          WHERE wm.workspace_id = documents.shared_with_workspace_id
            AND wm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Allow workspace members to SELECT chunks of shared documents
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'document_chunks'
      AND policyname = 'document_chunks_shared_workspace_select'
  ) THEN
    CREATE POLICY "document_chunks_shared_workspace_select"
      ON public.document_chunks FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.documents d
          WHERE d.id = document_chunks.document_id
            AND d.shared_with_workspace_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM public.workspace_members wm
              WHERE wm.workspace_id = d.shared_with_workspace_id
                AND wm.user_id = auth.uid()
            )
        )
      );
  END IF;
END $$;

-- Clause risk flags: also visible to workspace members for shared docs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'clause_risk_flags'
      AND policyname = 'clause_risk_flags_shared_workspace'
  ) THEN
    CREATE POLICY "clause_risk_flags_shared_workspace"
      ON public.clause_risk_flags FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.documents d
          WHERE d.id = clause_risk_flags.document_id
            AND d.shared_with_workspace_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM public.workspace_members wm
              WHERE wm.workspace_id = d.shared_with_workspace_id
                AND wm.user_id = auth.uid()
            )
        )
      );
  END IF;
END $$;
