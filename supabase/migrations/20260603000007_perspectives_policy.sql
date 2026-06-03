ALTER TABLE "perspectives" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own perspectives"
  ON "perspectives"
  FOR ALL
  USING ("user_id" = public.requesting_user_id())
  WITH CHECK ("user_id" = public.requesting_user_id());
