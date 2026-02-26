-- Migration 004: Admin Role and Activity Log
-- Run this in the Supabase SQL Editor
-- NOTE: The role column and activity_log table were already created manually.
--       This migration file documents the schema for reference and reproducibility.

-- 1. Add role column to users table (default 'user')
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- 2. Add is_restricted column to users table (default false)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN NOT NULL DEFAULT false;

-- 3. Create activity_log table
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  story_type TEXT,
  input_data JSONB,
  output_preview TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Add foreign key to public.users for joined queries
ALTER TABLE public.activity_log
  ADD CONSTRAINT activity_log_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 5. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action_type ON public.activity_log(action_type);

-- 6. Helper function to check admin status without RLS recursion
-- SECURITY DEFINER bypasses RLS on the internal query, breaking the recursion loop
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 7. RLS for activity_log
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Users can insert their own activity logs
CREATE POLICY "Users can insert own activity logs"
  ON public.activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own activity logs
CREATE POLICY "Users can read own activity logs"
  ON public.activity_log FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all activity logs
CREATE POLICY "Admins can read all activity logs"
  ON public.activity_log FOR SELECT
  USING (public.is_admin());

-- 8. Admin read access on users table (for activity log user join)
-- Uses is_admin() helper to avoid infinite recursion
CREATE POLICY "Admin can view all users"
  ON public.users FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- 9. Admin read access on narratives table
CREATE POLICY "Admin can view all narratives"
  ON public.narratives FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());
