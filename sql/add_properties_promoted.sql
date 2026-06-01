-- Paid / spotlight placements on catalogue & home (“Featured sites”).
-- Safe to re-run.

ALTER TABLE public.properties
    ADD COLUMN IF NOT EXISTS promoted BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS properties_promoted_idx ON public.properties (promoted) WHERE promoted IS TRUE;
