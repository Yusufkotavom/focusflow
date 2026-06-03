CREATE POLICY "Users can manage their own task tags"
  ON "task_tags"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM tasks
      WHERE tasks.id = task_tags.task_id
        AND tasks.user_id = public.requesting_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM tasks
      WHERE tasks.id = task_tags.task_id
        AND tasks.user_id = public.requesting_user_id()
    )
  );
