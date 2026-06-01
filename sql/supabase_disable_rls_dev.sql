-- SIMPLEST dev fix: turn off RLS on these tables so your Express server (anon key) can read/write.
-- Run in Supabase SQL Editor if you see "row-level security policy" errors.
-- Re-enable and add real policies before any public production deployment.

ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_logs DISABLE ROW LEVEL SECURITY;
