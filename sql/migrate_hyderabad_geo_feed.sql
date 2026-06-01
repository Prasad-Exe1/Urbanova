-- Run in Supabase SQL Editor (safe to re-run where noted).

ALTER TABLE public.properties
    ADD COLUMN IF NOT EXISTS image_credit TEXT,
    ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS external_id TEXT,
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS geo_provider TEXT,
    ADD COLUMN IF NOT EXISTS geo_enriched_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS amenities_json JSONB,
    ADD COLUMN IF NOT EXISTS amenities_enriched_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS rera_registered BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS promoted BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'properties_external_id_key'
    ) THEN
        ALTER TABLE public.properties
            ADD CONSTRAINT properties_external_id_key UNIQUE (external_id);
    END IF;
END $$;
