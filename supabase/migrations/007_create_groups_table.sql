-- ============================================================================
-- MIGRATION: 007_create_groups_table.sql
-- PURPOSE: Create the groups table for dealership group management
-- DATE: 2026-03-10
-- ============================================================================
-- MANUAL EXECUTION REQUIRED:
-- This migration must be run manually in the Supabase SQL Editor.
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Paste this entire file and click "Run"
-- 4. Verify the groups table exists in Table Editor
-- 5. Verify the group_id column was added to the users table
-- ============================================================================

-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  access_code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Add group_id to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id);

-- Create index for access code lookups
CREATE INDEX IF NOT EXISTS idx_groups_access_code ON public.groups(access_code);
CREATE INDEX IF NOT EXISTS idx_users_group_id ON public.users(group_id);

-- Enable RLS on groups table
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Owner can do everything with groups
CREATE POLICY "Owner full access to groups" ON public.groups
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'owner')
  );

-- Admins can view their own group
CREATE POLICY "Admins can view own group" ON public.groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can view their own group
CREATE POLICY "Users can view own group" ON public.groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM public.users WHERE id = auth.uid())
  );
