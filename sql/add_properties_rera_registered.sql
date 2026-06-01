-- Explicit RERA flag for catalogue filter + badges (seed sets true on 1–2 demo rows only).
-- Run once in Supabase SQL Editor if the column is missing.

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS rera_registered BOOLEAN NOT NULL DEFAULT FALSE;
