-- Migration 016: Persist source page citations on assistant messages
-- Adds source_pages int[] to messages so the export route can include citations.

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS source_pages int[] DEFAULT NULL;
