-- Urbanova dev: base tables + Hyderabad geo columns + permissive anon policies.
-- Paste into Supabase SQL Editor for the SAME project as server/.env (VITE_SUPABASE_URL).
--
-- Order: extensions → tables → geo migration → anon RLS (dev only; tighten for production).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'agent', 'admin')),
    verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    verification_document TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL,
    location TEXT NOT NULL,
    pincode TEXT,
    image TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Geo / feed columns (see migrate_hyderabad_geo_feed.sql)
ALTER TABLE public.properties
    ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS external_id TEXT,
    ADD COLUMN IF NOT EXISTS image_credit TEXT,
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

-- Dev: allow anon key (Express + seed) — replace with proper policies before production.
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_anon_users_all" ON public.users;
DROP POLICY IF EXISTS "dev_anon_properties_all" ON public.properties;
DROP POLICY IF EXISTS "dev_anon_logs_all" ON public.activity_logs;

CREATE POLICY "dev_anon_users_all"
  ON public.users FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "dev_anon_properties_all"
  ON public.properties FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "dev_anon_logs_all"
  ON public.activity_logs FOR ALL TO anon USING (true) WITH CHECK (true);
