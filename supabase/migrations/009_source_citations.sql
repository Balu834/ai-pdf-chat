-- ── Migration 009: Source Citations + Multi-PDF Search ───────────────────────
-- Run in Supabase SQL Editor

-- 1. Add page_number to document_chunks
ALTER TABLE public.document_chunks
  ADD COLUMN IF NOT EXISTS page_number INTEGER;

CREATE INDEX IF NOT EXISTS idx_chunks_page
  ON document_chunks(document_id, page_number);

-- 2. Update match_document_chunks to return page_number
-- Must DROP first because the return type is changing (adding page_number column)
DROP FUNCTION IF EXISTS match_document_chunks(vector, uuid, integer);

CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding    vector(1536),
  match_document_id  uuid,
  match_count        int DEFAULT 5
)
RETURNS TABLE (
  id          bigint,
  content     text,
  page_number integer,
  similarity  float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    dc.id,
    dc.content,
    dc.page_number,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE dc.document_id = match_document_id
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 3. New RPC for multi-document vector search
CREATE OR REPLACE FUNCTION match_chunks_multi_doc(
  query_embedding vector(1536),
  doc_ids         uuid[],
  match_count     int DEFAULT 10
)
RETURNS TABLE (
  id          bigint,
  document_id uuid,
  content     text,
  page_number integer,
  similarity  float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.page_number,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE dc.document_id = ANY(doc_ids)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;

NOTIFY pgrst, 'reload schema';
