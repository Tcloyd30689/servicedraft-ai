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

-- 6. RLS for activity_log
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Users can insert their own activity logs
CREATE POLICY "Users can insert own activity logs"
  ON public.activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own activity logs
CREATE POLICY "Users can read own activity logs"
  ON public.activity_log FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all activity logs (check role in users table)
CREATE POLICY "Admins can read all activity logs"
  ON public.activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. Replace the existing users SELECT policy to also grant admin read access
-- (Admins need to see user names/emails in the activity log join)
-- Drop the old policy first, then create the combined one.
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

CREATE POLICY "Users can view own profile or admin can view all"
  ON public.users FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );
