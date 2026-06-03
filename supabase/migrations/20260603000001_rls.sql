-- Aktifkan RLS untuk semua tabel utama
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task_tags" ENABLE ROW LEVEL SECURITY;

-- Helper function di public schema
CREATE OR REPLACE FUNCTION public.requesting_user_id() RETURNS text AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$ LANGUAGE SQL stable;

-- Kebijakan RLS Projects
CREATE POLICY "Users can manage their own projects"
  ON "projects"
  FOR ALL
  USING ("user_id" = public.requesting_user_id())
  WITH CHECK ("user_id" = public.requesting_user_id());

-- Kebijakan RLS Tasks
CREATE POLICY "Users can manage their own tasks"
  ON "tasks"
  FOR ALL
  USING ("user_id" = public.requesting_user_id())
  WITH CHECK ("user_id" = public.requesting_user_id());

-- Kebijakan RLS Tags
CREATE POLICY "Users can manage their own tags"
  ON "tags"
  FOR ALL
  USING ("user_id" = public.requesting_user_id())
  WITH CHECK ("user_id" = public.requesting_user_id());
