-- Fix "permission denied" / RLS when using Supabase anon key from Express (course demo).
-- Run if inserts/selects fail. For production, replace with tighter policies.

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
